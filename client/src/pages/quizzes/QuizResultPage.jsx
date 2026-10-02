import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentService } from '../../services/assessment.service';
import {
  CheckCircle2,
  XCircle,
  Award,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export const QuizResultPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const data = await assessmentService.getAttemptReview(attemptId);
        setAttempt(data.attempt);
      } catch (err) {
        console.error('Failed to load attempt results:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [attemptId]);

  if (isLoading) {
    return <div className="p-12 text-center text-sm text-slate-400">Loading quiz evaluation...</div>;
  }

  if (!attempt) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
        <h3 className="text-base font-bold text-slate-900">Attempt Results Not Found</h3>
        <button
          onClick={() => navigate('/quizzes')}
          className="mt-3 text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          Return to Quizzes
        </button>
      </div>
    );
  }

  const passed = attempt.passed;
  const questions = attempt.quiz?.questions || [];
  const answers = attempt.answers || [];

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Top Banner Result */}
      <div
        className={`rounded-3xl p-6 sm:p-8 text-white shadow-soft-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 ${
          passed
            ? 'bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950'
            : 'bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950'
        }`}
      >
        <div className="space-y-2">
          <span
            className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold ${
              passed
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
            }`}
          >
            {passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            <span>{passed ? 'Assessment Passed' : 'Assessment Completed'}</span>
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {attempt.quiz?.title}
          </h1>

          <p className="text-xs text-slate-300">
            Attempt #{attempt.attemptNumber} • Submitted on {new Date(attempt.submittedAt).toLocaleString()}
          </p>
        </div>

        <div className="text-right bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 min-w-36">
          <span className="text-xs text-slate-300 uppercase font-semibold">Your Score</span>
          <div className="text-3xl font-extrabold mt-0.5">{attempt.percentage}%</div>
          <span className="text-xs text-slate-300">{attempt.score} Points Earned</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/quizzes')}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Quizzes</span>
        </button>

        <button
          onClick={() => navigate(`/quizzes/${attempt.quizId}/take`)}
          className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Retake Quiz</span>
        </button>
      </div>

      {/* Question by Question Review */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900">Question Evaluation & Review</h2>

        {questions.map((q, idx) => {
          const ans = answers.find((a) => a.questionId === q.id);
          const isCorrect = ans?.isCorrect;

          return (
            <div
              key={q.id}
              className={`rounded-3xl border bg-white p-6 sm:p-7 shadow-soft-sm space-y-4 ${
                isCorrect
                  ? 'border-emerald-200 ring-1 ring-emerald-500/10'
                  : 'border-rose-200 ring-1 ring-rose-500/10'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 uppercase">Question {idx + 1}</span>
                <span
                  className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full font-bold ${
                    isCorrect
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isCorrect ? 'Correct (+1 pt)' : 'Incorrect (0 pts)'}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-sm leading-relaxed">
                {q.questionText}
              </h3>

              {/* Answers comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                  <span className="font-bold text-slate-500 block mb-1">Your Answer:</span>
                  <p className={`font-semibold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {ans?.studentAnswer || 'No answer submitted'}
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-50/70 p-3.5 border border-emerald-100">
                  <span className="font-bold text-emerald-800 block mb-1">Correct Answer:</span>
                  <p className="font-semibold text-emerald-900">{q.correctAnswer}</p>
                </div>
              </div>

              {/* Explanation Note */}
              {q.explanation && (
                <div className="rounded-2xl bg-brand-50/50 p-4 border border-brand-100/60 text-xs text-slate-700 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-brand-800">
                    <Sparkles className="h-3.5 w-3.5 text-accent-600" />
                    <span>Explanation:</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {q.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuizResultPage;
