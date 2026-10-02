import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PlaceholderPage = ({ title, description, phase, badge = 'Phase Active' }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-brand-100 text-brand-800 mb-2">
            {badge}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-500 max-w-xl">
            {description}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-soft-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-4">
          <Sparkles className="h-7 w-7 text-accent-600" />
        </div>
        <h3 className="text-base font-bold text-slate-900">
          Module Connected: {title}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-xs text-slate-500 leading-relaxed">
          The database schema, Prisma relations, and secure API architecture for this section are established in Phase 1. Complete interactive UI workflow unlocks in {phase}.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;
