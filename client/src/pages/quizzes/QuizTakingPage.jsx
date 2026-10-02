import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentService } from '../../services/assessment.service';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Send,
  HelpCircle,
} from 'lucide-react';

export const QuizTakingPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { [questionId]: studentAnswer }
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const initializeAttempt = async () => {
      setIsLoading(true);
      try {
        const data = await assessmentService.startQuizAttempt(quizId);
        setAttempt(data.attempt);
        setQuiz(data.quiz);
        setQuestions(data.questions || []);

        // Load existing answers
        const existingAnswers = {};
        (data.answers || []).forEach((a) => {
          existingAnswers[a.questionId] = a.studentAnswer;
        });
        setAnswers(existingAnswers);

        // Compute remaining timer if quiz has time limit
        if (data.quiz?.timeLimitMinutes) {
          const startTime = new Date(data.attempt.startedAt).getTime();
          const limitMs = data.quiz.timeLimitMinutes * 60 * 1000;
          const elapsedMs = Date.now() - startTime;
          const remainingSecs = Math.max(0, Math.floor((limitMs - elapsedMs) / 1000));
          setTimeLeftSeconds(remainingSecs);
        }
      } catch (err) {
        alert(err.message || 'Failed to start quiz attempt');
        navigate('/quizzes');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAttempt();
  }, [quizId]);

  // Countdown timer hook
  useEffect(() => {
    if (timeLeftSeconds === null) return;
    if (timeLeftSeconds <= 0) {
      handleFinalSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeftSeconds]);

  const handleSelectAnswer = async (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    // Auto-save answer to server
    try {
      if (attempt?.id) {
        await assessmentService.recordAnswer(attempt.id, {
          questionId,
          studentAnswer: value,
        });
      }
    } catch (err) {
      console.error('Auto-save answer error:', err);
    }
  };

  const handleFinalSubmit = async () => {
    if (!attempt?.id || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await assessmentService.submitQuizAttempt(attempt.id);
      navigate(`/quizzes/attempts/${attempt.id}/results`);
    } catch (err) {
      alert(err.message || 'Submission error');
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds) => {
    if (seconds === null) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return <div className="p-12 text-center text-sm text-slate-400">Loading quiz session...</div>;
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
        <h3 className="text-base font-bold text-slate-800">This quiz has no questions</h3>
        <button
          onClick={() => navigate('/quizzes')}
          className="mt-3 text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          Return to Quizzes
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Top Floating Control Bar */}
      <div className="sticky top-20 z-20 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-4 shadow-soft-md flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {quiz?.title}
          </span>
          <span className="text-xs font-semibold text-slate-800">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {timeLeftSeconds !== null && (
            <div
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                timeLeftSeconds < 120
                  ? 'bg-rose-50 text-rose-600 animate-pulse'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>{formatTimer(timeLeftSeconds)}</span>
            </div>
          )}

          <button
            onClick={() => setShowConfirmModal(true)}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700 transition"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Finish Quiz</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Question + Navigator */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Question Panel */}
        <div className="md:col-span-3 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-soft-sm space-y-6 flex flex-col justify-between min-h-[420px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-brand-600 uppercase">
                {currentQ.questionType.replace('_', ' ')}
              </span>
              <span>{currentQ.points} Point{currentQ.points > 1 ? 's' : ''}</span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
              {currentQ.questionText}
            </h2>

            {/* Answer Options */}
            <div className="space-y-3 pt-2">
              {currentQ.questionType === 'MULTIPLE_CHOICE' && (
                <div className="space-y-2.5">
                  {(Array.isArray(currentQ.options) ? currentQ.options : []).map((opt, idx) => {
                    const optKey = typeof opt === 'string' ? opt : opt.text || opt.id;
                    const optId = typeof opt === 'object' && opt.id ? opt.id : String.fromCharCode(65 + idx);
                    const isSelected = answers[currentQ.id] === optId || answers[currentQ.id] === optKey;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectAnswer(currentQ.id, optId)}
                        className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-medium transition flex items-center space-x-3 ${
                          isSelected
                            ? 'border-brand-600 bg-brand-50/80 text-brand-900 ring-2 ring-brand-500/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-lg font-bold text-xs ${
                            isSelected
                              ? 'bg-brand-600 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {optId}
                        </span>
                        <span className="flex-1">{typeof opt === 'string' ? opt : opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQ.questionType === 'TRUE_FALSE' && (
                <div className="grid grid-cols-2 gap-3">
                  {['True', 'False'].map((val) => {
                    const isSelected = answers[currentQ.id] === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleSelectAnswer(currentQ.id, val)}
                        className={`p-4 rounded-2xl border text-center font-bold text-sm transition ${
                          isSelected
                            ? 'border-brand-600 bg-brand-50 text-brand-900 ring-2 ring-brand-500/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              )}

              {(currentQ.questionType === 'SHORT_ANSWER' || currentQ.questionType === 'ESSAY') && (
                <div>
                  <textarea
                    rows={4}
                    placeholder="Type your response here..."
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-800 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            {isLastQuestion ? (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="inline-flex items-center space-x-1.5 rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700 transition"
              >
                <span>Submit Quiz</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="inline-flex items-center space-x-1.5 rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700 transition"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Question Navigator */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft-sm space-y-4 h-fit">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase">Navigator</span>
            <span className="text-xs text-slate-400">
              {answeredCount}/{questions.length} Answered
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = idx === currentIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 w-full rounded-xl text-xs font-bold transition flex items-center justify-center ${
                    isCurrent
                      ? 'border-2 border-brand-600 bg-brand-50 text-brand-700'
                      : isAnswered
                      ? 'bg-slate-800 text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-800" />
              <span>Answered</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-slate-50" />
              <span>Unanswered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-soft-lg space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="font-bold text-slate-900 text-base">Submit Quiz?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You have answered <span className="font-bold text-slate-800">{answeredCount}</span> out of{' '}
              <span className="font-bold text-slate-800">{questions.length}</span> questions.
              Once submitted, your answers will be automatically evaluated.
            </p>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Back to Questions
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Evaluating...' : 'Yes, Submit Final'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizTakingPage;
