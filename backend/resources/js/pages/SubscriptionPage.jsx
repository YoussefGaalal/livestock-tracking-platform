import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { useI18n } from '../i18n';

export default function SubscriptionPage() {
  const { t, dir } = useI18n();
  const isRtl = dir === 'rtl';
  const navigate = useNavigate();
  
  const [tiers, setTiers] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [uploading, setUploading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [processing, setProcessing] = useState(false);

  const isFromRegistration = localStorage.getItem('pending_subscription') === 'true';
  const isNewUser = !currentSubscription || currentSubscription?.status === 'none';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tiersRes, subscriptionRes] = await Promise.all([
        apiFetch('/api/subscription/tiers'),
        apiFetch('/api/subscription/current'),
      ]);
      
      if (tiersRes.ok) {
        const data = await tiersRes.json();
        setTiers(data.data || []);
      }
      
      if (subscriptionRes.ok) {
        const data = await subscriptionRes.json();
        const sub = data.subscription || data.data;
        setCurrentSubscription(sub);
        setLimits(data.limits);
        
        if ((sub?.status === 'active' || sub?.status === 'pending_payment') && isFromRegistration) {
          localStorage.removeItem('pending_subscription');
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openPaymentModal = (tier) => {
    setSelectedTier(tier);
    setPaymentMethod('card');
    setCardNumber('');
    setExpiry('');
    setCvc('');
    setShowPaymentModal(true);
  };

  const handleBankTransfer = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTier) return;
    
    setUploading(true);
    setMessage(null);
    
    const formData = new FormData();
    formData.append('tier_id', selectedTier.id);
    formData.append('payment_proof', file);
    formData.append('payment_method', 'bank_transfer');
    
    try {
      const response = await apiFetch('/api/subscription/bank-transfer', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Bank transfer proof uploaded! You will be notified once approved.' });
        setShowPaymentModal(false);
        if (isFromRegistration) {
          localStorage.removeItem('pending_subscription');
          navigate('/dashboard');
        }
        fetchData();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Failed to upload' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setUploading(false);
    }
  };

  const handleCardPayment = async () => {
    if (!cardNumber || !expiry || !cvc) {
      setMessage({ type: 'error', text: 'Please fill all card details' });
      return;
    }
    
    setProcessing(true);
    setMessage(null);
    
    try {
      const response = await apiFetch('/api/subscription/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier_id: selectedTier.id,
          payment_method: 'card',
          card_number: cardNumber,
          expiry: expiry,
          cvc: cvc,
        }),
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Payment successful! Your subscription is now active.' });
        setShowPaymentModal(false);
        if (isFromRegistration) {
          localStorage.removeItem('pending_subscription');
        }
        fetchData();
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Payment failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleActivateFreePlan = async (tier) => {
    try {
      const response = await apiFetch(`/api/subscription/subscribe/${tier.id}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        if (isFromRegistration) {
          localStorage.removeItem('pending_subscription');
        }
        navigate('/dashboard');
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Failed to activate subscription' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const formatPrice = (price) => {
    if (price === '0.00' || price === 0) return 'Free';
    return `$${parseFloat(price).toFixed(0)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#002819] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {(isFromRegistration || isNewUser) && currentSubscription?.status !== 'active' && currentSubscription?.status !== 'pending_payment' && (
        <div className="bg-gradient-to-r from-[#D4AF37]/20 to-[#002819]/10 border border-[#D4AF37] rounded-2xl p-6 text-center">
          <MaterialSymbol icon="celebration" size={48} className="text-[#D4AF37] mx-auto mb-3" weight="fill" />
          <h2 className="text-2xl font-bold text-[#002819] mb-2">Welcome to The Oasis!</h2>
          <p className="text-[#404943]">
            {isFromRegistration 
              ? 'Select a subscription plan to complete your registration and start managing your livestock.'
              : 'Choose a subscription plan to get started with your livestock management.'}
          </p>
        </div>
      )}

      <div>
        <h2 className="text-3xl font-bold text-[#002819]">Subscription Plans</h2>
        <p className="text-[#404943] mt-1">Choose the perfect plan for your livestock management needs</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {limits && currentSubscription?.status === 'active' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-[#002819] mb-4">Current Usage</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Animals', used: limits.animals?.used, max: limits.animals?.max },
              { label: 'Devices', used: limits.devices?.used, max: limits.devices?.max },
              { label: 'Users', used: limits.users?.used, max: limits.users?.max },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-2xl font-bold text-[#002819]">
                  {item.used} / {item.max === 0 ? 'Unlimited' : item.max}
                </div>
                <div className="text-sm text-[#717973]">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => {
          const isCurrent = currentSubscription?.tier_id === tier.id && currentSubscription?.status === 'active';
          const canSelect = !isCurrent && (!currentSubscription || currentSubscription?.status === 'none' || currentSubscription?.status === 'pending');
          
          return (
            <div
              key={tier.id}
              className={`bg-white rounded-2xl p-6 shadow-sm border-2 ${
                isCurrent ? 'border-[#D4AF37]' : 'border-transparent'
              }`}
            >
              {isCurrent && (
                <div className="bg-[#D4AF37] text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                  Current Plan
                </div>
              )}
              <h3 className="text-xl font-bold text-[#002819]">{tier.name}</h3>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-bold text-[#002819]">{formatPrice(tier.price_monthly)}</span>
                {tier.price_monthly !== '0.00' && tier.price_monthly !== 0 && (
                  <span className="text-[#717973]">/month</span>
                )}
              </div>
              <p className="text-sm text-[#717973] mb-4">{tier.description}</p>
              
              <ul className="space-y-2 mb-6">
                {[
                  { icon: 'pets', text: `${tier.max_animals === 0 ? 'Unlimited' : tier.max_animals} animals` },
                  { icon: 'sensors', text: `${tier.max_devices === 0 ? 'Unlimited' : tier.max_devices} devices` },
                  { icon: 'group', text: `${tier.max_users === 0 ? 'Unlimited' : tier.max_users} users` },
                  tier.has_geofencing && { icon: 'fence', text: 'Geofencing' },
                  tier.has_auctions && { icon: 'gavel', text: 'Auctions' },
                  tier.has_advanced_reports && { icon: 'analytics', text: 'Advanced Reports' },
                  tier.has_api_access && { icon: 'api', text: 'API Access' },
                ].filter(Boolean).map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-[#404943]">
                    <MaterialSymbol icon={item.icon} size={16} className="text-[#D4AF37]" />
                    {item.text}
                  </li>
                ))}
              </ul>

              {canSelect && (
                <button
                  onClick={() => openPaymentModal(tier)}
                  className="w-full py-3 bg-[#002819] text-white rounded-xl font-bold hover:bg-[#06402b] transition"
                >
                  {tier.price_monthly === '0.00' || tier.price_monthly === 0 ? 'Activate Free Plan' : 'Subscribe Now'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {showPaymentModal && selectedTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#002819]">
                {selectedTier.price_monthly === '0.00' || selectedTier.price_monthly === 0 ? 'Confirm Free Plan' : `Subscribe to ${selectedTier.name}`}
              </h3>
              {!isFromRegistration && (
                <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <MaterialSymbol icon="close" size={20} />
                </button>
              )}
            </div>

            <div className="bg-[#f4f4ef] rounded-xl p-4 mb-6">
              <div className="flex justify-between">
                <span className="text-[#717973]">Plan</span>
                <span className="font-bold text-[#002819]">{selectedTier.name}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[#717973]">Amount</span>
                <span className="font-bold text-[#D4AF37]">{formatPrice(selectedTier.price_monthly)}/mo</span>
              </div>
            </div>

            {(selectedTier.price_monthly === '0.00' || selectedTier.price_monthly === 0) ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MaterialSymbol icon="check_circle" size={20} className="text-emerald-500" />
                    <span className="font-bold text-emerald-700">Free Plan Includes:</span>
                  </div>
                  <ul className="text-sm text-emerald-700 space-y-1 ml-7">
                    <li>{selectedTier.max_animals === 0 ? 'Unlimited' : selectedTier.max_animals} animals</li>
                    <li>{selectedTier.max_devices === 0 ? 'Unlimited' : selectedTier.max_devices} devices</li>
                    <li>{selectedTier.max_users === 0 ? 'Unlimited' : selectedTier.max_users} users</li>
                  </ul>
                </div>
                <button
                  onClick={() => handleActivateFreePlan(selectedTier)}
                  className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition"
                >
                  Activate Free Plan
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 py-3 rounded-xl font-medium transition ${
                      paymentMethod === 'card' ? 'bg-[#002819] text-white' : 'bg-gray-100 text-[#404943]'
                    }`}
                  >
                    <MaterialSymbol icon="credit_card" size={20} className={isRtl ? 'ml-2' : 'mr-2'} />
                    Credit Card
                  </button>
                  <button
                    onClick={() => setPaymentMethod('bank')}
                    className={`flex-1 py-3 rounded-xl font-medium transition ${
                      paymentMethod === 'bank' ? 'bg-[#002819] text-white' : 'bg-gray-100 text-[#404943]'
                    }`}
                  >
                    <MaterialSymbol icon="account_balance" size={20} className={isRtl ? 'ml-2' : 'mr-2'} />
                    Bank Transfer
                  </button>
                </div>

                {paymentMethod === 'card' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#404943] mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#404943] mb-1">Expiry</label>
                        <input
                          type="text"
                          value={expiry}
                          onChange={(e) => setExpiry(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#404943] mb-1">CVC</label>
                        <input
                          type="text"
                          value={cvc}
                          onChange={(e) => setCvc(e.target.value)}
                          placeholder="123"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleCardPayment}
                      disabled={processing}
                      className="w-full py-3 bg-[#002819] text-white rounded-xl font-bold hover:bg-[#06402b] transition disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : 'Pay Now'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-sm text-blue-700 mb-2">
                        <strong>Bank Transfer Details:</strong>
                      </p>
                      <p className="text-sm text-blue-600">Bank: First Abu Dhabi Bank</p>
                      <p className="text-sm text-blue-600">Account: 1234567890</p>
                      <p className="text-sm text-blue-600">IBAN: AE123456789012345678901</p>
                      <p className="text-sm text-blue-600 mt-2">Reference: SUBS-{selectedTier.id}-{Date.now()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#404943] mb-2">Upload Payment Proof (PDF)</label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleBankTransfer}
                        disabled={uploading}
                        className="w-full"
                      />
                    </div>
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="w-full py-3 bg-gray-100 text-[#404943] rounded-xl font-medium hover:bg-gray-200 transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
