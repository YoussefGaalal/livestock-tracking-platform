import { useContext } from 'react';
import { AuthContext, useRequireAuth, useRequireRole } from '../context/AuthContext';

// Re-export everything from AuthContext
export const useAuth = () => useContext(AuthContext);

export { useRequireAuth, useRequireRole };
export default useAuth;
