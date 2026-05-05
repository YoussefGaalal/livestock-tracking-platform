import { useState, useEffect } from 'react';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../../utils/api';
import { useI18n } from '../../i18n';

export default function RoleManagement() {
  const { t } = useI18n();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  const fetchRolesAndPermissions = async () => {
    setLoading(true);
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        apiFetch('/api/admin/roles'),
        apiFetch('/api/admin/permissions'),
      ]);

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData.data || rolesData || []);
      }

      if (permissionsRes.ok) {
        const permissionsData = await permissionsRes.json();
        setPermissions(permissionsData.data || permissionsData || []);
      }
    } catch (error) {
      console.error('Failed to fetch roles/permissions:', error);
      setMessage({ type: 'error', text: t('settings.fetchError') });
    } finally {
      setLoading(false);
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
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Roles Section */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[#002819] rounded-xl flex items-center justify-center">
            <MaterialSymbol icon="admin_panel_settings" size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#002819]">{t('settings.roleManagement')}</h3>
            <p className="text-sm text-[#717973]">{t('settings.roleManagementDesc')}</p>
          </div>
        </div>

        <div className="space-y-4">
          {roles.map(role => (
            <div key={role.id} className="p-4 bg-[#F4F4EF] rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-[#002819]">{role.name}</h4>
                <span className="text-xs font-bold text-[#717973] bg-white px-2 py-1 rounded-full">
                  {role.users_count || 0} {t('settings.users')}
                </span>
              </div>
              {role.permissions && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {role.permissions.slice(0, 5).map(perm => (
                    <span key={perm.id} className="text-xs bg-white text-[#404943] px-2 py-1 rounded-lg">
                      {perm.name}
                    </span>
                  ))}
                  {role.permissions.length > 5 && (
                    <span className="text-xs text-[#717973]">+{role.permissions.length - 5} more</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Section */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[#002819] rounded-xl flex items-center justify-center">
            <MaterialSymbol icon="key" size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#002819]">{t('settings.permissions')}</h3>
            <p className="text-sm text-[#717973]">{t('settings.permissionsDesc')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {permissions.map(perm => (
            <div key={perm.id} className="p-3 bg-[#F4F4EF] rounded-lg">
              <p className="text-sm font-bold text-[#002819]">{perm.name}</p>
              <p className="text-xs text-[#717973] mt-1">{perm.description || ''}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
