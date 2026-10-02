import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { lmsService } from '../../services/lms.service';
import { courseService } from '../../services/course.service';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Megaphone,
  Plus,
  Trash2,
  Calendar,
  Globe,
  BookOpen,
  Filter,
  X,
  Send,
} from 'lucide-react';

export const AnnouncementsPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [selectedCourse, setSelectedCourse] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    courseId: '',
    isSystemWide: false,
  });

  const canPost = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';

  // Fetch announcements
  const { data: announcementsData, isLoading } = useQuery({
    queryKey: ['announcements', selectedCourse],
    queryFn: () => lmsService.getAnnouncements(selectedCourse ? { courseId: selectedCourse } : {}),
  });

  // Fetch user courses for filter/create dropdown
  const { data: coursesData } = useQuery({
    queryKey: ['myCourses'],
    queryFn: () => courseService.getCourses({ limit: 100 }),
  });

  const announcements = announcementsData?.data || [];
  const courses = coursesData?.data?.courses || [];

  // Create Announcement Mutation
  const createMutation = useMutation({
    mutationFn: (data) => lmsService.createAnnouncement(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      setShowCreateModal(false);
      setFormData({ title: '', content: '', courseId: '', isSystemWide: false });
    },
  });

  // Delete Announcement Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => lmsService.deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;
    createMutation.mutate({
      title: formData.title,
      content: formData.content,
      courseId: formData.courseId || null,
      isSystemWide: formData.isSystemWide,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Megaphone className="w-6 h-6" />
            </div>
            Announcements & Bulletins
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Important updates, lecture alerts, and campus-wide communications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Course Filter */}
          <div className="relative">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="">All Announcements</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}: {c.title}
                </option>
              ))}
            </select>
          </div>

          {canPost && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Post Announcement</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content List */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No announcements found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Check back later for course bulletins or updates from your professors.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => {
            const isAuthor = ann.authorId === user?.id;
            const canDelete = isAuthor || user?.role === 'ADMIN';

            return (
              <div
                key={ann.id}
                className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft-sm hover:shadow-soft-md transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Author Avatar */}
                    {ann.author?.avatarUrl ? (
                      <img
                        src={ann.author.avatarUrl}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-accent-600 flex items-center justify-center font-bold text-white text-xs">
                        {ann.author?.firstName?.[0] || 'A'}
                        {ann.author?.lastName?.[0] || ''}
                      </div>
                    )}

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">
                          {ann.author?.firstName} {ann.author?.lastName}
                        </span>

                        {ann.isSystemWide ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700 border border-purple-200">
                            <Globe className="w-3 h-3" /> System Wide
                          </span>
                        ) : ann.course ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 border border-brand-200">
                            <BookOpen className="w-3 h-3" /> {ann.course.code}
                          </span>
                        ) : null}

                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          • {new Date(ann.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mt-2">
                        {ann.title}
                      </h3>

                      <p className="text-sm text-slate-600 mt-2 whitespace-pre-line leading-relaxed">
                        {ann.content}
                      </p>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this announcement?')) {
                          deleteMutation.mutate(ann.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                      title="Delete announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-soft-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-brand-600" />
                Publish Announcement
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Course Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Course
                </label>
                <select
                  disabled={formData.isSystemWide}
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none disabled:bg-slate-100"
                >
                  <option value="">Select a course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* System-wide option for admin */}
              {user?.role === 'ADMIN' && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isSystemWide"
                    checked={formData.isSystemWide}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isSystemWide: e.target.checked,
                        courseId: e.target.checked ? '' : formData.courseId,
                      })
                    }
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="isSystemWide" className="text-xs text-slate-700 font-medium">
                    Make system-wide bulletin (all users across campus)
                  </label>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule Change: Week 4 Lab"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Announcement Details
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Provide comprehensive instructions or updates..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700 transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{createMutation.isPending ? 'Publishing...' : 'Publish Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
