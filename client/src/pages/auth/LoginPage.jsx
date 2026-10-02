import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Lock, Mail, Eye, EyeOff, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const { login, isLoading, error: authError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Please fill in both email and password.');
      return;
    }

    try {
      const user = await login({ email, password });
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        if (user.role === 'ADMIN') navigate('/admin');
        else if (user.role === 'INSTRUCTOR') navigate('/instructor');
        else navigate('/dashboard');
      }
    } catch (err) {
      // Handled in store
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    login({ email: demoEmail, password: demoPassword })
      .then((user) => {
        if (user.role === 'ADMIN') navigate('/admin');
        else if (user.role === 'INSTRUCTOR') navigate('/instructor');
        else navigate('/dashboard');
      })
      .catch(() => {});
  };

  const errorMessage = localError || authError;

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Sign in with your academic credentials to access your courses.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 flex items-start space-x-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 animate-in fade-in">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600 mt-0.5" />
          <p>{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Mail className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@jnlms.edu"
              required
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <a href="#forgot" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center space-x-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-soft-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition disabled:opacity-50"
        >
          {isLoading ? (
            <span>Signing in...</span>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Demo Credentials Quick-Select */}
      <div className="mt-8 border-t border-slate-200 pt-6">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles className="h-4 w-4 text-brand-500" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Quick Test-Drive Roles
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin('student@jnlms.edu', 'Student123!')}
            className="rounded-lg border border-slate-200 bg-white p-2 text-left hover:border-brand-500 hover:bg-brand-50/50 transition group"
          >
            <div className="text-xs font-semibold text-slate-800 group-hover:text-brand-600">Student</div>
            <div className="text-[10px] text-slate-500">student@jnlms.edu</div>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('dr.smith@jnlms.edu', 'Instructor123!')}
            className="rounded-lg border border-slate-200 bg-white p-2 text-left hover:border-amber-500 hover:bg-amber-50/50 transition group"
          >
            <div className="text-xs font-semibold text-slate-800 group-hover:text-amber-600">Instructor</div>
            <div className="text-[10px] text-slate-500">dr.smith@jnlms.edu</div>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('admin@jnlms.edu', 'Admin123!')}
            className="rounded-lg border border-slate-200 bg-white p-2 text-left hover:border-rose-500 hover:bg-rose-50/50 transition group"
          >
            <div className="text-xs font-semibold text-slate-800 group-hover:text-rose-600">Admin</div>
            <div className="text-[10px] text-slate-500">admin@jnlms.edu</div>
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account yet?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
          Create an account
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
