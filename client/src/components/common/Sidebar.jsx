import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  HelpCircle,
  Award,
  Calendar,
  MessageSquare,
  Sparkles,
  Megaphone,
  Settings,
  Users,
  BarChart3,
  X,
  GraduationCap,
  Brain,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const role = user?.role || 'STUDENT';

  // Navigation sets based on user role
  const studentNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Courses', path: '/courses', icon: BookOpen },
    { name: 'Study Documents', path: '/documents', icon: FileText },
    { name: 'Assignments', path: '/assignments', icon: Award },
    { name: 'Quizzes', path: '/quizzes', icon: HelpCircle },
    { name: 'Grades', path: '/grades', icon: Award },
    { name: 'AI Study Hub', path: '/study-hub', icon: Brain, highlight: true },
    { name: 'AI Assistant', path: '/ai-assistant', icon: Sparkles },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Discussions', path: '/discussions', icon: MessageSquare },
    { name: 'Announcements', path: '/announcements', icon: Megaphone },
  ];

  const instructorNav = [
    { name: 'Dashboard', path: '/instructor', icon: LayoutDashboard },
    { name: 'My Courses', path: '/courses', icon: BookOpen },
    { name: 'Course Documents', path: '/documents', icon: FileText },
    { name: 'Question Bank', path: '/question-bank', icon: HelpCircle },
    { name: 'Grading & Submissions', path: '/grading', icon: Award },
    { name: 'AI Study Hub', path: '/study-hub', icon: Brain, highlight: true },
    { name: 'AI Course Assistant', path: '/ai-assistant', icon: Sparkles },
    { name: 'Discussions', path: '/discussions', icon: MessageSquare },
    { name: 'Announcements', path: '/announcements', icon: Megaphone },
    { name: 'Performance Analytics', path: '/analytics', icon: BarChart3 },
  ];

  const adminNav = [
    { name: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Course Directory', path: '/admin/courses', icon: BookOpen },
    { name: 'System Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'AI Usage & Costs', path: '/admin/ai-usage', icon: Sparkles, highlight: true },
    { name: 'Global Settings', path: '/settings', icon: Settings },
  ];

  let navItems = studentNav;
  if (role === 'INSTRUCTOR') navItems = instructorNav;
  if (role === 'ADMIN') navItems = adminNav;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-accent-600 text-white shadow-soft-md">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                JN <span className="text-brand-600">LMS</span>
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400">
                Enterprise
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {role} Portal
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center space-x-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold shadow-soft-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  } ${
                    item.highlight && !isActive
                      ? 'text-brand-600 hover:bg-brand-50/50'
                      : ''
                  }`
                }
              >
                <Icon
                  className={`h-4.5 w-4.5 ${
                    item.highlight ? 'text-accent-500' : ''
                  }`}
                />
                <span className="flex-1">{item.name}</span>
                {item.highlight && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent-100 text-accent-700">
                    AI
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom footer: Settings & version */}
        <div className="border-t border-slate-100 p-4">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Settings className="h-4.5 w-4.5 text-slate-400" />
            <span>Settings</span>
          </NavLink>
          <div className="mt-2 px-3.5 text-[11px] text-slate-400">
            JN LMS v1.0.0 • Connected
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
