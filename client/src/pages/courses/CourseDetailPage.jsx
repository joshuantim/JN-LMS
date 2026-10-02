import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { courseService } from '../../services/course.service';
import LessonModal from './LessonModal';
import {
  BookOpen,
  Clock,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronRight,
  User,
  Megaphone,
  CheckCircle2,
  Settings,
  ArrowLeft,
  FileText,
  PlayCircle,
} from 'lucide-react';

export const CourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('MODULES'); // 'MODULES' | 'OVERVIEW' | 'ANNOUNCEMENTS'
  const [expandedModules, setExpandedModules] = useState({});
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const fetchCourse = async () => {
    setIsLoading(true);
    try {
      const data = await courseService.getCourseById(id);
      setCourse(data.course);
      // Auto-expand all modules initially
      const initialExpanded = {};
      (data.course?.modules || []).forEach((m) => {
        initialExpanded[m.id] = true;
      });
      setExpandedModules(initialExpanded);
    } catch (err) {
      console.error('Failed to load course details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const handleEnrollmentToggle = async () => {
    setIsEnrolling(true);
    try {
      if (course.isEnrolled) {
        if (window.confirm('Are you sure you want to withdraw from this course?')) {
          await courseService.dropCourse(course.id);
          await fetchCourse();
        }
      } else {
        await courseService.enrollInCourse(course.id);
        await fetchCourse();
      }
    } catch (err) {
      alert(err.message || 'Enrollment error');
    } finally {
      setIsEnrolling(false);
    }
  };

  const isOwner = user?.id === course?.instructorId || user?.role === 'ADMIN';

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-44 w-full rounded-3xl bg-slate-200" />
        <div className="h-10 w-64 rounded bg-slate-200" />
        <div className="h-64 w-full rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
        <h2 className="text-lg font-bold text-slate-900">Course Not Found</h2>
        <button
          onClick={() => navigate('/courses')}
          className="mt-4 inline-flex items-center space-x-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Course Directory</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/courses')}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Courses</span>
        </button>
      </div>

      {/* Course Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950 to-indigo-950 p-6 sm:p-8 text-white shadow-soft-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-white/10 backdrop-blur-md px-2.5 py-1 text-xs font-extrabold tracking-wider border border-white/20">
                {course.code}
              </span>
              {course.isEnrolled && (
                <span className="rounded-lg bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1 text-xs font-semibold text-emerald-300 flex items-center space-x-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Enrolled Student</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {course.title}
            </h1>

            {/* Instructor snippet */}
            <div className="flex items-center space-x-2 pt-1 text-xs text-slate-300">
              {course.instructor?.avatarUrl ? (
                <img
                  src={course.instructor.avatarUrl}
                  alt={course.instructor.firstName}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <User className="h-4 w-4" />
              )}
              <span>
                Instructor: {course.instructor?.firstName} {course.instructor?.lastName} ({course.instructor?.email})
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/ai-assistant')}
              className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-2.5 text-xs font-semibold text-white shadow-soft-md hover:from-brand-700 hover:to-accent-700 transition"
            >
              <Sparkles className="h-4 w-4 text-white" />
              <span>Ask AI About This Course</span>
            </button>

            {isOwner ? (
              <button
                onClick={() => navigate(`/courses/${course.id}/manage`)}
                className="inline-flex items-center space-x-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-soft-sm hover:bg-slate-100 transition"
              >
                <Settings className="h-4 w-4 text-slate-600" />
                <span>Manage Course Content</span>
              </button>
            ) : user?.role === 'STUDENT' ? (
              <button
                onClick={handleEnrollmentToggle}
                disabled={isEnrolling}
                className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                  course.isEnrolled
                    ? 'border border-white/20 bg-white/10 text-white hover:bg-white/20'
                    : 'bg-white text-slate-900 shadow-soft-sm hover:bg-slate-100'
                }`}
              >
                {isEnrolling
                  ? 'Processing...'
                  : course.isEnrolled
                  ? 'Withdraw from Course'
                  : 'Enroll Now'}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('MODULES')}
          className={`pb-3 flex items-center space-x-2 transition ${
            activeTab === 'MODULES'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Modules & Lessons ({course.modules?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`pb-3 flex items-center space-x-2 transition ${
            activeTab === 'OVERVIEW'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Syllabus & Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('ANNOUNCEMENTS')}
          className={`pb-3 flex items-center space-x-2 transition ${
            activeTab === 'ANNOUNCEMENTS'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Megaphone className="h-4 w-4" />
          <span>Announcements ({course.announcements?.length || 0})</span>
        </button>
      </div>

      {/* Tab 1: Modules & Lessons */}
      {activeTab === 'MODULES' && (
        <div className="space-y-4">
          {(!course.modules || course.modules.length === 0) ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Layers className="mx-auto h-10 w-10 text-slate-300 mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No modules added yet</h3>
              <p className="text-xs text-slate-500 mt-1">
                {isOwner
                  ? 'Click "Manage Course Content" to start structuring modules and lessons.'
                  : 'Your instructor has not published any modules for this course yet.'}
              </p>
            </div>
          ) : (
            course.modules.map((mod, index) => {
              const isExpanded = !!expandedModules[mod.id];

              return (
                <div
                  key={mod.id}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-soft-sm"
                >
                  {/* Module Accordion Header */}
                  <div
                    onClick={() => toggleModule(mod.id)}
                    className="flex cursor-pointer items-center justify-between p-5 hover:bg-slate-50/80 transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700 font-bold text-xs">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{mod.title}</h3>
                        {mod.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {mod.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-400">
                      <span>{mod.lessons?.length || 0} Lessons</span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Lessons List */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 divide-y divide-slate-100 bg-slate-50/40">
                      {(!mod.lessons || mod.lessons.length === 0) ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          No lessons inside this module yet.
                        </div>
                      ) : (
                        mod.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            onClick={() => {
                              if (!course.isEnrolled && !isOwner) {
                                alert('Please enroll in this course to open lesson contents.');
                                return;
                              }
                              setActiveLessonId(lesson.id);
                            }}
                            className="flex cursor-pointer items-center justify-between p-4 pl-12 hover:bg-white hover:text-brand-600 transition group text-xs"
                          >
                            <div className="flex items-center space-x-2.5">
                              <PlayCircle className="h-4 w-4 text-slate-400 group-hover:text-brand-600 transition" />
                              <span className="font-medium text-slate-800 group-hover:text-brand-600">
                                {lesson.title}
                              </span>
                            </div>

                            <div className="flex items-center space-x-3 text-slate-400">
                              {lesson.durationMinutes && (
                                <span className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{lesson.durationMinutes}m</span>
                                </span>
                              )}
                              <span className="font-semibold text-brand-600 group-hover:underline">
                                Read Lesson &rarr;
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Overview & Syllabus */}
      {activeTab === 'OVERVIEW' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-soft-sm">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-2">About this Course</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {course.description || 'No detailed course description provided yet.'}
            </p>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Course Instructor</h3>
            <div className="flex items-start space-x-4">
              {course.instructor?.avatarUrl ? (
                <img
                  src={course.instructor.avatarUrl}
                  alt={course.instructor.firstName}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-brand-500/20"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold">
                  {course.instructor?.firstName?.[0] || 'I'}
                </div>
              )}
              <div>
                <h4 className="font-semibold text-sm text-slate-900">
                  {course.instructor?.firstName} {course.instructor?.lastName}
                </h4>
                <p className="text-xs text-slate-400">{course.instructor?.email}</p>
                <p className="text-xs text-slate-600 mt-2 max-w-xl">
                  {course.instructor?.bio || 'Professor of Academic Studies and Course Leader.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Announcements */}
      {activeTab === 'ANNOUNCEMENTS' && (
        <div className="space-y-4">
          {(!course.announcements || course.announcements.length === 0) ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Megaphone className="mx-auto h-10 w-10 text-slate-300 mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No announcements posted</h3>
              <p className="text-xs text-slate-500 mt-1">
                Announcements from the instructor will appear here.
              </p>
            </div>
          ) : (
            course.announcements.map((ann) => (
              <div
                key={ann.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">{ann.title}</h3>
                  <span className="text-[11px] text-slate-400">
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {ann.content}
                </p>
                <div className="flex items-center space-x-2 pt-2 text-[11px] text-slate-400">
                  <span>Posted by: {ann.author?.firstName} {ann.author?.lastName}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Lesson Reader Modal */}
      <LessonModal
        lessonId={activeLessonId}
        isOpen={!!activeLessonId}
        onClose={() => setActiveLessonId(null)}
      />
    </div>
  );
};

export default CourseDetailPage;
