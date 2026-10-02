import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { lmsService } from '../../services/lms.service';
import { courseService } from '../../services/course.service';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  MessageSquare,
  Pin,
  Search,
  Plus,
  BookOpen,
  MessageCircle,
  Clock,
  Trash2,
  X,
  Send,
  Lock,
} from 'lucide-react';

export const DiscussionsPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedCourse, setSelectedCourse] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Thread Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    courseId: '',
    isPinned: false,
  });

  // Fetch courses
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['myCourses'],
    queryFn: () => courseService.getCourses({ limit: 100 }),
  });

  const courses = coursesData?.data?.courses || [];

  // Automatically select first course if none selected
  React.useEffect(() => {
    if (!selectedCourse && courses.length > 0) {
      setSelectedCourse(courses[0].id);
    }
  }, [courses, selectedCourse]);

  // Fetch discussions for the selected course
  const { data: discussionsData, isLoading: discussionsLoading } = useQuery({
    queryKey: ['discussions', selectedCourse, searchQuery],
    queryFn: () =>
      lmsService.getDiscussions({
        courseId: selectedCourse,
        search: searchQuery || undefined,
      }),
    enabled: Boolean(selectedCourse),
  });

  const discussions = discussionsData?.data || [];

  // Create Discussion Mutation
  const createMutation = useMutation({
    mutationFn: (data) => lmsService.createDiscussion(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['discussions', selectedCourse]);
      setShowCreateModal(false);
      setFormData({ title: '', content: '', courseId: '', isPinned: false });
      if (res?.data?.id) {
        navigate(`/discussions/${res.data.id}`);
      }
    },
  });

  // Toggle Pin Mutation
  const pinMutation = useMutation({
    mutationFn: (id) => lmsService.togglePinDiscussion(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['discussions', selectedCourse]);
    },
  });

  // Delete Discussion Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => lmsService.deleteDiscussion(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['discussions', selectedCourse]);
    },
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;
    createMutation.mutate({
      courseId: selectedCourse,
      title: formData.title,
      content: formData.content,
      isPinned: formData.isPinned,
    });
  };

  const isInstructorOrAdmin = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600">
              <MessageSquare className="w-6 h-6" />
            </div>
            Course Discussion Forums
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Collaborate with peers, ask clarification questions, and share study insights.
          </p>
        </div>

        <button
          disabled={!selectedCourse}
          onClick={() => {
            setFormData({ ...formData, courseId: selectedCourse });
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700 transition disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>New Discussion Thread</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Course Dropdown */}
        <div className="sm:w-80">
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Active Forum Course:
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none"
          >
            {courses.length === 0 ? (
              <option value="">No courses available</option>
            ) : (
              courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}: {c.title}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Search Input */}
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Search Topics:
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search discussions by topic or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Threads List */}
      {discussionsLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : !selectedCourse ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400">
          <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">Please select a course to view its forum discussions.</p>
        </div>
      ) : discussions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No discussions found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Be the first to post a question or topic for your classmates in this course!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Start the First Thread</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {discussions.map((disc) => {
            const isAuthor = disc.authorId === user?.id;
            const canDelete = isAuthor || isInstructorOrAdmin;

            return (
              <div
                key={disc.id}
                onClick={() => navigate(`/discussions/${disc.id}`)}
                className={`group flex items-start justify-between gap-4 rounded-2xl border p-5 shadow-soft-sm hover:shadow-soft-md hover:border-brand-300 transition cursor-pointer bg-white ${
                  disc.isPinned ? 'border-amber-300/80 bg-amber-50/20' : 'border-slate-200/80'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Author Avatar */}
                  {disc.author?.avatarUrl ? (
                    <img
                      src={disc.author.avatarUrl}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs flex-shrink-0">
                      {disc.author?.firstName?.[0] || 'U'}
                      {disc.author?.lastName?.[0] || ''}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {disc.isPinned && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                          <Pin className="w-3 h-3 rotate-45" /> PINNED
                        </span>
                      )}
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition">
                        {disc.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {disc.content}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2.5">
                      <span className="font-medium text-slate-600">
                        {disc.author?.firstName} {disc.author?.lastName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(disc.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-brand-600">
                        <MessageSquare className="w-3 h-3" />
                        {disc._count?.replies || 0} replies
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isInstructorOrAdmin && (
                    <button
                      onClick={() => pinMutation.mutate(disc.id)}
                      title={disc.isPinned ? 'Unpin topic' : 'Pin to top'}
                      className={`p-1.5 rounded-lg transition ${
                        disc.isPinned
                          ? 'text-amber-600 hover:bg-amber-100'
                          : 'text-slate-400 hover:text-amber-600 hover:bg-slate-100'
                      }`}
                    >
                      <Pin className={`w-4 h-4 ${disc.isPinned ? 'fill-amber-600' : ''}`} />
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this discussion thread?')) {
                          deleteMutation.mutate(disc.id);
                        }
                      }}
                      title="Delete thread"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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

      {/* Start Thread Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-soft-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-600" />
                Start Discussion Thread
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thread Topic / Question
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How does backpropagation calculate weight gradients?"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Details / Body
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Elaborate on your thought or question so peers and instructors can help..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none leading-relaxed"
                />
              </div>

              {isInstructorOrAdmin && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="pinToggle"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="pinToggle" className="text-xs text-slate-700 font-medium">
                    Pin this thread to top of forum
                  </label>
                </div>
              )}

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
                  <span>{createMutation.isPending ? 'Posting...' : 'Create Thread'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscussionsPage;
