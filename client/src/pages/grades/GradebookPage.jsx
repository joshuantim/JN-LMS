import React, { useState, useEffect } from 'react';
import { assessmentService } from '../../services/assessment.service';
import {
  Award,
  BookOpen,
  FileText,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export const GradebookPage = () => {
  const [gradebook, setGradebook] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      setIsLoading(true);
      try {
        const data = await assessmentService.getStudentGradebook();
        setGradebook(data.gradebook || []);
      } catch (err) {
        console.error('Failed to load gradebook:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGrades();
  }, []);

  const overallAverage =
    gradebook.length > 0
      ? (
          gradebook.reduce((sum, c) => sum + c.overallPercentage, 0) /
          gradebook.length
        ).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 px-3 py-1 text-xs font-semibold text-emerald-800 mb-2">
            <Award className="h-3.5 w-3.5 text-emerald-600" />
            <span>Academic Performance Record</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Student Gradebook
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Comprehensive evaluation record across all enrolled courses and assessments.
          </p>
        </div>

        {/* Global GPA Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-soft-sm flex items-center space-x-4 min-w-56">
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Cumulative Average
            </span>
            <span className="text-2xl font-extrabold text-slate-900">
              {overallAverage}%
            </span>
          </div>
        </div>
      </div>

      {/* Course Grade Cards */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-44 rounded-2xl bg-slate-100" />
          <div className="h-44 rounded-2xl bg-slate-100" />
        </div>
      ) : gradebook.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Award className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No grades recorded</h3>
          <p className="text-xs text-slate-500 mt-1">
            Grades will appear here as you submit assignments and complete quizzes.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {gradebook.map((courseData) => (
            <div
              key={courseData.courseId}
              className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-soft-sm space-y-6"
            >
              {/* Course Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">
                    {courseData.courseCode}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    {courseData.courseTitle}
                  </h2>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 block uppercase">Course Score</span>
                    <span className="text-xl font-extrabold text-brand-600">
                      {courseData.overallPercentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Assignments Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <FileText className="h-4 w-4 text-brand-600" />
                  <span>Assignments ({courseData.assignments?.length || 0})</span>
                </h3>

                {courseData.assignments?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No assignments for this course.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold uppercase">
                        <tr>
                          <th className="py-2.5 px-4">Assignment</th>
                          <th className="py-2.5 px-4">Status</th>
                          <th className="py-2.5 px-4 text-right">Score Earned</th>
                          <th className="py-2.5 px-4">Instructor Feedback</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {courseData.assignments.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {item.title}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.status === 'GRADED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : item.status === 'SUBMITTED'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-slate-800">
                              {item.score !== null ? `${item.score} / ${item.maxScore}` : '—'}
                            </td>
                            <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                              {item.feedback || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Quizzes Section */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <HelpCircle className="h-4 w-4 text-accent-600" />
                  <span>Quizzes ({courseData.quizzes?.length || 0})</span>
                </h3>

                {courseData.quizzes?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No quizzes for this course.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold uppercase">
                        <tr>
                          <th className="py-2.5 px-4">Quiz Title</th>
                          <th className="py-2.5 px-4">Evaluated Status</th>
                          <th className="py-2.5 px-4 text-right">Percentage</th>
                          <th className="py-2.5 px-4 text-right">Attempts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {courseData.quizzes.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {item.title}
                            </td>
                            <td className="py-3 px-4">
                              {item.status === 'COMPLETED' ? (
                                <span
                                  className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                    item.passed
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {item.passed ? (
                                    <CheckCircle2 className="h-3 w-3" />
                                  ) : (
                                    <AlertCircle className="h-3 w-3" />
                                  )}
                                  <span>{item.passed ? 'PASSED' : 'NOT PASSED'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                                  NOT TAKEN
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-slate-800">
                              {item.percentage !== null ? `${item.percentage}%` : '—'}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-500">
                              {item.attemptsCount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GradebookPage;
