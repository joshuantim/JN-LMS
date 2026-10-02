import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../../services/course.service';
import CreateCourseModal from '../courses/CreateCourseModal';
import {
  BookOpen,
  Users,
  Sparkles,
  PlusCircle,
  FileCheck,
  ChevronRight,
  HelpCircle,
  Settings,
} from 'lucide-react';

export const InstructorDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const data = await courseService.getCourses({ instructorId: user?.id });
      setCourses(data.courses || []);
    } catch (err) {
      console.error('Failed to load instructor courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user?.id]);

  const totalStudents = courses.reduce(
    (acc, c) => acc + (c._count?.enrollments || 0),
    0
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Instructor Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 text-white shadow-soft-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-2">
            INSTRUCTOR WORKSPACE
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, Dr. {user?.lastName || 'Instructor'}
          </h1>
          <p className="mt-1 text-sm text-slate-300 max-w-xl">
            Manage course modules, review student submissions, and leverage the AI Assistant to generate high-yield question banks.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft-md hover:bg-brand-700 transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Course</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Courses Instructed</span>
            <div className="rounded-xl bg-brand-50 p-2 text-brand-600">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900">{courses.length}</span>
            <span className="text-xs font-medium text-slate-500">Active</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Enrolled</span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900">{totalStudents}</span>
            <span className="text-xs font-medium text-emerald-600">Students</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Submissions to Grade</span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <FileCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900">12</span>
            <span className="text-xs font-medium text-amber-600">Pending review</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Assistant</span>
            <div className="rounded-xl bg-accent-50 p-2 text-accent-600">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-sm font-bold text-accent-600">Ready</span>
            <span className="text-xs text-slate-400">Quiz Generator</span>
          </div>
        </div>
      </div>

      {/* Courses Managed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Assigned Courses</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create New Course</span>
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
            <div className="h-48 rounded-2xl bg-slate-100" />
            <div className="h-48 rounded-2xl bg-slate-100" />
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-500">
            No courses assigned yet. Click &quot;Create New Course&quot; to begin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm hover:border-brand-500/40 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">
                        {course.code}
                      </span>
                      <h3 className="font-bold text-slate-900 mt-1.5 line-clamp-1">
                        {course.title}
                      </h3>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        course.isPublished
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {course.description || 'No course syllabus description provided.'}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
                  <span className="text-slate-500">
                    {course._count?.enrollments || 0} students enrolled • {course._count?.modules || 0} modules
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigate(`/courses/${course.id}`)}
                      className="font-semibold text-slate-600 hover:text-slate-900"
                    >
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/courses/${course.id}/manage`)}
                      className="inline-flex items-center space-x-1 font-semibold text-brand-600 hover:text-brand-700"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      <span>Manage</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      <CreateCourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={(newCourse) => setCourses((prev) => [newCourse, ...prev])}
      />
    </div>
  );
};

export default InstructorDashboard;
