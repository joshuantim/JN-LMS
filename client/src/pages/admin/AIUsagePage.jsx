import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Cpu,
  DollarSign,
  Users,
  Activity,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Database,
  Search,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from 'lucide-react';

export const AIUsagePage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [resettingId, setResettingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usageRes, healthRes] = await Promise.allSettled([
        api.get('/admin/ai-usage'),
        api.get('/health'),
      ]);

      if (usageRes.status === 'fulfilled' && usageRes.value?.data) {
        setStats(usageRes.value.data);
      }

      if (healthRes.status === 'fulfilled') {
        setHealth(healthRes.value);
      }
    } catch (err) {
      console.error('Failed to load AI usage stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResetUser = async (userId, userName) => {
    if (!window.confirm(`Reset monthly AI quota for ${userName}? This will restore their full token allowance.`)) {
      return;
    }

    try {
      setResettingId(userId);
      await api.post(`/admin/ai-usage/reset/${userId}`);
      setStatusMessage({ type: 'success', text: `Successfully reset AI token quota for ${userName}.` });
      await fetchData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reset quota' });
    } finally {
      setResettingId(null);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const filteredUsers = (stats?.usersUsage || []).filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading && !stats) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-brand-600 to-indigo-600 rounded-xl text-white shadow-md shadow-brand-500/20">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Usage & Cost Control</h1>
              <p className="text-sm text-slate-500">
                Monitor token consumption, compute cost estimates, and enforce role-based AI rate limits.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Metrics
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* System Infrastructure Telemetry */}
      {health && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Production Infrastructure</p>
              <p className="text-sm font-medium text-slate-200">
                System Status: <span className="text-emerald-400 font-bold">{health.status?.toUpperCase() || 'HEALTHY'}</span>
                {' '}&bull; Uptime: {Math.floor((health.uptimeSeconds || 0) / 60)}m {((health.uptimeSeconds || 0) % 60)}s
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300">
            <span className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <Database className="w-3.5 h-3.5 text-brand-400" />
              Postgres: {health.checks?.database || 'OK'}
            </span>
            <span className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Redis Cache: {health.checks?.redis || 'OK'}
            </span>
            <span className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              pgvector: {health.checks?.pgvector || 'OK'}
            </span>
          </div>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Month Usage</span>
            <span className="p-2 bg-brand-50 text-brand-600 rounded-xl">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {(stats?.totalTokensUsed || 0).toLocaleString()}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Cycle: {stats?.monthKey || 'Current'}</span>
            <span className="text-brand-600 font-semibold">Tokens</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estimated Cost</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            ${(stats?.estimatedCostUsd || 0).toFixed(4)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>$0.30 per 1M tokens</span>
            <span className="text-emerald-600 font-semibold">USD</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active AI Users</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {stats?.activeAiUsersCount || 0}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Total Enrolled: {stats?.usersUsage?.length || 0}</span>
            <span className="text-indigo-600 font-semibold">Users</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Budget Guardrails</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Server className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            ENFORCED
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Redis Rate Limiter</span>
            <span className="text-emerald-600 font-semibold">Active</span>
          </div>
        </div>
      </div>

      {/* Role Quota Policy Cards */}
      <div className="bg-gradient-to-r from-slate-50 to-indigo-50/50 p-6 rounded-2xl border border-slate-200">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-brand-600" />
          Institutional Role Monthly Quota Caps
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-bold text-slate-900">Student Tier</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">50K / mo</span>
            </div>
            <p className="text-xs text-slate-500">
              Covers RAG textbook chat, smart quiz generation, and adaptive flashcard practice (~37,500 words).
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-bold text-slate-900">Instructor Tier</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">250K / mo</span>
            </div>
            <p className="text-xs text-slate-500">
              Enables batch exam synthesis, multi-chapter document indexing, and AI rubrics generation.
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-bold text-slate-900">Administrator Tier</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">1.0M / mo</span>
            </div>
            <p className="text-xs text-slate-500">
              Departmental testing, course-wide benchmark indexing, and platform-level diagnostic jobs.
            </p>
          </div>
        </div>
      </div>

      {/* User Consumption Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">User Token Consumption</h2>
            <p className="text-xs text-slate-500">Monthly token consumption per student and faculty member.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-700"
            >
              <option value="ALL">All Roles</option>
              <option value="STUDENT">Students</option>
              <option value="INSTRUCTOR">Instructors</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Tokens Consumed</th>
                <th className="px-6 py-3.5">Monthly Quota</th>
                <th className="px-6 py-3.5 w-48">Usage Bar</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-sm">
                    No matching users found for this filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const percent = u.percentUsed || 0;
                  const isHigh = percent >= 80;
                  const isExceeded = percent >= 100;

                  return (
                    <tr key={u.userId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 leading-tight">{u.name}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            u.role === 'ADMIN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : u.role === 'INSTRUCTOR'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-slate-800">
                        {u.tokensUsed.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500 text-xs">
                        {u.limit.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isExceeded
                                  ? 'bg-rose-500'
                                  : isHigh
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, percent)}%` }}
                            />
                          </div>
                          <span
                            className={`text-[10px] font-bold ${
                              isExceeded
                                ? 'text-rose-600'
                                : isHigh
                                ? 'text-amber-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {percent}% consumed
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleResetUser(u.userId, u.name)}
                          disabled={resettingId === u.userId || u.tokensUsed === 0}
                          className="inline-flex items-center gap-1.5 px-3 py-1 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Reset monthly token quota back to 0"
                        >
                          <RotateCcw className={`w-3 h-3 ${resettingId === u.userId ? 'animate-spin' : ''}`} />
                          Reset Quota
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AIUsagePage;
