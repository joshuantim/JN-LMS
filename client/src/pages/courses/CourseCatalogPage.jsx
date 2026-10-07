import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { courseService } from '../../services/course.service';
import CreateCourseModal from './CreateCourseModal';
import {
  BookOpen,
  Search,
  PlusCircle,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  Settings,
} from 'lucide-react';

export const CourseCatalogPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tab, setTab] = useState('ALL'); // 'ALL' | 'ENROLLED'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Debounce: wait 350ms after user stops typing before searching
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchCourses = useCallback(async (search) => {
    setIsLoading(true);
    try {
      const res = await courseService.getCourses(search ? { search } : {});
      // Axios interceptor returns response.data = { success, message, data: { courses, pagination } }
      setCourses(res?.courses || res?.data?.courses || []);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses(debouncedSearch);
  }, [debouncedSearch, fetchCourses]);

  const handleEnroll = async (courseId, e) => {
    e.stopPropagation();
    setActionLoadingId(courseId);
    try {
      await courseService.enrollInCourse(courseId);
      await fetchCourses(debouncedSearch);
    } catch (err) {
      alert(err.message || 'Failed to enroll');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCourseCreated = (newCourse) => {
    setCourses((prev) => [newCourse, ...prev]);
  };

  const filteredCourses = courses.filter((c) => {
    if (tab === 'ENROLLED') return c.isEnrolled;
    return true;
  });

  const canCreateCourse = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 rounded-full bg-brand-50 border border-brand-200/60 px-3 py-1 text-xs font-semibold text-brand-700 mb-2">
            <BookOpen className="h-3.5 w-3.5 text-brand-600" />
            <span>Academic Curriculum 2026</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Course Directory
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Discover modules, syllabi, interactive lessons, and AI-powered study aids.
          </p>
        </div>

        {canCreateCourse && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700 transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create New Course</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        {/* Tabs */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              tab === 'ALL'
                ? 'bg-brand-600 text-white shadow-soft-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Courses ({courses.length})
          </button>
          {user?.role === 'STUDENT' && (
            <button
              onClick={() => setTab('ENROLLED')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                tab === 'ENROLLED'
                  ? 'bg-brand-600 text-white shadow-soft-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              My Enrolled ({courses.filter((c) => c.isEnrolled).length})
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search code or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-80 rounded-2xl border border-slate-200 bg-white p-4 animate-pulse space-y-4"
            >
              <div className="h-40 rounded-xl bg-slate-100" />
              <div className="h-4 w-3/4 rounded bg-slate-100" />
              <div className="h-3 w-1/2 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No courses found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? `No courses matching "${searchTerm}". Try another search term.`
              : 'There are currently no courses in this view.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isOwner = user?.id === course.instructorId || user?.role === 'ADMIN';

            return (
              <div
                key={course.id}
                onClick={() => navigate(`/courses/${course.id}`)}
                className="group cursor-pointer rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-soft-sm hover:shadow-soft-md hover:border-brand-500/40 transition flex flex-col justify-between"
              >
                <div>
                  {/* Course Image & Badge */}
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    {course.courseImage ? (
                      <img
                        src={course.courseImage}
                        alt={course.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-brand-800 to-indigo-950 text-white font-bold text-lg">
                        {course.code}
                      </div>
                    )}
                    <span className="absolute top-3 left-3 rounded-lg bg-white/95 backdrop-blur-md px-2.5 py-1 text-xs font-extrabold text-slate-800 shadow-sm border border-slate-200/50">
                      {course.code}
                    </span>
                    {course.isEnrolled && (
                      <span className="absolute top-3 right-3 rounded-lg bg-emerald-600 text-white px-2.5 py-1 text-xs font-semibold shadow-sm flex items-center space-x-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Enrolled</span>
                      </span>
                    )}
                  </div>

                  {/* Course Body */}
                  <div className="p-5">
                    <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {course.description || 'No course syllabus description provided.'}
                    </p>

                    {/* Instructor meta */}
                    <div className="mt-4 flex items-center space-x-2.5 pt-4 border-t border-slate-100">
                      {course.instructor?.avatarUrl ? (
                        <img
                          src={course.instructor.avatarUrl}
                          alt={course.instructor.firstName}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold">
                          {course.instructor?.firstName?.[0] || 'I'}
                        </div>
                      )}
                      <span className="text-xs text-slate-600 truncate">
                        {course.instructor?.firstName} {course.instructor?.lastName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3 text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Layers className="h-3.5 w-3.5 text-slate-400" />
                      <span>{course._count?.modules || 0} Modules</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span>{course._count?.enrollments || 0}</span>
                    </span>
                  </div>

                  {isOwner ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/courses/${course.id}/manage`);
                      }}
                      className="inline-flex items-center space-x-1 font-semibold text-brand-600 hover:text-brand-700"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      <span>Manage</span>
                    </button>
                  ) : course.isEnrolled ? (
                    <span className="font-semibold text-brand-600 flex items-center">
                      <span>Enter</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </span>
                  ) : (
                    <button
                      onClick={(e) => handleEnroll(course.id, e)}
                      disabled={actionLoadingId === course.id}
                      className="font-bold text-brand-600 hover:text-brand-700 flex items-center disabled:opacity-50"
                    >
                      {actionLoadingId === course.id ? 'Enrolling...' : 'Enroll Free'}
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Course Modal */}
      <CreateCourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCourseCreated}
      />
    </div>
  );
};

export default CourseCatalogPage;
