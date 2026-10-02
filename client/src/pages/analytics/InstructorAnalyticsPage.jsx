import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { lmsService } from '../../services/lms.service';
import { courseService } from '../../services/course.service';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  BarChart3,
  Users,
  FileCheck,
  Award,
  MessageSquare,
  TrendingUp,
  Clock,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

export const InstructorAnalyticsPage = () => {
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState('');

  // Fetch courses taught
  const { data: coursesData } = useQuery({
    queryKey: ['myCourses'],
    queryFn: () => courseService.getCourses({ limit: 100 }),
  });

  const courses = coursesData?.data?.courses || [];

  // Fetch instructor analytics
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['instructorAnalytics', selectedCourse],
    queryFn: () => lmsService.getInstructorAnalytics(selectedCourse ? { courseId: selectedCourse } : {}),
  });

  const stats = analyticsData?.data;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
              <BarChart3 className="w-6 h-6" />
            </div>
            Teaching & Cohort Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time academic performance, submission rates, and cohort engagement metrics.
          </p>
        </div>

        {/* Course Filter */}
        <div className="sm:w-72">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="">Aggregate All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}: {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : !stats ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400">
          No analytics data available.
        </div>
      ) : (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Active Students */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Active Students</span>
                <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{stats.totalStudents}</span>
                <span className="text-xs text-slate-400">enrolled</span>
              </div>
            </div>

            {/* Assignment Submissions & Avg */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Assignment Avg</span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <FileCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{stats.assignmentAverageGrade}%</span>
                <span className="text-xs text-slate-400">({stats.totalSubmissions} graded)</span>
              </div>
            </div>

            {/* Quiz Performance */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Quiz Pass Rate</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{stats.quizPassRate}%</span>
                <span className="text-xs text-slate-400">({stats.totalQuizAttempts} attempts)</span>
              </div>
            </div>

            {/* Discussion Engagement */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Forum Activity</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{stats.totalReplies}</span>
                <span className="text-xs text-slate-400">replies in {stats.totalDiscussions} threads</span>
              </div>
            </div>
          </div>

          {/* Submissions Pending Review Table */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-soft-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Submissions Awaiting Grading
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Recent student work submitted for your review.
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                {stats.pendingGradingSubmissions?.length || 0} Pending
              </span>
            </div>

            {(!stats.pendingGradingSubmissions || stats.pendingGradingSubmissions.length === 0) ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <FileCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                All student submissions have been graded! Great job.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold">
                    <tr>
                      <th className="px-6 py-3">Student</th>
                      <th className="px-6 py-3">Course & Assignment</th>
                      <th className="px-6 py-3">Submitted At</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.pendingGradingSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-3.5 font-semibold text-slate-800">
                          {sub.student?.firstName} {sub.student?.lastName}
                          <span className="block text-[11px] font-normal text-slate-400">
                            {sub.student?.email}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-700">
                          <span className="font-semibold text-brand-600">
                            {sub.assignment?.course?.code}
                          </span>
                          : {sub.assignment?.title}
                        </td>
                        <td className="px-6 py-3.5 text-slate-500">
                          {new Date(sub.submittedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={() => navigate(`/assignments/${sub.assignmentId}`)}
                            className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition"
                          >
                            <span>Grade</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default InstructorAnalyticsPage;
