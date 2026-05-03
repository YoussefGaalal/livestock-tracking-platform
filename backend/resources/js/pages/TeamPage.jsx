import { useState, useEffect } from 'react';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';

export default function TeamPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [expandedOwners, setExpandedOwners] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'Shepherd',
    managed_by: '',
  });

  const isAdmin = user?.role === 'Admin';

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <MaterialSymbol icon="lock" size={48} className="text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
        <p className="text-gray-500 mt-2">This page is only accessible to administrators.</p>
      </div>
    );
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const usersRes = await apiFetch('/api/users');
      if (usersRes.ok) {
        const data = await usersRes.json();
        setAllUsers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);

    try {
      const ownerId = user?.role === 'Admin' ? formData.managed_by : user?.id;
      
      const response = await apiFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          role: formData.role,
          managed_by: ownerId,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: t('teamPage.addSuccess', { role: formData.role }) });
        setShowAddModal(false);
        setFormData({ name: '', email: '', password: '', phone: '', role: 'Shepherd', managed_by: '' });
        fetchData();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || t('teamPage.failedAdd') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('teamPage.failedAdd') });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignOwner = async (userToAssign, ownerId) => {
    if (!ownerId) return;
    if (!confirm(t('teamPage.assignConfirm', { name: userToAssign.name }))) return;

    setActionLoading(true);
    try {
      const response = await apiFetch(`/api/users/${userToAssign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managed_by: ownerId }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: t('teamPage.assignSuccess') });
        setShowAssignModal(false);
        fetchData();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || t('teamPage.failedAssign') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('teamPage.failedAssign') });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm(t('teamPage.removeConfirm'))) return;

    try {
      const response = await apiFetch(`/api/users/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managed_by: null }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: t('teamPage.removedSuccess') });
        fetchData();
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('teamPage.failedRemove') });
    }
  };

  const toggleOwner = (ownerId) => {
    setExpandedOwners(prev => ({
      ...prev,
      [ownerId]: !prev[ownerId]
    }));
  };

  const owners = allUsers.filter(u => u.role === 'Owner');
  const availableUsers = allUsers.filter(u => !u.managed_by && u.role !== 'Owner' && u.role !== 'Admin' && u.id !== user?.id);

  const getMembersForOwner = (ownerId) => {
    return allUsers.filter(u => u.managed_by === ownerId);
  };

  const getRoleBadge = (role) => {
    const styles = {
      Manager: 'bg-purple-100 text-purple-700',
      Shepherd: 'bg-blue-100 text-blue-700',
      Owner: 'bg-amber-100 text-amber-700',
      Admin: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[role] || 'bg-gray-100 text-gray-700'}`}>
        {role}
      </span>
    );
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Manager': return 'manage_accounts';
      case 'Shepherd': return 'grass';
      case 'Owner': return 'person';
      default: return 'person';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#002819] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#002819]">{t('team.title')}</h1>
          <p className="text-[#404943] mt-1">{t('teamPage.viewManage')}</p>
        </div>
        {(isAdmin || user?.role === 'Owner') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-[#002819] text-white rounded-xl font-bold text-sm hover:bg-[#06402b] transition-all shadow-lg shadow-[#002819]/20"
          >
            <MaterialSymbol icon="person_add" size={20} />
            {t('teamPage.addMember')}
          </button>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Owners and their teams */}
      <div className="space-y-4">
        {owners.map(owner => {
          const members = getMembersForOwner(owner.id);
          const isExpanded = expandedOwners[owner.id];
          const isOwnTeam = owner.id === user?.id;

          return (
            <div key={owner.id} className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-[#c0c9c1]/20">
              {/* Owner Header */}
              <div 
                className={`p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${isOwnTeam ? 'bg-amber-50/50' : ''}`}
                onClick={() => toggleOwner(owner.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl ${isOwnTeam ? 'bg-amber-500' : 'bg-[#06402b]'}`}>
                    {owner.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-[#002819]">{owner.name}</h3>
                      {getRoleBadge(owner.role)}
                      {isOwnTeam && (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">{t('team.yourAccount')}</span>
                      )}
                    </div>
                    <p className="text-sm text-[#4f6357]">{owner.email}</p>
                    <p className="text-xs text-[#717973] mt-1">
                      {members.length} {t('teamPage.members')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <MaterialSymbol 
                    icon={isExpanded ? 'expand_less' : 'expand_more'} 
                    size={28} 
                    className="text-[#4f6357]" 
                  />
                </div>
              </div>

              {/* Team Members (expandable) */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  {members.length === 0 ? (
                    <div className="p-8 text-center">
                      <MaterialSymbol icon="group_off" size={40} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-[#717973]">{t('teamPage.noMembers')}</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {members.map(member => (
                        <div key={member.id} className="p-4 pl-20 flex items-center justify-between hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                              member.role === 'Manager' ? 'bg-purple-500' : 'bg-blue-500'
                            }`}>
                              <MaterialSymbol icon={getRoleIcon(member.role)} size={20} />
                            </div>
                            <div>
                              <p className="font-semibold text-[#002819]">{member.name}</p>
                              <p className="text-xs text-[#717973]">{member.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {getRoleBadge(member.role)}
                            {(isAdmin || isOwnTeam) && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveMember(member.id); }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove from team"
                              >
                                <MaterialSymbol icon="person_remove" size={20} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {owners.length === 0 && (
          <div className="bg-white rounded-[2rem] p-12 text-center shadow-sm">
            <MaterialSymbol icon="group_off" size={64} className="text-gray-300 mx-auto mb-4" />
            <p className="text-[#404943] text-lg font-semibold">{t('teamPage.noOwners')}</p>
            <p className="text-[#717973] text-sm mt-2">{t('teamPage.ownerAppear')}</p>
          </div>
        )}
      </div>

      {/* Admin: Unassigned Users Section */}
      {isAdmin && availableUsers.length > 0 && (
        <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-[#c0c9c1]/20">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-[#002819] flex items-center gap-3">
              <MaterialSymbol icon="person_search" size={24} className="text-[#4f6357]" />
              {t('team.unassignedUsers')}
            </h2>
            <p className="text-sm text-[#717973] mt-1">{t('teamPage.noOwner')}</p>
          </div>
          <div className="divide-y divide-gray-100">
            {availableUsers.map(u => (
              <div key={u.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    u.role === 'Manager' ? 'bg-purple-500' : 'bg-blue-500'
                  }`}>
                    <MaterialSymbol icon={getRoleIcon(u.role)} size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-[#002819]">{u.name}</p>
                    <p className="text-xs text-[#717973]">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getRoleBadge(u.role)}
                  <select
                    onChange={(e) => e.target.value && handleAssignOwner(u, parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                    defaultValue=""
                  >
                    <option value="">{t('teamPage.selectOwner')}</option>
                    {owners.map(owner => (
                      <option key={owner.id} value={owner.id}>{owner.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Team Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-[#002819]">{t('teamPage.addMember')}</h2>
              <p className="text-sm text-[#717973] mt-1">
                {isAdmin ? t('teamPage.assignToOwner') : t('teamPage.addToTeam')}
              </p>
            </div>
            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('users.owner')}</label>
                  <select
                    value={formData.managed_by}
                    onChange={(e) => setFormData({ ...formData, managed_by: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    required
                  >
                    <option value="">{t('teamPage.selectOwner')}</option>
                    {owners.map(owner => (
                      <option key={owner.id} value={owner.id}>{owner.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('users.role')}</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="Shepherd">{t('users.shepherd')}</option>
                  <option value="Manager">{t('users.manager')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('users.name')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('users.email')}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('teamPage.password')}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('teamPage.phoneOptional')}</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-[#002819] text-white rounded-lg hover:bg-[#06402b] disabled:opacity-50 font-medium"
                >
                  {actionLoading ? t('teamPage.adding') : t('teamPage.addMember')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
