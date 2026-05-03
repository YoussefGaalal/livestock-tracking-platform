import { useAuth } from '../context/AuthContext';

export function useRole() {
  const { user } = useAuth();
  const role = user?.role || 'Guest';

  const hasRole = (requiredRole) => {
    const normalizedRole = requiredRole?.toLowerCase();
    const normalizedUserRole = role?.toLowerCase();
    return normalizedUserRole === normalizedRole;
  };

  const hasAnyRole = (roles) => {
    return roles.some(r => r?.toLowerCase() === role?.toLowerCase());
  };

  const hasPermission = (requiredRoles) => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return requiredRoles.some(r => r?.toLowerCase() === role?.toLowerCase());
  };

  return {
    role,
    hasRole,
    hasAnyRole,
    hasPermission,
    isAdmin: role === 'Admin',
    isOwner: role === 'Owner',
    isManager: role === 'Manager',
    isShepherd: role === 'Shepherd',
    isDoctor: role === 'Doctor',
  };
}