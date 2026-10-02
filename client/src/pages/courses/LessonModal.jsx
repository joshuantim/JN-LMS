import React, { useState, useEffect } from 'react';
import { X, Clock, BookOpen, CheckCircle, ArrowRight } from 'lucide-react';
import { courseService } from '../../services/course.service';

export const LessonModal = ({ lessonId, isOpen, onClose }) => {
  const [lesson, setLesson] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!lessonId || !isOpen) return;

    const fetchLesson = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await courseService.getLessonById(lessonId);
        setLesson(data.lesson);
      } catch (err) {
        setError(err.message || 'Failed to load lesson contents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-soft-lg max-h-[85vh] flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-brand-600 mb-1">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{lesson?.module?.title || 'Course Lesson'}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {lesson?.title || 'Loading Lesson...'}
            </h2>
            {lesson?.durationMinutes && (
              <div className="flex items-center space-x-1 text-xs text-slate-400 mt-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Estimated Duration: {lesson.durationMinutes} minutes</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-6 space-y-4">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 w-3/4 rounded bg-slate-100" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-5/6 rounded bg-slate-100" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
              {error}
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed space-y-3 whitespace-pre-wrap">
              {lesson?.content || 'No text content available for this lesson.'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xs text-slate-400">
            JN LMS Academic Viewer
          </span>
          <button
            onClick={onClose}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700 transition"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Mark Complete & Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonModal;
