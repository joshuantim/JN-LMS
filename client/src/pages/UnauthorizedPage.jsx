import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleReturn = () => {
    if (user?.role === 'ADMIN') navigate('/admin');
    else if (user?.role === 'INSTRUCTOR') navigate('/instructor');
    else navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 max-w-md w-full shadow-soft-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Access Restricted</h1>
        <p className="mt-2 text-sm text-slate-500">
          You do not have the required permissions to view this resource.
        </p>
        <button
          onClick={handleReturn}
          className="mt-6 inline-flex items-center space-x-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft-md hover:bg-brand-700 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
