import { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import Header from './Header';
import AIAssistant from '../AIAssistant';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';

const mainNavItems = [
  { path: '/dashboard', icon: 'dashboard', labelKey: 'nav.dashboard' },
  { path: '/animals', icon: 'pets', labelKey: 'nav.animals', hasSubmenu: true },
  { path: '/medical-records', icon: 'medical_services', labelKey: 'nav.medicalRecords', hasSubmenu: true },
  { path: '/devices', icon: 'sensors', labelKey: 'nav.devices' },
  { path: '/map', icon: 'map', labelKey: 'nav.mapView' },
  { path: '/auctions', icon: 'gavel', labelKey: 'nav.auctions', hasSubmenu: true, ownerOnly: true },
  { path: '/alerts', icon: 'warning', labelKey: 'nav.alerts' },
  { path: '/tasks', icon: 'task', labelKey: 'nav.tasks', hasSubmenu: true },
  { path: '/subscription', icon: 'credit_score', labelKey: 'nav.subscription', ownerOnly: true },
  { path: '/users', icon: 'group', labelKey: 'nav.users', hasSubmenu: true, ownerOnly: true },
  { path: '/settings', icon: 'settings', labelKey: 'settings.title', adminOnly: true },
];

const animalSubmenu = [
  { path: '/animals', labelKey: 'animals.title' },
  { path: '/animal-groups', labelKey: 'nav.animalGroups' },
  { path: '/geofences', labelKey: 'nav.geofences' },
];

const medicalSubmenu = [
  { path: '/medical-records', labelKey: 'nav.medicalRecords' },
  { path: '/vaccination-schedule', labelKey: 'nav.vaccinationSchedule' },
];

const auctionSubmenu = [
  { path: '/auctions', labelKey: 'nav.browseAuctions' },
  { path: '/my-payments', labelKey: 'nav.auctionPayments', ownerOnly: true },
  { path: '/payments', labelKey: 'nav.managePayments', adminOnly: true },
];

const usersSubmenu = [
  { path: '/users', labelKey: 'nav.users' },
  { path: '/team', labelKey: 'nav.team', adminOnly: true },
];

const tasksSubmenu = [
  { path: '/tasks', labelKey: 'tasks.title' },
  { path: '/task-logs-archive', labelKey: 'nav.taskLogs', ownerOnly: true },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [animalSubmenuOpen, setAnimalSubmenuOpen] = useState(false);
  const [auctionSubmenuOpen, setAuctionSubmenuOpen] = useState(false);
  const [usersSubmenuOpen, setUsersSubmenuOpen] = useState(true);
  const [tasksSubmenuOpen, setTasksSubmenuOpen] = useState(true);
  const [medicalSubmenuOpen, setMedicalSubmenuOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  const { t, dir } = useI18n();

  const isRtl = dir === 'rtl';

  const isAnimalsActive = location.pathname === '/animals' || location.pathname.startsWith('/animal-groups') || location.pathname === '/geofences';
  const isMedicalActive = location.pathname === '/medical-records' || location.pathname === '/vaccination-schedule';
  const isAuctionsActive = location.pathname === '/auctions' || location.pathname.startsWith('/my-payments') || location.pathname.startsWith('/payments');
  const isUsersActive = location.pathname === '/users' || location.pathname === '/team' || location.pathname.startsWith('/users/');
  const isTasksActive = location.pathname === '/tasks' || location.pathname.startsWith('/task-logs');

  const getSubmenu = (item) => {
    if (item.path === '/animals') return animalSubmenu;
    if (item.path === '/medical-records') return medicalSubmenu;
    if (item.path === '/auctions') return auctionSubmenu.filter(subItem => {
      if (subItem.adminOnly && user?.role !== 'Admin') return false;
      if (subItem.ownerOnly && !['Admin', 'Owner', 'Manager'].includes(user?.role)) return false;
      return true;
    });
    if (item.path === '/users') return usersSubmenu.filter(subItem => {
      if (subItem.adminOnly && user?.role !== 'Admin') return false;
      return true;
    });
    if (item.path === '/tasks') return tasksSubmenu.filter(subItem => {
      if (subItem.adminOnly && user?.role !== 'Admin') return false;
      if (subItem.ownerOnly && !['Admin', 'Owner', 'Manager'].includes(user?.role)) return false;
      return true;
    });
    return null;
  };

  const isSubmenuOpen = (item) => {
    if (item.path === '/animals') return animalSubmenuOpen;
    if (item.path === '/medical-records') return medicalSubmenuOpen;
    if (item.path === '/auctions') return auctionSubmenuOpen;
    if (item.path === '/users') return usersSubmenuOpen;
    if (item.path === '/tasks') return tasksSubmenuOpen;
    return false;
  };

  const toggleSubmenu = (item) => {
    if (item.path === '/animals') setAnimalSubmenuOpen(!animalSubmenuOpen);
    if (item.path === '/medical-records') setMedicalSubmenuOpen(!medicalSubmenuOpen);
    if (item.path === '/auctions') setAuctionSubmenuOpen(!auctionSubmenuOpen);
    if (item.path === '/users') setUsersSubmenuOpen(!usersSubmenuOpen);
    if (item.path === '/tasks') setTasksSubmenuOpen(!tasksSubmenuOpen);
  };

  const getSubmenuIcon = (subItem) => {
    if (subItem.path === '/animals') return 'pets';
    if (subItem.path === '/animal-groups') return 'groups';
    if (subItem.path === '/geofences') return 'fence';
    if (subItem.path === '/medical-records') return 'medical_services';
    if (subItem.path === '/vaccination-schedule') return 'vaccines';
    if (subItem.path === '/auctions') return 'gavel';
    if (subItem.path === '/my-payments') return 'account_balance_wallet';
    if (subItem.path === '/payments') return 'payments';
    if (subItem.path === '/users') return 'group';
    if (subItem.path === '/team') return 'groups';
    if (subItem.path === '/tasks') return 'task';
    if (subItem.path === '/task-logs-archive') return 'history';
    return 'chevron_right';
  };

  const visibleNavItems = mainNavItems.filter(item => {
    if (item.adminOnly && user?.role !== 'Admin') return false;
    if (item.ownerOnly && !['Admin', 'Owner'].includes(user?.role)) return false;
    return true;
  });

  return (
    <div className="flex min-h-screen bg-[#FAF1F5]">
      <aside className={`hidden md:flex flex-col h-screen fixed top-0 bg-gradient-to-b from-[#FAF1F5] to-[#F4F4EF] py-6 px-4 z-50 transition-all duration-300 ${
        isRtl ? 'right-0' : 'left-0'
      } ${sidebarCollapsed ? 'w-20' : 'w-72'}`}>
        <div className={`mb-8 ${sidebarCollapsed ? 'px-1' : ''}`}>
          <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''} ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-14 h-14 bg-gradient-to-br from-[#002819] to-[#06402B] rounded-2xl flex items-center justify-center shadow-lg shadow-[#002819]/20 flex-shrink-0">
              <MaterialSymbol icon="eco" size={28} className="text-[#D4AF37]" fill />
            </div>
            {!sidebarCollapsed && (
              <div className={isRtl ? 'text-right' : ''}>
                <h1 className="text-xl font-black text-[#002819] leading-tight">The Oasis</h1>
                <p className="text-[11px] uppercase tracking-wider text-[#06402B]/60 font-semibold">
                  Digital Majlis
                </p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`absolute top-8 w-8 h-8 rounded-xl bg-[#F4F4EF] flex items-center justify-center text-[#404943] hover:bg-[#E3E3DE] transition-colors ${
            isRtl ? 'left-4' : 'right-4'
          } ${sidebarCollapsed ? (isRtl ? 'left-8' : 'right-8') : ''}`}
        >
          <MaterialSymbol 
            icon={sidebarCollapsed ? (isRtl ? 'chevron_left' : 'chevron_right') : (isRtl ? 'chevron_right' : 'chevron_left')} 
            size={18} 
          />
        </button>

        <nav className="flex-1 space-y-2 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const submenu = getSubmenu(item);
            const isActive = item.path === '/animals' ? isAnimalsActive : item.path === '/medical-records' ? isMedicalActive : item.path === '/auctions' ? isAuctionsActive : item.path === '/users' ? isUsersActive : location.pathname === item.path;
            const menuOpen = isSubmenuOpen(item);
            
            return (
              <div key={item.path}>
                {submenu ? (
                  <>
                    <button
                      onClick={() => toggleSubmenu(item)}
                      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-semibold text-sm transition-all duration-300 ${
                        isRtl ? 'flex-row-reverse text-right' : ''
                      } ${sidebarCollapsed ? 'justify-center px-0' : 'px-5'} ${
                        isActive
                          ? 'bg-gradient-to-br from-[#002819] to-[#06402B] text-white shadow-lg shadow-[#002819]/20'
                          : 'text-[#404943] hover:bg-[#F4F4EF]'
                      }`}
                    >
                      <MaterialSymbol
                        icon={item.icon}
                        size={22}
                        weight={isActive ? 'fill' : 'regular'}
                      />
                      {!sidebarCollapsed && (
                        <>
                          <span className={`flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>{t(item.labelKey)}</span>
                          <MaterialSymbol
                            icon={menuOpen ? 'expand_less' : 'expand_more'}
                            size={20}
                            className={menuOpen ? 'rotate-180' : ''}
                          />
                        </>
                      )}
                    </button>
                    
                    {!sidebarCollapsed && menuOpen && (
                      <div className={`${isRtl ? 'mr-6' : 'ml-6'} mt-2 space-y-1`}>
                        {submenu.map((subItem) => (
                          <NavLink
                            key={subItem.path}
                            to={subItem.path}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                                isRtl ? 'flex-row-reverse text-right' : ''
                              } ${
                                isActive
                                  ? 'bg-[#D4AF37]/15 text-[#002819] font-semibold'
                                  : 'text-[#404943]/70 hover:bg-[#F4F4EF] hover:text-[#404943]'
                              }`
                            }
                          >
                            <MaterialSymbol
                              icon={getSubmenuIcon(subItem)}
                              size={18}
                            />
                            {t(subItem.labelKey)}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-4 px-4 py-4 rounded-2xl font-semibold text-sm transition-all duration-300 ${
                        isRtl ? 'flex-row-reverse text-right' : ''
                      } ${sidebarCollapsed ? 'justify-center px-0' : 'px-5'} ${
                        isActive
                          ? 'bg-gradient-to-br from-[#002819] to-[#06402B] text-white shadow-lg shadow-[#002819]/20'
                          : 'text-[#404943] hover:bg-[#F4F4EF]'
                      }`
                    }
                  >
                    <MaterialSymbol
                      icon={item.icon}
                      size={22}
                      weight={location.pathname === item.path ? 'fill' : 'regular'}
                    />
                    {!sidebarCollapsed && t(item.labelKey)}
                  </NavLink>
                )}
              </div>
            );
          })}
        </nav>

        <div className="mt-auto pt-8">
          {!sidebarCollapsed && (
            <button
              onClick={() => navigate('/animals/new')}
              className="w-full py-5 bg-gradient-to-br from-[#D4AF37] to-[#735C00] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#D4AF37]/25 flex items-center justify-center gap-3 hover:opacity-95 transition-opacity"
            >
              <MaterialSymbol icon="add_circle" size={22} />
              {t('nav.addNewEntry')}
            </button>
          )}

          <NavLink
            to="/profile"
            className={`flex items-center gap-4 mt-6 p-3 rounded-2xl bg-[#F4F4EF] hover:bg-[#E3E3DE] transition-colors ${isRtl ? 'flex-row-reverse' : ''} ${sidebarCollapsed ? 'justify-center p-2' : ''}`}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#002819] to-[#06402B] flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {!sidebarCollapsed && (
              <div className={isRtl ? 'text-right flex-1' : ''}>
                <p className="text-sm font-bold text-[#002819]">{user?.name || 'User'}</p>
                <p className="text-xs text-[#404943]/60">{user?.role || 'Guest'}</p>
              </div>
            )}
          </NavLink>
        </div>
      </aside>

      <main className={`flex-1 ${isRtl ? 'md:mr-72' : 'md:ml-72'} ${sidebarCollapsed ? (isRtl ? 'md:mr-20' : 'md:ml-20') : ''} transition-all duration-300`}>
        <Header />
        <div className="p-8 lg:p-10">
          <Outlet />
        </div>
      </main>
      <AIAssistant />
    </div>
  );
}
