import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';
import { ShieldAlert } from 'lucide-react';
import Button from '../components/ui/Button';

export default function RoleRoute({ allowedRoles = [] }) {
  const { user, hasRole } = useAuth();

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (allowedRoles.length > 0 && !hasRole(...allowedRoles)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
        <p className="text-sm text-slate-500 max-w-md mt-2 mb-6">
          Your role (<span className="font-semibold capitalize">{user.role}</span>) does not have
          administrative permission to access this module.
        </p>
        <Button variant="secondary" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return <Outlet />;
}
