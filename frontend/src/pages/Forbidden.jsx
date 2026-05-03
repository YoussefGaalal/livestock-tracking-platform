import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { useAuth } from '../context/AuthContext';

export default function Forbidden() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleGoBack = () => {
    if (user?.role === 'Admin') {
      navigate('/dashboard');
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
          <MaterialSymbol icon="lock" size={40} className="text-red-600" />
        </div>
        
        <h1 className="text-6xl font-bold text-danger mb-4">403</h1>
        <p className="text-xl text-neutral-600 mb-4">Access Forbidden</p>
        
        <p className="text-neutral-600/70 mb-2">
          You don't have permission to access this page.
        </p>
        <p className="text-sm text-neutral-600/50 mb-8">
          Current role: <span className="font-semibold text-brand-primary">{user?.role || 'Guest'}</span>
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-secondary transition-all"
          >
            <MaterialSymbol icon="arrow_back" size={20} />
            Go Back
          </button>
          
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-brand-primary text-brand-primary rounded-xl font-bold hover:bg-brand-primary/5 transition-all"
          >
            <MaterialSymbol icon="logout" size={20} />
            Login as Different User
          </button>
        </div>
      </div>
    </div>
  );
}