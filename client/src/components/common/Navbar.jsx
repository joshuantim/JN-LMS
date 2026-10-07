import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { courseService } from '../../services/course.service';
import {
  Bell,
  Search,
  LogOut,
  User as UserIcon,
  Menu,
  Sparkles,
  ChevronDown,
  BookOpen,
  X,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const searchContainerRef = useRef(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live course search preview
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await courseService.getCourses({ search: searchQuery.trim(), limit: 5 });
        const courses = res?.courses || res?.data?.courses || [];
        setSearchResults(courses.slice(0, 5));
      } catch (err) {
        console.error('Navbar search error:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowDropdown(false);
    setShowMobileSearch(false);
    navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSelectCourse = (courseId) => {
    setShowDropdown(false);
    setShowMobileSearch(false);
    setSearchQuery('');
    navigate(`/courses/${courseId}`);
  };

  const handleViewAllResults = () => {
    setShowDropdown(false);
    setShowMobileSearch(false);
    navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            ADMIN
          </span>
        );
      case 'INSTRUCTOR':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            INSTRUCTOR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-brand-100 text-brand-800 border border-brand-200">
            STUDENT
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 flex flex-col w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6">
        {/* Left section: mobile hamburger & search */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Desktop Search Bar */}
          <div ref={searchContainerRef} className="relative hidden md:block w-72 lg:w-96">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => {
                  if (searchQuery.trim()) setShowDropdown(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setShowDropdown(false);
                }}
                placeholder="Search courses, lessons, notes..."
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-8 text-sm text-slate-800 placeholder-slate-400 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowDropdown(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                  title="Clear"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </form>

            {/* Quick Search Dropdown */}
            {showDropdown && searchQuery.trim() && (
              <div className="absolute left-0 mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-soft-xl ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Courses</span>
                  {isSearching && <Loader2 className="h-3 w-3 animate-spin text-brand-500" />}
                </div>

                {searchResults.length > 0 ? (
                  <div className="mt-1 divide-y divide-slate-50">
                    {searchResults.map((course) => (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() => handleSelectCourse(course.id)}
                        className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-slate-50 transition group"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="h-7 w-7 rounded-md bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                            <BookOpen className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-brand-600">
                              {course.title}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              <span className="font-medium text-slate-500">{course.code}</span>
                              {course.instructor ? ` • ${course.instructor.firstName} ${course.instructor.lastName}` : ''}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-brand-500 shrink-0 ml-2" />
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={handleViewAllResults}
                      className="w-full mt-1 pt-2 pb-1 text-center text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center justify-center gap-1.5"
                    >
                      <span>View all results in Catalog</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  !isSearching && (
                    <div className="py-3 px-2 text-center">
                      <p className="text-xs text-slate-500">No courses match "{searchQuery}"</p>
                      <button
                        type="button"
                        onClick={handleViewAllResults}
                        className="mt-1 text-xs font-medium text-brand-600 hover:underline"
                      >
                        Press Enter to search full catalog
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right section: AI assistant indicator, notifications, user profile */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Quick AI button */}
          <button
            onClick={() => navigate('/ai-assistant')}
            className="hidden sm:inline-flex items-center space-x-1.5 rounded-full bg-gradient-to-r from-brand-600 to-accent-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:from-brand-700 hover:to-accent-700 transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ask JN AI</span>
          </button>

          {/* Notification dropdown */}
          <NotificationDropdown />

          {/* User profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2.5 rounded-lg p-1.5 hover:bg-slate-100 transition"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-brand-500/30"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 font-semibold text-white text-xs">
                  {user?.firstName?.[0] || 'U'}
                  {user?.lastName?.[0] || ''}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-800 leading-tight">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="mt-0.5">{getRoleBadge(user?.role)}</div>
              </div>
              <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-slate-100 bg-white p-1.5 shadow-soft-lg ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onMouseLeave={() => setShowProfileMenu(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                  <p className="text-sm font-semibold text-slate-900 truncate">{user?.email}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/profile');
                    }}
                    className="flex w-full items-center px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition"
                  >
                    <UserIcon className="mr-2 h-4 w-4 text-slate-400" />
                    My Profile & Settings
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Input Row */}
      {showMobileSearch && (
        <div className="md:hidden px-4 pb-3 pt-1 border-t border-slate-100 animate-in fade-in duration-150">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses, lessons, notes..."
              autoFocus
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>
        </div>
      )}
    </header>
  );
};

export default Navbar;
