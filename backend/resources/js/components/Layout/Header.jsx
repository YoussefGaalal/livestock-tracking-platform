import { useState, useEffect } from 'react';
import { MaterialSymbol } from 'react-material-symbols';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import LanguageSwitcher from '../../i18n/LanguageSwitcher';
import { apiFetch } from '../../utils/api';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, dir } = useI18n();

  const isRtl = dir === 'rtl';

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch('/api/geofence-alerts?per_page=10');
      if (res.ok) {
        const data = await res.json();
        const alerts = data.data || [];
        setNotifications(alerts);
        setUnreadCount(alerts.filter(a => !a.is_acknowledged).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className={`sticky top-0 z-40 glass-nav border-b border-[#002819]/5 px-8 py-5 flex justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
      <div className={`flex items-center flex-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div className="relative w-full max-w-lg">
          <MaterialSymbol
            icon="search"
            size={20}
            className={`absolute top-1/2 -translate-y-1/2 text-[#717973] ${isRtl ? 'right-4' : 'left-4'}`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search')}
            className={`w-full py-3.5 bg-[#F4F4EF] rounded-xl border-none text-sm ${isRtl ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'} placeholder:text-[#717973]/60 focus:outline-none focus:ring-2 focus:ring-[#06402B]/20 transition-all`}
          />
        </div>
      </div>

      <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <button className="w-11 h-11 rounded-xl flex items-center justify-center text-[#002819] hover:bg-[#F4F4EF] transition-colors">
          <MaterialSymbol icon="help" size={22} />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-11 h-11 rounded-xl flex items-center justify-center text-[#002819] hover:bg-[#F4F4EF] transition-colors"
          >
            <MaterialSymbol icon="notifications" size={22} />
            {unreadCount > 0 && (
              <span className={`absolute top-2 w-2.5 h-2.5 bg-[#BA1A1A] rounded-full ${isRtl ? 'left-2' : 'right-2'}`} />
            )}
          </button>
          {showNotifications && (
            <div className={`absolute mt-3 w-96 bg-white rounded-2xl shadow-[0_12px_32px_rgba(6,64,43,0.12)] p-5 ${isRtl ? 'left-0 origin-top-left' : 'right-0 origin-top-right'}`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-[#002819] text-lg">{t('alerts.title')}</h4>
                <Link to="/alerts" onClick={() => setShowNotifications(false)} className="text-sm text-[#D4AF37] hover:underline">
                  View All
                </Link>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-[#717973] text-center py-4">No notifications</p>
                ) : (
                  notifications.slice(0, 5).map((alert) => (
                    <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-xl hover:bg-[#F4F4EF] transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${alert.type === 'exit' ? 'bg-[#BA1A1A]/10' : 'bg-[#D4AF37]/15'}`}>
                        <MaterialSymbol icon={alert.type === 'exit' ? 'exit_to_app' : 'login'} size={18} className={alert.type === 'exit' ? 'text-[#BA1A1A]' : 'text-[#735C00]'} />
                      </div>
                      <div className={`flex-1 ${isRtl ? 'text-right' : ''}`}>
                        <p className="text-sm font-semibold text-[#002819]">
                          {alert.animal?.animal_id} - {alert.type === 'entry' ? 'Entered' : 'Exited'}
                        </p>
                        <p className="text-xs text-[#717973] mt-0.5">{alert.geofence?.name || 'Geofence'}</p>
                        <p className="text-[10px] text-[#717973] mt-1">{new Date(alert.triggered_at).toLocaleString()}</p>
                      </div>
                      {!alert.is_acknowledged && (
                        <span className="w-2 h-2 bg-[#D4AF37] rounded-full" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-8 bg-[#002819]/10 mx-2" />

        <button
          onClick={handleLogout}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-[#002819] hover:bg-[#F4F4EF] transition-colors"
          title={t('auth.logout')}
        >
          <MaterialSymbol icon="logout" size={22} />
        </button>

        <div className="w-px h-8 bg-[#002819]/10 mx-2" />

        <div className="flex items-center gap-3">
          <div className={`text-right hidden sm:block ${isRtl ? 'text-left' : 'text-right'}`}>
            <p className="text-sm font-bold text-[#002819]">{user?.name || 'User'}</p>
            <p className="text-xs text-[#717973]">{user?.role || 'Guest'}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#002819] to-[#06402B] flex items-center justify-center text-white font-bold shadow-md">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>

        <div className="ml-2">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
