import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 max-w-md w-full shadow-soft-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-4">
          <FileQuestion className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">404</h1>
        <h2 className="text-lg font-bold text-slate-700 mt-1">Page Not Found</h2>
        <p className="mt-2 text-sm text-slate-500">
          The academic resource or page you are looking for does not exist or has been relocated.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 inline-flex items-center space-x-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft-md hover:bg-brand-700 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
