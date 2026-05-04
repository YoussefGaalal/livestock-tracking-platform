import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_HIERARCHY = {
  'Admin': 100,
  'Owner': 80,
  'Manager': 60,
  'Doctor': 40,
  'Veterinarian': 40,
  'Shepherd': 20,
};

export function ProtectedRoute({ children, roles }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0) {
    const userLevel = ROLE_HIERARCHY[user.role] ?? 0;
    const requiredLevel = Math.max(...roles.map(r => ROLE_HIERARCHY[r] ?? 0));
    if (userLevel < requiredLevel) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

export function RoleRoute({ children, role }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = user.role;
  const allowedRoles = Array.isArray(role) ? role : [role];
  
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
