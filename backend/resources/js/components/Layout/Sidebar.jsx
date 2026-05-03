import { MaterialSymbol } from 'react-material-symbols';
import { NavLink } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { t, dir } = useI18n();
  const { user } = useAuth();

  const isAdminOrOwner = user?.role === 'admin' || user?.role === 'owner';
  const isAdmin = user?.role === 'admin';

  const navItems = [
    { icon: 'dashboard', label: t('nav.dashboard'), to: '/dashboard' },
    ...(isAdminOrOwner ? [{ icon: 'group', label: t('nav.users'), to: '/users' }] : []),
    { icon: 'pets', label: t('nav.animals'), to: '/animals' },
    { icon: 'fence', label: t('nav.geofences'), to: '/geofences' },
    { icon: 'medical_services', label: t('nav.medicalRecords'), to: '/medical-records' },
    { icon: 'router', label: t('nav.devices'), to: '/devices' },
    { icon: 'map', label: t('nav.mapView'), to: '/map' },
    { icon: 'gavel', label: t('nav.auctions'), to: '/auctions' },
    { icon: 'notification_important', label: t('nav.alerts'), to: '/alerts' },
    { icon: 'task', label: t('nav.tasks'), to: '/tasks' },
    ...(isAdminOrOwner ? [{ icon: 'assessment', label: t('nav.reports'), to: '/reports' }] : []),
    ...(isAdmin ? [{ icon: 'settings', label: t('common.settings'), to: '/profile' }] : []),
  ];

  const isRtl = dir === 'rtl';

  return (
    <aside className={`hidden md:flex flex-col h-screen w-64 fixed ${isRtl ? 'right-0' : 'left-0'} top-0 bg-[#FAF1F5] dark:bg-[#002819] py-8 ${isRtl ? 'shadow-[-12px_0_32px_rgba(6,64,43,0.06)]' : 'shadow-[12px_0_32px_rgba(6,64,43,0.06)]'} z-50`}>
      <div className="px-6 mb-8">
        <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="w-10 h-10 bg-[#06402B] rounded-lg flex items-center justify-center">
            <MaterialSymbol icon="pets" size={24} className="text-[#D4AF37]" fill />
          </div>
          <div className={isRtl ? 'text-right' : ''}>
            <h2 className="text-lg font-black text-[#06402B] dark:text-[#D4AF37] leading-tight">
              Oasis Tracking
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-[#06402B]/60 font-bold">
              Digital Majlis Admin
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center py-3 px-6 transition-all font-['Manrope'] text-sm font-medium ${
                isActive
                  ? `bg-gradient-to-r from-[#002819] to-[#06402B] text-white ${isRtl ? 'rounded-l-full ml-4 -translate-x-1' : 'rounded-r-full mr-4 translate-x-1'}`
                  : 'text-[#06402B]/70 dark:text-[#FAF1F5]/60 hover:bg-[#F4F4EF] dark:hover:bg-[#06402B]/50'
              }`
            }
          >
            <MaterialSymbol
              icon={item.icon}
              size={20}
              className={isRtl ? 'ml-3' : 'mr-3'}
            />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 mt-auto">
        <button className="w-full py-4 bg-[#735c00] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#735c00]/20 hover:scale-[1.02] transition-transform">
          <MaterialSymbol icon="add_circle" size={20} />
          {t('nav.addNewEntry')}
        </button>
      </div>
    </aside>
  );
}
