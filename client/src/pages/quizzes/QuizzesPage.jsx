import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { assessmentService } from '../../services/assessment.service';
import { courseService } from '../../services/course.service';
import {
  HelpCircle,
  Clock,
  Award,
  ArrowRight,
  PlusCircle,
  X,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Shuffle,
} from 'lucide-react';

export const QuizzesPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    description: '',
    timeLimitMinutes: '20',
    passMark: '60',
    maxAttempts: '2',
    shuffleQuestions: true,
  });

  const fetchQuizzes = async () => {
    setIsLoading(true);
    try {
      const data = await assessmentService.getQuizzes();
      setQuizzes(data.quizzes || []);

      if (user?.role !== 'STUDENT') {
        const cData = await courseService.getCourses();
        setCourses(cData.courses || []);
        if (cData.courses?.length > 0) {
          setFormData((prev) => ({ ...prev, courseId: cData.courses[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    try {
      await assessmentService.createQuiz({
        ...formData,
        timeLimitMinutes: parseInt(formData.timeLimitMinutes) || 20,
        passMark: parseFloat(formData.passMark) || 50,
        maxAttempts: parseInt(formData.maxAttempts) || 1,
      });
      setShowModal(false);
      await fetchQuizzes();
    } catch (err) {
      alert(err.message || 'Failed to create quiz');
    }
  };

  const isInstructorOrAdmin = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 rounded-full bg-accent-50 border border-accent-200/60 px-3 py-1 text-xs font-semibold text-accent-700 mb-2">
            <HelpCircle className="h-3.5 w-3.5 text-accent-600" />
            <span>Interactive Evaluations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Quizzes & Knowledge Checks
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Timed quizzes with instant automated scoring, multiple choice, and immediate result reviews.
          </p>
        </div>

        {isInstructorOrAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700 transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Quiz</span>
          </button>
        )}
      </div>

      {/* Quizzes List */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 rounded-2xl bg-slate-100" />
          <div className="h-28 rounded-2xl bg-slate-100" />
        </div>
      ) : quizzes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <HelpCircle className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No quizzes available</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {isInstructorOrAdmin
              ? 'Click "Create Quiz" to set up your first examination.'
              : 'There are currently no quizzes scheduled for your enrolled courses.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizzes.map((quiz) => {
            const myAttempts = quiz.myAttempts || [];
            const bestAttempt = myAttempts.find((a) => a.status === 'GRADED');

            return (
              <div
                key={quiz.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm hover:shadow-soft-md transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700">
                      {quiz.course?.code}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} mins` : 'Untimed'}</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-lg leading-snug">
                    {quiz.title}
                  </h3>

                  {quiz.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {quiz.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-500">
                    <span>{quiz._count?.questions || 0} Questions</span>
                    <span>•</span>
                    <span>Pass Mark: {quiz.passMark}%</span>
                    <span>•</span>
                    <span>Max Attempts: {quiz.maxAttempts}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {bestAttempt ? (
                      <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Best: {bestAttempt.percentage}%</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">
                        {user?.role === 'STUDENT' ? 'Not yet attempted' : `${quiz._count?.attempts || 0} Attempts`}
                      </span>
                    )}
                  </div>

                  {user?.role === 'STUDENT' ? (
                    <button
                      onClick={() => navigate(`/quizzes/${quiz.id}/take`)}
                      className="inline-flex items-center space-x-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700 transition"
                    >
                      <PlayCircle className="h-4 w-4" />
                      <span>{myAttempts.length > 0 ? 'Retake Quiz' : 'Start Quiz'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/question-bank?courseId=${quiz.courseId}`)}
                      className="inline-flex items-center space-x-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
                    >
                      <span>Manage Questions</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Quiz Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-soft-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Create Assessment Quiz</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateQuiz} className="mt-4 space-y-3">
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
                  Quiz Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Midterm 1: Probability Axioms & Bayes Rule"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Time Limit (Mins)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={formData.timeLimitMinutes}
                    onChange={(e) => setFormData({ ...formData, timeLimitMinutes: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pass Mark (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.passMark}
                    onChange={(e) => setFormData({ ...formData, passMark: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Attempts
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.maxAttempts}
                    onChange={(e) => setFormData({ ...formData, maxAttempts: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="Instructions for students taking this quiz..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="shuffleToggle"
                  checked={formData.shuffleQuestions}
                  onChange={(e) => setFormData({ ...formData, shuffleQuestions: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="shuffleToggle" className="text-xs font-medium text-slate-700">
                  Shuffle questions randomly for each student
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
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
                  Create Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizzesPage;
