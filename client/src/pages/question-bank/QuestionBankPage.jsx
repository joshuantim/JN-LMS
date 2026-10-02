import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { assessmentService } from '../../services/assessment.service';
import { courseService } from '../../services/course.service';
import {
  HelpCircle,
  PlusCircle,
  Sparkles,
  Trash2,
  CheckCircle2,
  X,
  Search,
  Filter,
  Check,
} from 'lucide-react';

export const QuestionBankPage = () => {
  const { user } = useAuthStore();

  const [questions, setQuestions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [filterAiOnly, setFilterAiOnly] = useState(false);

  // Create Question Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    courseId: '',
    quizId: '',
    questionText: '',
    questionType: 'MULTIPLE_CHOICE',
    optionsText: 'A. Option 1\nB. Option 2\nC. Option 3\nD. Option 4',
    correctAnswer: 'A',
    explanation: '',
    points: '1',
    topic: '',
    difficulty: 'MEDIUM',
  });

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const data = await assessmentService.getQuestions({
        search: searchTerm,
        difficulty: selectedDifficulty !== 'ALL' ? selectedDifficulty : undefined,
        isAiGenerated: filterAiOnly ? true : undefined,
      });
      setQuestions(data.questions || []);

      const cData = await courseService.getCourses();
      setCourses(cData.courses || []);

      const qData = await assessmentService.getQuizzes();
      setQuizzes(qData.quizzes || []);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [searchTerm, selectedDifficulty, filterAiOnly]);

  const handleApprove = async (questionId) => {
    try {
      await assessmentService.updateQuestion(questionId, { isApproved: true });
      await fetchQuestions();
    } catch (err) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleDelete = async (questionId) => {
    if (!window.confirm('Delete this question from question bank?')) return;
    try {
      await assessmentService.deleteQuestion(questionId);
      await fetchQuestions();
    } catch (err) {
      alert(err.message || 'Failed to delete question');
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    try {
      let parsedOptions = [];
      if (formData.questionType === 'MULTIPLE_CHOICE') {
        parsedOptions = formData.optionsText
          .split('\n')
          .filter((line) => line.trim().length > 0)
          .map((line) => {
            const parts = line.split('.');
            if (parts.length > 1) {
              return { id: parts[0].trim(), text: parts.slice(1).join('.').trim() };
            }
            return { id: line.trim(), text: line.trim() };
          });
      }

      await assessmentService.createQuestion({
        courseId: formData.courseId || undefined,
        quizId: formData.quizId || undefined,
        questionText: formData.questionText,
        questionType: formData.questionType,
        options: parsedOptions,
        correctAnswer: formData.correctAnswer.trim(),
        explanation: formData.explanation,
        points: parseFloat(formData.points) || 1,
        topic: formData.topic,
        difficulty: formData.difficulty,
        isApproved: true,
      });

      setShowModal(false);
      setFormData({
        courseId: '',
        quizId: '',
        questionText: '',
        questionType: 'MULTIPLE_CHOICE',
        optionsText: 'A. Option 1\nB. Option 2\nC. Option 3\nD. Option 4',
        correctAnswer: 'A',
        explanation: '',
        points: '1',
        topic: '',
        difficulty: 'MEDIUM',
      });
      await fetchQuestions();
    } catch (err) {
      alert(err.message || 'Failed to create question');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 rounded-full bg-brand-50 border border-brand-200/60 px-3 py-1 text-xs font-semibold text-brand-700 mb-2">
            <HelpCircle className="h-3.5 w-3.5 text-brand-600" />
            <span>Curriculum Assessment Repository</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Question Bank
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage reusable exam questions, review AI-generated items, and build quizzes.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center space-x-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700 transition"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add Question</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-500">Difficulty:</span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <input
              type="checkbox"
              checked={filterAiOnly}
              onChange={(e) => setFilterAiOnly(e.target.checked)}
              className="h-3.5 w-3.5 rounded text-accent-600"
            />
            <span className="flex items-center space-x-1 font-medium text-slate-700">
              <Sparkles className="h-3 w-3 text-accent-500" />
              <span>AI-Generated Only</span>
            </span>
          </label>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search questions by text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Questions List */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 rounded-2xl bg-slate-100" />
          <div className="h-28 rounded-2xl bg-slate-100" />
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <HelpCircle className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No questions found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Click &quot;Add Question&quot; to build questions for your exams.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div
              key={q.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                    {q.questionType.replace('_', ' ')}
                  </span>
                  <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                    {q.difficulty || 'MEDIUM'}
                  </span>
                  {q.topic && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      Topic: {q.topic}
                    </span>
                  )}
                  {q.isAiGenerated && (
                    <span className="inline-flex items-center space-x-1 rounded-md bg-accent-100 px-2 py-0.5 text-[11px] font-bold text-accent-700">
                      <Sparkles className="h-3 w-3" />
                      <span>AI Generated</span>
                    </span>
                  )}
                  {!q.isApproved && (
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                      Draft (Pending Review)
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {!q.isApproved && (
                    <button
                      onClick={() => handleApprove(q.id)}
                      className="inline-flex items-center space-x-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Approve</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-slate-900 text-sm leading-relaxed">
                {q.questionText}
              </h3>

              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs space-y-1">
                <span className="font-bold text-emerald-800">Correct Answer: {q.correctAnswer}</span>
                {q.explanation && (
                  <p className="text-slate-500 pt-1">
                    <span className="font-semibold text-slate-700">Rationale:</span> {q.explanation}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Question Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-soft-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Add Question to Bank</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Course (Optional)
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="">General Bank</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Direct Quiz Attachment (Optional)
                  </label>
                  <select
                    value={formData.quizId}
                    onChange={(e) => setFormData({ ...formData, quizId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="">None (Bank Only)</option>
                    {quizzes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Question Text
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter the prompt or scenario..."
                  value={formData.questionText}
                  onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Question Type
                  </label>
                  <select
                    value={formData.questionType}
                    onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="TRUE_FALSE">True / False</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                    <option value="ESSAY">Essay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Points
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {formData.questionType === 'MULTIPLE_CHOICE' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Options (One per line: e.g. A. Option text)
                  </label>
                  <textarea
                    rows={4}
                    value={formData.optionsText}
                    onChange={(e) => setFormData({ ...formData, optionsText: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correct Answer
                </label>
                <input
                  type="text"
                  placeholder="e.g. A or True"
                  value={formData.correctAnswer}
                  onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Explanation / Solution Guide
                </label>
                <textarea
                  rows={2}
                  placeholder="Why is this answer correct..."
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
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
                  Save to Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBankPage;
