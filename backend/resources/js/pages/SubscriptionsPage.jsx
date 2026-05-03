import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [tiers, setTiers] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState(null);
  const [showTierModal, setShowTierModal] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [allSubscriptions, setAllSubscriptions] = useState([]);
  const [owners, setOwners] = useState([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState(null);
  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    fetchData();
    if (isAdmin) fetchOwners();
  }, []);

  const fetchOwners = async () => {
    try {
      const res = await apiFetch('/api/users?per_page=100');
      if (res.ok) {
        const data = await res.json();
        setOwners(data.data?.filter(u => u.role === 'Owner') || []);
      }
    } catch (error) {
      console.error('Failed to fetch owners:', error);
    }
  };

  const fetchData = async () => {
    try {
      const [tiersRes, subscriptionRes] = await Promise.all([
        apiFetch('/api/subscription/tiers'),
        apiFetch(`/api/subscription/current${selectedOwnerId ? `?user_id=${selectedOwnerId}` : ''}`),
      ]);
      
      if (tiersRes.ok) {
        const data = await tiersRes.json();
        setTiers(data.data || []);
      }
      
      if (subscriptionRes.ok) {
        const data = await subscriptionRes.json();
        setCurrentSubscription(data.data);
        setLimits(data.limits);
      }

      if (isAdmin) {
        const subsRes = await apiFetch('/api/subscription/admin/subscriptions');
        if (subsRes.ok) {
          const subsData = await subsRes.json();
          setAllSubscriptions(subsData.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tier) => {
    if (!confirm(`Subscribe to ${tier.name} plan?`)) return;
    
    setActionLoading(tier.id);
    setMessage(null);
    
    try {
      const response = await apiFetch(`/api/subscription/subscribe/${tier.id}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: `Successfully subscribed to ${tier.name}!` });
        fetchData();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Failed to subscribe' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to subscribe' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpgrade = async (tier) => {
    if (!confirm(`Upgrade to ${tier.name}?`)) return;
    
    setActionLoading(tier.id);
    setMessage(null);
    
    try {
      const response = await apiFetch(`/api/subscription/upgrade/${tier.id}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: `Successfully upgraded to ${tier.name}!` });
        fetchData();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Failed to upgrade' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upgrade' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDowngrade = async (tier) => {
    if (!confirm(`Downgrade to ${tier.name}? You may lose access to some features.`)) return;
    
    setActionLoading(tier.id);
    setMessage(null);
    
    try {
      const response = await apiFetch(`/api/subscription/downgrade/${tier.id}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: `Successfully downgraded to ${tier.name}` });
        fetchData();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Failed to downgrade' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to downgrade' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    
    setActionLoading('cancel');
    setMessage(null);
    
    try {
      const response = await apiFetch('/api/subscription/cancel', {
        method: 'POST',
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Subscription cancelled successfully' });
        fetchData();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Failed to cancel' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to cancel subscription' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdminSetTier = async (userId, tierId) => {
    if (!confirm('Change this user\'s subscription tier?')) return;
    
    try {
      const response = await apiFetch(`/api/subscription/admin/set-tier/${userId}/${tierId}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Subscription tier updated successfully' });
        fetchData();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Failed to update tier' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update tier' });
    }
  };

  const handleDeleteTier = async (tier) => {
    if (!confirm(`Delete ${tier.name} tier? Users on this tier will be moved to Free.`)) return;
    
    try {
      const response = await apiFetch(`/api/subscription/admin/tiers/${tier.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Tier deleted successfully' });
        fetchData();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Failed to delete tier' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete tier' });
    }
  };

  const handleSaveTier = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    const tierData = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description'),
      price_monthly: parseFloat(formData.get('price_monthly')) || 0,
      price_yearly: parseFloat(formData.get('price_yearly')) || 0,
      trial_days: parseInt(formData.get('trial_days')) || 0,
      max_animals: parseInt(formData.get('max_animals')) || 0,
      max_devices: parseInt(formData.get('max_devices')) || 0,
      max_users: parseInt(formData.get('max_users')) || 0,
      has_geofencing: formData.get('has_geofencing') === 'on',
      has_auctions: formData.get('has_auctions') === 'on',
      has_advanced_reports: formData.get('has_advanced_reports') === 'on',
      has_api_access: formData.get('has_api_access') === 'on',
      sort_order: parseInt(formData.get('sort_order')) || 10,
      is_active: true,
    };

    try {
      const url = editingTier 
        ? `/api/subscription/admin/tiers/${editingTier.id}`
        : '/api/subscription/admin/tiers';
      const method = editingTier ? 'PUT' : 'POST';
      
      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tierData),
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: `Tier ${editingTier ? 'updated' : 'created'} successfully` });
        setShowTierModal(false);
        setEditingTier(null);
        fetchData();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Failed to save tier' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save tier' });
    }
  };

  const openEditTier = (tier) => {
    setEditingTier(tier);
    setShowTierModal(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getCurrentTierIndex = () => {
    if (!currentSubscription?.tier) return -1;
    return tiers.findIndex(t => t.id === currentSubscription.tier.id);
  };

  const currentTierIndex = getCurrentTierIndex();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#002819] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-gray-500 text-sm mt-1">Choose the perfect plan for your livestock management needs</p>
        </div>
        {isAdmin && owners.length > 0 && (
          <select
            value={selectedOwnerId || ''}
            onChange={(e) => {
              setSelectedOwnerId(e.target.value || null);
              fetchData();
            }}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm"
          >
            <option value="">All Owners</option>
            {owners.map(owner => (
              <option key={owner.id} value={owner.id}>{owner.name}</option>
            ))}
          </select>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Current Usage */}
      {currentSubscription && limits && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#002819] mb-4">Current Usage</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Animals', used: limits.animals.used, max: limits.animals.max, icon: 'pets' },
              { label: 'Devices', used: limits.devices.used, max: limits.devices.max, icon: 'sensors' },
              { label: 'Team Members', used: limits.users.used, max: limits.users.max, icon: 'group' },
            ].map((item) => (
              <div key={item.label} className="p-4 bg-[#f4f4ef] rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <MaterialSymbol icon={item.icon} size={20} className="text-[#735c00]" />
                  <span className="text-sm font-medium text-gray-600">{item.label}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#002819]">{item.used}</span>
                  <span className="text-gray-500">/ {item.max === 0 ? 'Unlimited' : item.max}</span>
                </div>
                {item.max > 0 && (
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${(item.used / item.max) > 0.9 ? 'bg-red-500' : (item.used / item.max) > 0.7 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min((item.used / item.max) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {currentSubscription.trial_ends_at && new Date(currentSubscription.trial_ends_at) > new Date() && (
            <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-sm text-amber-800">
                <MaterialSymbol icon="info" size={16} className="inline mr-1" />
                Trial period ends on {new Date(currentSubscription.trial_ends_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier, index) => {
          const isCurrentTier = currentSubscription?.tier?.id === tier.id;
          const isLowerTier = currentTierIndex > index;
          const isHigherTier = currentTierIndex < index;
          const isFree = tier.slug === 'free';

          return (
            <div
              key={tier.id}
              className={`relative bg-white rounded-2xl p-6 shadow-sm border-2 transition-all ${
                isCurrentTier 
                  ? 'border-[#D4AF37] ring-4 ring-[#D4AF37]/20' 
                  : isHigherTier 
                    ? 'border-emerald-200 hover:border-emerald-400' 
                    : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              {isCurrentTier && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-[#D4AF37] text-white text-xs font-bold rounded-full">
                    Current Plan
                  </span>
                </div>
              )}

              {tier.trial_days > 0 && !isCurrentTier && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                    {tier.trial_days} Day Trial
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-[#002819]">{tier.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{tier.description}</p>
              </div>

              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-[#002819]">{formatPrice(tier.price_monthly)}</span>
                  <span className="text-gray-500">/mo</span>
                </div>
                {tier.price_yearly > 0 && (
                  <p className="text-xs text-emerald-600 mt-1">
                    Save {formatPrice(tier.price_monthly * 12 - tier.price_yearly)}/year
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {[
                  { label: `${tier.max_animals === 0 ? 'Unlimited' : tier.max_animals} Animals`, icon: 'pets' },
                  { label: `${tier.max_devices === 0 ? 'Unlimited' : tier.max_devices} Devices`, icon: 'sensors' },
                  { label: `${tier.max_users === 0 ? 'Unlimited' : tier.max_users} Users`, icon: 'group' },
                  tier.has_geofencing && { label: 'Geofencing', icon: 'fence' },
                  tier.has_auctions && { label: 'Auctions', icon: 'gavel' },
                  tier.has_advanced_reports && { label: 'Advanced Reports', icon: 'analytics' },
                  tier.has_api_access && { label: 'API Access', icon: 'api' },
                ].filter(Boolean).map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <MaterialSymbol icon={feature.icon} size={16} className="text-emerald-500" />
                    {feature.label}
                  </li>
                ))}
              </ul>

              <div className="space-y-2">
                {isCurrentTier ? (
                  <>
                    {currentSubscription && !isFree && (
                      <button
                        onClick={handleCancel}
                        disabled={actionLoading === 'cancel'}
                        className="w-full py-3 border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Subscription'}
                      </button>
                    )}
                  </>
                ) : isLowerTier ? (
                  <button
                    onClick={() => handleDowngrade(tier)}
                    disabled={actionLoading === tier.id}
                    className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === tier.id ? 'Processing...' : 'Downgrade'}
                  </button>
                ) : (
                  <button
                    onClick={() => isCurrentTier ? null : handleUpgrade(tier)}
                    disabled={actionLoading === tier.id}
                    className="w-full py-3 bg-[#002819] text-white rounded-xl font-bold text-sm hover:bg-[#06402b] transition-colors disabled:opacity-50"
                  >
                    {actionLoading === tier.id ? 'Processing...' : isFree && !currentSubscription ? 'Subscribe Free' : 'Upgrade'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Section */}
      {isAdmin && (
        <div className="space-y-6">
          {/* Tier Management */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#002819]">Manage Subscription Tiers</h2>
              <button
                onClick={() => { setEditingTier(null); setShowTierModal(true); }}
                className="px-4 py-2 bg-[#002819] text-white rounded-xl font-bold text-sm hover:bg-[#06402b] transition-colors flex items-center gap-2"
              >
                <MaterialSymbol icon="add" size={18} />
                Add New Tier
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-600">Slug</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-600">Price (Mo/Yr)</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-600">Limits</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-600">Features</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((tier) => (
                    <tr key={tier.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#002819]">{tier.name}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{tier.slug}</td>
                      <td className="py-3 px-4 text-sm">
                        {formatPrice(tier.price_monthly)} / {formatPrice(tier.price_yearly)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {tier.max_animals === 0 ? 'Unlimited' : tier.max_animals} A / {tier.max_devices === 0 ? 'Unlimited' : tier.max_devices} D / {tier.max_users === 0 ? 'Unlimited' : tier.max_users} U
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex gap-1 flex-wrap">
                          {tier.has_geofencing && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">Geo</span>}
                          {tier.has_auctions && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Auc</span>}
                          {tier.has_advanced_reports && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">Rep</span>}
                          {tier.has_api_access && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">API</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditTier(tier)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <MaterialSymbol icon="edit" size={18} />
                          </button>
                          {tier.slug !== 'free' && (
                            <button
                              onClick={() => handleDeleteTier(tier)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <MaterialSymbol icon="delete" size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Subscriptions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#002819] mb-4">User Subscriptions</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-600">User</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-600">Current Tier</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-600">Change Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {allSubscriptions.map((sub) => (
                    <tr key={sub.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#002819]">{sub.user?.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{sub.user?.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 bg-[#D4AF37]/20 text-[#735c00] rounded-full text-sm font-medium">
                          {sub.tier?.name || 'No Tier'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          sub.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                          sub.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          onChange={(e) => e.target.value && handleAdminSetTier(sub.user_id, e.target.value)}
                          value={sub.tier_id}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#002819]/20"
                        >
                          <option value="">Change tier...</option>
                          {tiers.map((tier) => (
                            <option key={tier.id} value={tier.id}>{tier.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tier Modal */}
      {showTierModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#002819]">
                {editingTier ? 'Edit Tier' : 'Create New Tier'}
              </h2>
              <button onClick={() => { setShowTierModal(false); setEditingTier(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <MaterialSymbol icon="close" size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveTier} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingTier?.name || ''}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002819]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Slug</label>
                  <input
                    type="text"
                    name="slug"
                    defaultValue={editingTier?.slug || ''}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002819]/20"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  defaultValue={editingTier?.description || ''}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002819]/20"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Monthly Price (SAR)</label>
                  <input
                    type="number"
                    name="price_monthly"
                    defaultValue={editingTier?.price_monthly || 0}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002819]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Yearly Price (SAR)</label>
                  <input
                    type="number"
                    name="price_yearly"
                    defaultValue={editingTier?.price_yearly || 0}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002819]/20"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Trial Days</label>
                  <input
                    type="number"
                    name="trial_days"
                    defaultValue={editingTier?.trial_days || 0}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002819]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Max Animals (0=∞)</label>
                  <input
                    type="number"
                    name="max_animals"
                    defaultValue={editingTier?.max_animals || 0}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002819]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Max Devices (0=∞)</label>
                  <input
                    type="number"
                    name="max_devices"
                    defaultValue={editingTier?.max_devices || 0}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002819]/20"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Max Users (0=∞)</label>
                  <input
                    type="number"
                    name="max_users"
                    defaultValue={editingTier?.max_users || 0}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002819]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    name="sort_order"
                    defaultValue={editingTier?.sort_order || 10}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002819]/20"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Features</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="has_geofencing"
                      defaultChecked={editingTier?.has_geofencing}
                      className="w-4 h-4 text-[#002819] border-gray-300 rounded focus:ring-[#002819]"
                    />
                    <span className="text-sm">Geofencing</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="has_auctions"
                      defaultChecked={editingTier?.has_auctions}
                      className="w-4 h-4 text-[#002819] border-gray-300 rounded focus:ring-[#002819]"
                    />
                    <span className="text-sm">Auctions</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="has_advanced_reports"
                      defaultChecked={editingTier?.has_advanced_reports}
                      className="w-4 h-4 text-[#002819] border-gray-300 rounded focus:ring-[#002819]"
                    />
                    <span className="text-sm">Advanced Reports</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="has_api_access"
                      defaultChecked={editingTier?.has_api_access}
                      className="w-4 h-4 text-[#002819] border-gray-300 rounded focus:ring-[#002819]"
                    />
                    <span className="text-sm">API Access</span>
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#002819] text-white rounded-xl font-bold hover:bg-[#06402b] transition-colors"
                >
                  {editingTier ? 'Update Tier' : 'Create Tier'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowTierModal(false); setEditingTier(null); }}
                  className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
