import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { assessmentService } from '../../services/assessment.service';
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Send,
  Link as LinkIcon,
  Award,
  X,
  User,
} from 'lucide-react';

export const AssignmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [assignment, setAssignment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Student submission form
  const [submissionContent, setSubmissionContent] = useState('');
  const [submissionFileUrl, setSubmissionFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Instructor grading modal
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [isGrading, setIsGrading] = useState(false);

  const fetchAssignment = async () => {
    setIsLoading(true);
    try {
      const data = await assessmentService.getAssignmentById(id);
      setAssignment(data.assignment);
      if (data.assignment?.mySubmission) {
        setSubmissionContent(data.assignment.mySubmission.content || '');
        setSubmissionFileUrl(data.assignment.mySubmission.fileUrl || '');
      }
    } catch (err) {
      console.error('Failed to load assignment:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!submissionContent.trim() && !submissionFileUrl.trim()) {
      alert('Please enter text content or a file URL for your submission.');
      return;
    }

    setIsSubmitting(true);
    try {
      await assessmentService.submitAssignment(id, {
        content: submissionContent,
        fileUrl: submissionFileUrl,
      });
      alert('Assignment submitted successfully!');
      await fetchAssignment();
    } catch (err) {
      alert(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    setIsGrading(true);
    try {
      await assessmentService.gradeSubmission(gradingSubmission.id, {
        score: parseFloat(gradeScore),
        feedback: gradeFeedback,
      });
      setGradingSubmission(null);
      await fetchAssignment();
    } catch (err) {
      alert(err.message || 'Grading failed');
    } finally {
      setIsGrading(false);
    }
  };

  const isInstructorOrAdmin = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-400">Loading assignment details...</div>;
  }

  if (!assignment) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
        <h3 className="text-base font-bold text-slate-900">Assignment Not Found</h3>
        <button
          onClick={() => navigate('/assignments')}
          className="mt-3 text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          Back to Assignments
        </button>
      </div>
    );
  }

  const mySub = assignment.mySubmission;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/assignments')}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Assignments</span>
        </button>
      </div>

      {/* Assignment Header Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-soft-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="rounded-lg bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700">
                {assignment.course?.code}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {assignment.course?.title}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {assignment.title}
            </h1>
          </div>

          <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase">Maximum Points</span>
            <span className="text-2xl font-extrabold text-brand-600">{assignment.maxScore}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span className="flex items-center space-x-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Due Date: {new Date(assignment.dueDate).toLocaleString()}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Status: {assignment.status}</span>
          </span>
        </div>

        {assignment.description && (
          <p className="text-xs text-slate-600 leading-relaxed pt-2">
            {assignment.description}
          </p>
        )}

        {assignment.instructions && (
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-1.5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Instructions & Deliverables
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
              {assignment.instructions}
            </p>
          </div>
        )}
      </div>

      {/* Student View: Submission Form & Grade Card */}
      {!isInstructorOrAdmin && (
        <div className="space-y-6">
          {/* If already graded, show grade banner */}
          {mySub?.status === 'GRADED' && (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-soft-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>Submission Graded</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-emerald-700">
                    {mySub.score} / {assignment.maxScore}
                  </span>
                  <p className="text-[11px] text-emerald-600">
                    {((mySub.score / assignment.maxScore) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              {mySub.feedback && (
                <div className="rounded-2xl bg-white p-4 border border-emerald-100 text-xs text-slate-700 space-y-1">
                  <span className="font-bold text-emerald-800">Instructor Feedback:</span>
                  <p className="text-slate-600 whitespace-pre-wrap">{mySub.feedback}</p>
                </div>
              )}
            </div>
          )}

          {/* Submission Form */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-soft-sm space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Your Submission</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {mySub
                  ? `Last submitted on ${new Date(mySub.submittedAt).toLocaleString()}`
                  : 'Submit your solution for instructor review.'}
              </p>
            </div>

            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Text Response / Code / Summary
                </label>
                <textarea
                  rows={6}
                  placeholder="Paste your text answer, report, code snippet, or explanation..."
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Attached Document Link / File Storage URL (Optional)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <LinkIcon className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="url"
                    placeholder="https://storage.jnlms.edu/uploads/my-submission.pdf"
                    value={submissionFileUrl}
                    onChange={(e) => setSubmissionFileUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center space-x-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700 transition disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSubmitting ? 'Submitting...' : mySub ? 'Update Submission' : 'Submit Assignment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instructor View: Student Submissions Roster */}
      {isInstructorOrAdmin && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Student Submissions</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review submitted coursework and assign marks.
              </p>
            </div>
            <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
              {assignment.submissions?.length || 0} Total Submissions
            </span>
          </div>

          {(!assignment.submissions || assignment.submissions.length === 0) ? (
            <p className="text-xs text-slate-400 py-6 text-center">No student submissions received yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Student</th>
                    <th className="py-2.5 px-4">Submitted Date</th>
                    <th className="py-2.5 px-4">Score</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignment.submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {sub.student?.firstName} {sub.student?.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400">{sub.student?.email}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(sub.submittedAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {sub.score !== null ? `${sub.score} / ${assignment.maxScore}` : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            sub.status === 'GRADED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setGradingSubmission(sub);
                            setGradeScore(sub.score !== null ? String(sub.score) : '');
                            setGradeFeedback(sub.feedback || '');
                          }}
                          className="inline-flex items-center space-x-1 font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1 rounded-lg transition"
                        >
                          <Award className="h-3.5 w-3.5" />
                          <span>{sub.status === 'GRADED' ? 'Edit Grade' : 'Grade Submission'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Instructor Grading Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-soft-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Grading: {gradingSubmission.student?.firstName} {gradingSubmission.student?.lastName}
                </h3>
                <p className="text-[11px] text-slate-400">Max Score: {assignment.maxScore} points</p>
              </div>
              <button
                onClick={() => setGradingSubmission(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Submission preview */}
            <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 text-xs space-y-2 max-h-48 overflow-y-auto">
              <span className="font-bold text-slate-700 block">Submitted Solution:</span>
              <p className="text-slate-600 whitespace-pre-wrap">
                {gradingSubmission.content || 'No text content submitted.'}
              </p>
              {gradingSubmission.fileUrl && (
                <div className="pt-2">
                  <a
                    href={gradingSubmission.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-600 hover:underline flex items-center space-x-1"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    <span>View Attached Deliverable</span>
                  </a>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Awarded Score (out of {assignment.maxScore})
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={assignment.maxScore}
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Instructor Feedback & Remarks
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter comments, strengths, and areas for improvement..."
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGrading}
                  className="rounded-xl bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700 disabled:opacity-50"
                >
                  {isGrading ? 'Saving...' : 'Save & Publish Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentDetailPage;
