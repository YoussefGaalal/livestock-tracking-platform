import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { exportData } from '../utils/export';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';

export default function UserList() {
  const { t, dir } = useI18n();
  const { user } = useAuth();
  const isRtl = dir === 'rtl';

  const [users, setUsers] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState(null);
  const [exporting, setExporting] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  
  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    fetchData();
  }, [currentPage, perPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, tiersRes] = await Promise.all([
        apiFetch(`/api/users?per_page=${perPage}&page=${currentPage}`),
        apiFetch('/api/subscription/tiers'),
      ]);
      
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.data || []);
        setTotalUsers(usersData.meta?.total || usersData.total || 0);
      }
      
      if (tiersRes.ok) {
        const tiersData = await tiersRes.json();
        setTiers(tiersData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const search = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.phone?.includes(searchQuery)
    );
  });

  const totalPages = Math.ceil(totalUsers / perPage);

  const canHaveSubscription = (role) => role === 'Owner' || role === 'Admin';
  const getTierName = (tierId) => {
    if (!tierId) return null;
    const tier = tiers.find(t => t.id === tierId);
    return tier?.name || null;
  };
  const roleColors = { Admin: 'bg-[#002819]/5 text-[#002819]', Manager: 'bg-[#eeeee9] text-[#404943]', Owner: 'bg-[#D4AF37]/20 text-[#735c00]', Shepherd: 'bg-[#eeeee9] text-[#404943]' };

  const handleDelete = async (userId) => {
    if (!confirm('Delete this user?')) return;
    try {
      const response = await apiFetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (response.ok) { 
        setMessage({ type: 'success', text: 'User deleted!' }); 
        fetchData(); 
        setTimeout(() => setMessage(null), 3000); 
      }
    } catch (error) { 
      setMessage({ type: 'error', text: 'Failed to delete' }); 
    }
  };

  const handleExport = async () => {
    setExporting(true);
    const success = await exportData('/api/export/users', `users_${new Date().toISOString().split('T')[0]}.csv`);
    if (success) {
      setMessage({ type: 'success', text: t('common.exported') });
    } else {
      setMessage({ type: 'error', text: t('common.exportFailed') });
    }
    setTimeout(() => setMessage(null), 3000);
    setExporting(false);
  };

  const showSubscriptionColumn = filteredUsers.some(u => canHaveSubscription(u.role));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-[#002819] border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-8">
      <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 ${isRtl ? 'text-right' : ''}`}>
        <div>
          <h2 className="text-4xl font-black text-[#002819]">{t('users.title')}</h2>
          <p className="text-[#404943] mt-2 font-medium">Coordinate access for your digital oasis ecosystem.</p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-4 py-2 bg-[#D4AF37] text-white rounded-xl font-bold hover:bg-[#c9a030] transition flex items-center gap-2 disabled:opacity-50"
            >
              <MaterialSymbol icon="download" size={20} />
              {exporting ? t('common.exporting') : t('common.export')}
            </button>
          )}
          <Link to="/users/add" className="btn-primary flex items-center gap-2 w-fit">
            <MaterialSymbol icon="person_add" size={18} />
            {t('users.addUser')}
          </Link>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-[#cfe5d6] text-[#002819]' : 'bg-[#ffdad6] text-[#93000a]'}`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[240px] relative">
          <MaterialSymbol icon="search" size={20} className={`absolute top-1/2 -translate-y-1/2 text-[#717973] ${isRtl ? 'right-4 left-auto' : 'left-4'}`} />
          <input 
            type="text" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder={t('common.search')}
            className={`w-full bg-white border-none rounded-xl py-3 text-sm shadow-sm focus:ring-2 focus:ring-[#06402b]/10 ${isRtl ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'}`} 
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F4F4EF]/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#404943]">{t('users.name')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#404943]">{t('users.role')}</th>
                {showSubscriptionColumn && <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#404943]">{t('users.subscription')}</th>}
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#404943]">Status</th>
                <th className={`px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#404943] ${isRtl ? 'text-left' : 'text-right'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F4EF]">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#F4F4EF]/30 transition-colors">
                  <td className="px-6 py-5">
                    <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#002819] to-[#06402B] flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-[#002819]">{user.name}</p>
                        <p className="text-sm text-[#717973]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-4 py-2 rounded-full text-xs font-bold ${roleColors[user.role] || 'bg-[#eeeee9] text-[#404943]'}`}>
                      {user.role || 'User'}
                    </span>
                  </td>
                  {showSubscriptionColumn && (
                    <td className="px-6 py-5">
                      {canHaveSubscription(user.role) ? (
                        getTierName(user.subscription_tier_id) ? (
                          <span className="px-4 py-2 rounded-full text-xs font-bold bg-[#D4AF37]/20 text-[#735c00]">
                            {getTierName(user.subscription_tier_id)}
                          </span>
                        ) : (
                          <span className="text-sm text-[#717973]">No tier</span>
                        )
                      ) : (
                        <span className="text-sm text-[#717973]/60 italic">Inherited</span>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                      user.is_active !== false ? 'bg-[#cfe5d6] text-[#002819]' : 'bg-[#ffdad6] text-[#93000a]'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${user.is_active !== false ? 'bg-[#002819]' : 'bg-[#93000a]'}`} />
                      {user.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className={`px-6 py-5 ${isRtl ? 'text-left' : 'text-right'}`}>
                    <div className={`flex items-center gap-1 ${isRtl ? 'justify-start' : 'justify-end'}`}>
                      <Link to={`/users/${user.id}/edit`} className="p-3 text-[#717973] hover:text-[#002819] hover:bg-[#F4F4EF] rounded-xl transition-all">
                        <MaterialSymbol icon="edit" size={20} />
                      </Link>
                      <button onClick={() => handleDelete(user.id)} className="p-3 text-[#717973] hover:text-[#BA1A1A] hover:bg-[#ffdad6]/50 rounded-xl transition-all">
                        <MaterialSymbol icon="delete" size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="p-12 text-center text-[#717973]">
            <MaterialSymbol icon="person_off" size={48} className="mx-auto mb-4 opacity-50" />
            <p>{t('common.noData')}</p>
          </div>
        )}

        {filteredUsers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            perPage={perPage}
            total={totalUsers}
            onPageChange={setCurrentPage}
            onPerPageChange={(value) => { setPerPage(value); setCurrentPage(1); }}
          />
        )}
      </div>
    </div>
  );
}
