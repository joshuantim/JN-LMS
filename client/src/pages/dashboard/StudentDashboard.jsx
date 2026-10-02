import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../../services/course.service';
import {
  BookOpen,
  Clock,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Calendar,
  CheckCircle,
  FileText,
  Layers,
} from 'lucide-react';

export const StudentDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const data = await courseService.getMyEnrollments();
        setEnrollments(data.enrollments || []);
      } catch (err) {
        console.error('Failed to load enrolled courses:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEnrollments();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-950 p-6 sm:p-8 text-white shadow-soft-lg">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 rounded-full bg-brand-500/20 border border-brand-400/30 px-3 py-1 text-xs font-semibold text-brand-200 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-accent-300" />
              <span>Fall Academic Term 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {getGreeting()}, {user?.firstName || 'Student'} 👋
            </h1>
            <p className="mt-1 text-sm text-brand-100 max-w-xl">
              You are enrolled in {enrollments.length} active courses. Your AI Learning Assistant is online and ready for study sessions.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/ai-assistant')}
              className="inline-flex items-center space-x-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-900 shadow-soft-md hover:bg-brand-50 transition"
            >
              <Sparkles className="h-4 w-4 text-accent-600" />
              <span>Launch AI Study Mode</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm hover:shadow-soft-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Enrolled Courses</span>
            <div className="rounded-xl bg-brand-50 p-2 text-brand-600">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900">{enrollments.length}</span>
            <span className="text-xs font-medium text-emerald-600">Active</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm hover:shadow-soft-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Tasks</span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900">4</span>
            <span className="text-xs font-medium text-amber-600">Due soon</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm hover:shadow-soft-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Average Grade</span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900">89.5%</span>
            <span className="text-xs font-medium text-emerald-600">+3.2% vs last term</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm hover:shadow-soft-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Knowledge Docs</span>
            <div className="rounded-xl bg-accent-50 p-2 text-accent-600">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900">3</span>
            <span className="text-xs font-medium text-accent-600">Indexed & Ready</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Courses + Sidebar tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: My Courses */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">My Courses</h2>
            <button
              onClick={() => navigate('/courses')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
            >
              <span>Explore course catalog</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
              <div className="h-64 rounded-2xl bg-slate-100" />
              <div className="h-64 rounded-2xl bg-slate-100" />
            </div>
          ) : enrollments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-3">
              <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
              <p className="text-xs font-semibold text-slate-700">You are not enrolled in any courses yet.</p>
              <button
                onClick={() => navigate('/courses')}
                className="inline-flex items-center space-x-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700"
              >
                <span>Browse Course Catalog</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrollments.map((enr) => {
                const course = enr.course;

                return (
                  <div
                    key={enr.id}
                    onClick={() => navigate(`/courses/${course.id}`)}
                    className="group cursor-pointer rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-soft-sm hover:shadow-soft-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-32 w-full bg-slate-200 relative overflow-hidden">
                        {course.courseImage ? (
                          <img
                            src={course.courseImage}
                            alt={course.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gradient-to-tr from-brand-700 to-indigo-900 text-white font-bold">
                            {course.code}
                          </div>
                        )}
                        <span className="absolute top-3 left-3 rounded-md bg-white/95 backdrop-blur-md px-2 py-0.5 text-xs font-bold text-slate-800 shadow-sm border border-slate-200/50">
                          {course.code}
                        </span>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition line-clamp-1">
                          {course.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Instructor: {course.instructor?.firstName} {course.instructor?.lastName}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <div className="pt-4 border-t border-slate-100">
                        <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                          <span>Course Progress</span>
                          <span className="font-bold text-brand-600">{enr.progress}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-brand-600 rounded-full transition-all duration-500"
                            style={{ width: `${enr.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* AI Spotlight Section */}
          <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-accent-50/30 p-6">
            <div className="flex items-start space-x-4">
              <div className="rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-600 p-3 text-white shadow-soft-md">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  AI Study Companion Available
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Upload your syllabus, lecture slides, and notes. Ask questions, generate practice questions, or synthesize lecture topics.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate('/ai-assistant')}
                    className="inline-flex items-center space-x-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 transition"
                  >
                    <span>Launch AI Assistant</span>
                  </button>
                  <button
                    onClick={() => navigate('/courses')}
                    className="inline-flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <span>Review Course Materials</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Upcoming & Recent Grades */}
        <div className="space-y-6">
          {/* Upcoming Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-brand-600" />
                <span>Upcoming Tasks</span>
              </h3>
              <span className="text-xs text-slate-400">Next 7 days</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="rounded-lg bg-brand-100 p-2 text-brand-700 mt-0.5">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    Statistics Assignment 3
                  </p>
                  <p className="text-[11px] text-slate-500">STAT 301 • Probability Distributions</p>
                  <p className="text-[11px] font-semibold text-amber-600 mt-1">Due: Friday at 11:59 PM</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="rounded-lg bg-accent-100 p-2 text-accent-700 mt-0.5">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    Binary Search Trees Quiz
                  </p>
                  <p className="text-[11px] text-slate-500">CS 301 • Module 2 Assessment</p>
                  <p className="text-[11px] font-semibold text-slate-500 mt-1">Due: Next Monday</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Grades Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Recent Grades</span>
              </h3>
              <button
                onClick={() => navigate('/grades')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                Gradebook
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">Statistics Quiz 1</p>
                  <p className="text-[11px] text-slate-400">STAT 301</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600">18 / 20</span>
                  <p className="text-[10px] text-slate-400">90%</p>
                </div>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">Programming Assignment 1</p>
                  <p className="text-[11px] text-slate-400">CS 301</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600">85 / 100</span>
                  <p className="text-[10px] text-slate-400">85%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
