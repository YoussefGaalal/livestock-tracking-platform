import React from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';

const ROLES = [
  { name: 'Admin', description: 'Full system access and user management', permissions: ['all'] },
  { name: 'Owner', description: 'Manage own farm and team', permissions: ['manage_team', 'manage_animals', 'reports'] },
  { name: 'Manager', description: 'Manage shepherds and daily operations', permissions: ['manage_shepherds', 'tasks'] },
  { name: 'Shepherd', description: 'Care for animals and record data', permissions: ['record_data', 'view_animals'] },
  { name: 'Doctor', description: 'Medical care and health records', permissions: ['medical_records', 'view_animals'] },
];

export default function RolesPage() {
  const { t, dir } = useI18n();
  const { user } = useAuth();
  const isRtl = dir === 'rtl';

  const [rolesData, setRolesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await apiFetch('/api/admin/roles');
      if (res.ok) {
        const data = await res.json();
        setRolesData(data.roles || []);
      } else {
        setRolesData([]);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      setError('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const getRoleData = (roleName) => {
    return rolesData.find(r => r.name === roleName) || { user_count: 0, permissions: [] };
  };

  const getPermissionsDisplay = (roleName) => {
    const role = ROLES.find(r => r.name === roleName);
    if (!role) return [];
    if (role.permissions.includes('all')) return ['All Permissions'];
    return role.permissions;
  };

  const getRoleColor = (roleName) => {
    const colors = {
      Admin: 'bg-red-100 text-red-700 border-red-200',
      Owner: 'bg-amber-100 text-amber-700 border-amber-200',
      Manager: 'bg-purple-100 text-purple-700 border-purple-200',
      Shepherd: 'bg-blue-100 text-blue-700 border-blue-200',
      Doctor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
    return colors[roleName] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getRoleIcon = (roleName) => {
    const icons = {
      Admin: 'admin_panel_settings',
      Owner: 'person',
      Manager: 'manage_accounts',
      Shepherd: 'grass',
      Doctor: 'medical_services',
    };
    return icons[roleName] || 'badge';
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <MaterialSymbol icon="lock" size={48} className="text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
        <p className="text-gray-500 mt-2">This page is only accessible to administrators.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-primary">{t('roles.title') || 'Roles Management'}</h1>
          <p className="text-neutral-600 mt-1">{t('roles.description') || 'View and manage system roles and permissions'}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ROLES.map((role) => {
          const roleData = getRoleData(role.name);
          const permissions = getPermissionsDisplay(role.name);

          return (
            <div
              key={role.name}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${getRoleColor(role.name).split(' ')[0]}`}>
                    <MaterialSymbol icon={getRoleIcon(role.name)} size={28} className={getRoleColor(role.name).split(' ')[1]} />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRoleColor(role.name)}`}>
                    {role.name}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-brand-primary mb-2">{role.name}</h3>
                <p className="text-sm text-neutral-500 mb-4">{role.description}</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-t border-gray-100">
                    <span className="text-sm text-neutral-500">{t('roles.users') || 'Users'}</span>
                    <span className="font-bold text-brand-primary">{roleData.user_count || 0}</span>
                  </div>

                  <div className="border-t border-gray-100 pt-3">
                    <span className="text-sm text-neutral-500 block mb-2">{t('roles.permissions') || 'Permissions'}</span>
                    <div className="flex flex-wrap gap-2">
                      {permissions.map((perm) => (
                        <span
                          key={perm}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <Link
                  to={`/users?role=${role.name}`}
                  className="flex items-center justify-center gap-2 text-sm font-semibold text-brand-secondary hover:text-brand-primary transition-colors"
                >
                  <MaterialSymbol icon="people" size={18} />
                  {t('roles.viewUsers') || 'View Users'}
                  <MaterialSymbol icon={isRtl ? 'chevron_left' : 'chevron_right'} size={18} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}