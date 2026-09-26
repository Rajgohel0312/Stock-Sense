import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Boxes } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';

export default function AuthLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (!loading && isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Boxes className="w-7 h-7" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white font-sans">
            StockSense
          </span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-100">
          <Outlet />
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          Enterprise Stock & Inventory Control System &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
