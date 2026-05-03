import React from 'react';
import { MaterialSymbol } from 'react-material-symbols';
import { NavLink } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { t, dir } = useI18n();
  const { user } = useAuth();

  const userRole = user?.role || 'Shepherd';
  
  const rolePermissions = {
    Admin: ['dashboard', 'animals', 'devices', 'geofences', 'tasks', 'medical', 'users', 'settings', 'reports', 'subscription', 'roles', 'auctions'],
    Owner: ['dashboard', 'animals', 'devices', 'geofences', 'tasks', 'medical', 'users', 'subscription', 'reports', 'auctions'],
    Manager: ['dashboard', 'animals', 'tasks', 'medical', 'reports'],
    Doctor: ['dashboard', 'animals', 'tasks', 'medical'],
    Shepherd: ['dashboard', 'animals', 'tasks', 'auctions'],
  };

  const permissions = rolePermissions[userRole] || [];
  
  const canAccess = (feature) => permissions.includes(feature);
  const canViewAll = (feature) => permissions.includes(feature) || userRole === 'Admin';
  const canViewAuctions = userRole === 'Admin' || userRole === 'Owner' || userRole === 'Shepherd';

  const navItems = [
    { icon: 'dashboard', label: t('nav.dashboard'), to: '/dashboard', feature: 'dashboard' },
    { icon: 'pets', label: t('nav.animals'), to: '/animals', feature: 'animals' },
    ...(canAccess('devices') ? [{ icon: 'router', label: t('nav.devices'), to: '/devices', feature: 'devices' }] : []),
    ...(canAccess('geofences') ? [{ icon: 'fence', label: t('nav.geofences'), to: '/geofences', feature: 'geofences' }] : []),
    ...(canAccess('medical') ? [{ icon: 'medical_services', label: t('nav.medicalRecords'), to: '/medical-records', feature: 'medical' }] : []),
    { icon: 'map', label: t('nav.mapView'), to: '/map', feature: 'map' },
    { icon: 'notification_important', label: t('nav.alerts'), to: '/alerts', feature: 'alerts' },
    ...(canAccess('tasks') ? [{ icon: 'task', label: t('nav.tasks'), to: '/tasks', feature: 'tasks' }] : []),
    ...(canViewAuctions ? [{ icon: 'gavel', label: t('nav.auctions'), to: '/auctions', feature: 'auctions' }] : []),
    ...(canAccess('reports') ? [{ icon: 'assessment', label: t('nav.reports'), to: '/reports', feature: 'reports' }] : []),
    ...(canViewAll('users') ? [{ icon: 'group', label: t('nav.users'), to: '/users', feature: 'users' }] : []),
    ...(userRole === 'Admin' ? [{ icon: 'admin_panel_settings', label: t('nav.roles'), to: '/settings/roles', feature: 'roles' }] : []),
    ...(userRole === 'Admin' || userRole === 'Owner' ? [{ icon: 'settings', label: t('common.settings'), to: '/profile', feature: 'settings' }] : []),
  ];

  const isRtl = dir === 'rtl';

  return (
    <aside className={`hidden md:flex flex-col h-screen w-64 fixed ${isRtl ? 'right-0' : 'left-0'} top-0 bg-brand-light dark:bg-brand-primary py-8 ${isRtl ? 'shadow-[-12px_0_32px_rgba(6,64,43,0.06)]' : 'shadow-[12px_0_32px_rgba(6,64,43,0.06)]'} z-50`}>
      <div className="px-6 mb-8">
        <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="w-10 h-10 bg-brand-secondary rounded-lg flex items-center justify-center">
            <MaterialSymbol icon="pets" size={24} className="text-brand-accent" fill />
          </div>
          <div className={isRtl ? 'text-right' : ''}>
            <h2 className="text-lg font-black text-brand-secondary dark:text-brand-accent leading-tight">
              Oasis Tracking
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-brand-secondary/60 font-bold">
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
                  ? `bg-gradient-to-r from-brand-primary to-brand-secondary text-white ${isRtl ? 'rounded-l-full ml-4 -translate-x-1' : 'rounded-r-full mr-4 translate-x-1'}`
                  : 'text-brand-secondary/70 dark:text-brand-light/60 hover:bg-neutral-100 dark:hover:bg-brand-secondary/50'
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
        <button className="w-full py-4 bg-yellow-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-yellow-800/20 hover:scale-[1.02] transition-transform">
          <MaterialSymbol icon="add_circle" size={20} />
          {t('nav.addNewEntry')}
        </button>
      </div>
    </aside>
  );
}
