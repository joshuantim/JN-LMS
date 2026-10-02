import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { GraduationCap, Sparkles, BookOpen, ShieldCheck } from 'lucide-react';

export const AuthLayout = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'INSTRUCTOR') return <Navigate to="/instructor" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Left side: Premium branding & feature showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-slate-950 p-12 text-white flex-col justify-between">
        {/* Decorative background glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-accent-500/20 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg text-white">
              <GraduationCap className="h-6 w-6 text-brand-300" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight">
                JN <span className="text-brand-400">LMS</span>
              </span>
              <span className="block text-[11px] uppercase tracking-widest text-slate-300">
                Academic Intelligence Platform
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-xs font-semibold text-brand-200">
            <Sparkles className="h-3.5 w-3.5 text-accent-300" />
            <span>Powered by Next-Gen RAG & Vector Intelligence</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl leading-tight">
            Learn smarter with your own course materials.
          </h1>

          <p className="text-base text-slate-300 leading-relaxed">
            Upload syllabi, lecture slides, textbooks, and notes. Generate custom practice quizzes, instant summaries, and study with an AI tutor tuned directly to your syllabus.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <BookOpen className="h-5 w-5 text-brand-300 mb-2" />
              <div className="font-semibold text-sm">Full Course Workflow</div>
              <div className="text-xs text-slate-400 mt-1">Modules, assignments, question banks & grading.</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <ShieldCheck className="h-5 w-5 text-accent-300 mb-2" />
              <div className="font-semibold text-sm">Enterprise Security</div>
              <div className="text-xs text-slate-400 mt-1">Role-based controls, pgvector, and data isolation.</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400">
          © 2026 JN LMS Inc. All academic rights reserved.
        </div>
      </div>

      {/* Right side: Form container */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24 bg-slate-50">
        <div className="mx-auto w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
