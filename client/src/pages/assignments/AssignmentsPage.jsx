import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { assessmentService } from '../../services/assessment.service';
import { courseService } from '../../services/course.service';
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  X,
  Award,
} from 'lucide-react';

export const AssignmentsPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New assignment modal form
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    description: '',
    instructions: '',
    maxScore: '100',
    dueDate: '',
  });

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const data = await assessmentService.getAssignments();
      setAssignments(data.assignments || []);

      if (user?.role !== 'STUDENT') {
        const cData = await courseService.getCourses();
        setCourses(cData.courses || []);
        if (cData.courses?.length > 0) {
          setFormData((prev) => ({ ...prev, courseId: cData.courses[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      await assessmentService.createAssignment({
        ...formData,
        maxScore: parseFloat(formData.maxScore),
      });
      setShowModal(false);
      setFormData({
        courseId: courses[0]?.id || '',
        title: '',
        description: '',
        instructions: '',
        maxScore: '100',
        dueDate: '',
      });
      await fetchAssignments();
    } catch (err) {
      alert(err.message || 'Failed to create assignment');
    }
  };

  const isInstructorOrAdmin = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 rounded-full bg-brand-50 border border-brand-200/60 px-3 py-1 text-xs font-semibold text-brand-700 mb-2">
            <FileText className="h-3.5 w-3.5 text-brand-600" />
            <span>Academic Coursework</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Assignments & Submissions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Submit coursework, track due dates, and review qualitative instructor grading.
          </p>
        </div>

        {isInstructorOrAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700 transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Assignment</span>
          </button>
        )}
      </div>

      {/* Assignments List */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 rounded-2xl bg-slate-100" />
          <div className="h-28 rounded-2xl bg-slate-100" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No assignments found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {isInstructorOrAdmin
              ? 'Click "Create Assignment" to post the first assessment for your courses.'
              : 'There are currently no assignments due in your enrolled courses.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const mySub = assignment.mySubmission;
            const isGraded = mySub?.status === 'GRADED';
            const isSubmitted = mySub?.status === 'SUBMITTED';

            return (
              <div
                key={assignment.id}
                onClick={() => navigate(`/assignments/${assignment.id}`)}
                className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm hover:border-brand-500/40 hover:shadow-soft-md transition flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="rounded-lg bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700">
                      {assignment.course?.code}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Max Score: {assignment.maxScore} pts
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition text-base">
                    {assignment.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 max-w-2xl">
                    {assignment.description || assignment.instructions || 'No additional instructions.'}
                  </p>
                </div>

                <div className="flex items-center space-x-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <div className="flex items-center md:justify-end space-x-1 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>

                    <div className="mt-1">
                      {isInstructorOrAdmin ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-brand-50 text-brand-700">
                          {assignment._count?.submissions || 0} Submissions
                        </span>
                      ) : isGraded ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Graded: {mySub.score} / {assignment.maxScore}</span>
                        </span>
                      ) : isSubmitted ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
                          <Clock className="h-3 w-3" />
                          <span>Submitted (Pending)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          <AlertCircle className="h-3 w-3" />
                          <span>Not Submitted</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="hidden sm:block">
                    <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-soft-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Create New Assignment</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateAssignment} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Course
                </label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                  required
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assignment Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Problem Set 2: Conditional Probability"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Score
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxScore}
                    onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Topic Overview
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of assignment scope..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Submission Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="Step-by-step instructions, formatting guidelines, deliverables..."
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700"
                >
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;
