import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService } from '../../services/course.service';
import {
  Layers,
  PlusCircle,
  Trash2,
  Edit3,
  Clock,
  Save,
  Users,
  CheckCircle,
  ArrowLeft,
  X,
  BookOpen,
} from 'lucide-react';

export const ManageCoursePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [roster, setRoster] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('CURRICULUM'); // 'CURRICULUM' | 'SETTINGS' | 'ROSTER'

  // Modals / forms state
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');

  const [showLessonModal, setShowLessonModal] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonDuration, setLessonDuration] = useState('45');

  // Edit settings form
  const [settingsForm, setSettingsForm] = useState({
    title: '',
    description: '',
    courseImage: '',
    isPublished: true,
  });

  const fetchCourseData = async () => {
    setIsLoading(true);
    try {
      const data = await courseService.getCourseById(id);
      setCourse(data.course);
      setSettingsForm({
        title: data.course.title || '',
        description: data.course.description || '',
        courseImage: data.course.courseImage || '',
        isPublished: data.course.isPublished ?? true,
      });

      const rosterData = await courseService.getCourseRoster(id);
      setRoster(rosterData.roster || []);
    } catch (err) {
      console.error('Failed to load course management data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;

    try {
      await courseService.createModule(id, {
        title: moduleTitle.trim(),
        description: moduleDescription.trim(),
      });
      setModuleTitle('');
      setModuleDescription('');
      setShowModuleModal(false);
      await fetchCourseData();
    } catch (err) {
      alert(err.message || 'Failed to create module');
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Delete this module and all its lessons?')) return;
    try {
      await courseService.deleteModule(moduleId);
      await fetchCourseData();
    } catch (err) {
      alert(err.message || 'Failed to delete module');
    }
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    if (!lessonTitle.trim() || !targetModuleId) return;

    try {
      await courseService.createLesson(targetModuleId, {
        title: lessonTitle.trim(),
        content: lessonContent,
        durationMinutes: parseInt(lessonDuration) || 30,
      });
      setLessonTitle('');
      setLessonContent('');
      setTargetModuleId(null);
      setShowLessonModal(false);
      await fetchCourseData();
    } catch (err) {
      alert(err.message || 'Failed to create lesson');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      await courseService.deleteLesson(lessonId);
      await fetchCourseData();
    } catch (err) {
      alert(err.message || 'Failed to delete lesson');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await courseService.updateCourse(id, settingsForm);
      alert('Course settings saved successfully');
      await fetchCourseData();
    } catch (err) {
      alert(err.message || 'Failed to update course');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-400">Loading course manager...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(`/courses/${id}`)}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Course View</span>
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Manage Course: <span className="text-brand-600">{course?.code}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">{course?.title}</p>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
              course?.isPublished
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {course?.isPublished ? 'Status: Published' : 'Status: Draft'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('CURRICULUM')}
          className={`pb-3 flex items-center space-x-2 transition ${
            activeTab === 'CURRICULUM'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Curriculum & Modules</span>
        </button>

        <button
          onClick={() => setActiveTab('ROSTER')}
          className={`pb-3 flex items-center space-x-2 transition ${
            activeTab === 'ROSTER'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Enrolled Students ({roster.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`pb-3 flex items-center space-x-2 transition ${
            activeTab === 'SETTINGS'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Course Information</span>
        </button>
      </div>

      {/* Tab: Curriculum */}
      {activeTab === 'CURRICULUM' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Module Outline</h2>
            <button
              onClick={() => setShowModuleModal(true)}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700 transition"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add Module</span>
            </button>
          </div>

          <div className="space-y-4">
            {(!course?.modules || course.modules.length === 0) ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-xs text-slate-500">
                No modules created yet. Add your first module to begin structuring the syllabus.
              </div>
            ) : (
              course.modules.map((mod, index) => (
                <div
                  key={mod.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Module {index + 1}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">{mod.title}</h3>
                      {mod.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setTargetModuleId(mod.id);
                          setShowLessonModal(true);
                        }}
                        className="inline-flex items-center space-x-1 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>Add Lesson</span>
                      </button>
                      <button
                        onClick={() => handleDeleteModule(mod.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Module"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Lessons list */}
                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    {(!mod.lessons || mod.lessons.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">No lessons in this module.</p>
                    ) : (
                      mod.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">{lesson.title}</span>
                            <span className="ml-3 text-slate-400">
                              {lesson.durationMinutes ? `${lesson.durationMinutes} min` : ''}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="text-slate-400 hover:text-rose-600 transition"
                            title="Delete Lesson"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Roster */}
      {activeTab === 'ROSTER' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">Student Enrollment Roster</h2>
          {roster.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No students currently enrolled.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Student</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Enrolled Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roster.map((enr) => (
                  <tr key={enr.id}>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {enr.user?.firstName} {enr.user?.lastName}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{enr.user?.email}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        {enr.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(enr.enrolledAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === 'SETTINGS' && (
        <form onSubmit={handleSaveSettings} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm space-y-4 max-w-xl">
          <h2 className="text-base font-bold text-slate-900 mb-2">Edit Course Information</h2>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Course Title
            </label>
            <input
              type="text"
              value={settingsForm.title}
              onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Description / Syllabus
            </label>
            <textarea
              rows={4}
              value={settingsForm.description}
              onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Course Cover Image URL
            </label>
            <input
              type="url"
              value={settingsForm.courseImage}
              onChange={(e) => setSettingsForm({ ...settingsForm, courseImage: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="publishToggle"
              checked={settingsForm.isPublished}
              onChange={(e) => setSettingsForm({ ...settingsForm, isPublished: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="publishToggle" className="text-xs font-medium text-slate-700">
              Published (Visible to all students in directory)
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center space-x-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700 transition"
            >
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* Add Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-soft-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Add New Module</h3>
              <button
                onClick={() => setShowModuleModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateModule} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Module Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Module 3: Advanced Graph Algorithms"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief synopsis of topics covered..."
                  value={moduleDescription}
                  onChange={(e) => setModuleDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModuleModal(false)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700"
                >
                  Create Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-soft-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Add Lesson to Module</h3>
              <button
                onClick={() => setShowLessonModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateLesson} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lesson Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lesson 3.1: Dijkstra Shortest Paths"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Reading Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={lessonDuration}
                  onChange={(e) => setLessonDuration(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lesson Text / Study Guide Content
                </label>
                <textarea
                  rows={5}
                  placeholder="Enter lesson lecture notes, formulas, and explanations..."
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowLessonModal(false)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700"
                >
                  Save Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCoursePage;
