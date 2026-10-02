import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { lmsService } from '../../services/lms.service';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  ArrowLeft,
  MessageSquare,
  Pin,
  Clock,
  Trash2,
  Send,
  BookOpen,
  CornerDownRight,
} from 'lucide-react';

export const DiscussionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [replyContent, setReplyContent] = useState('');

  // Fetch thread details
  const { data: threadData, isLoading, error } = useQuery({
    queryKey: ['discussionThread', id],
    queryFn: () => lmsService.getDiscussionById(id),
  });

  const thread = threadData?.data;

  // Post Reply Mutation
  const replyMutation = useMutation({
    mutationFn: (content) => lmsService.replyToDiscussion(id, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries(['discussionThread', id]);
      setReplyContent('');
    },
  });

  // Delete Reply Mutation
  const deleteReplyMutation = useMutation({
    mutationFn: (replyId) => lmsService.deleteDiscussionReply(id, replyId),
    onSuccess: () => {
      queryClient.invalidateQueries(['discussionThread', id]);
    },
  });

  const handlePostReply = (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    replyMutation.mutate(replyContent);
  };

  const isInstructorOrAdmin = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800">Discussion Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">This thread may have been removed or you do not have permission to view it.</p>
        <button
          onClick={() => navigate('/discussions')}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Discussions</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/discussions')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Discussions</span>
        </button>
      </div>

      {/* Main Original Post Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {thread.author?.avatarUrl ? (
              <img
                src={thread.author.avatarUrl}
                alt=""
                className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-brand-600 to-accent-600 flex items-center justify-center font-bold text-white text-sm">
                {thread.author?.firstName?.[0] || 'U'}
                {thread.author?.lastName?.[0] || ''}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">
                  {thread.author?.firstName} {thread.author?.lastName}
                </span>
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                  {thread.author?.role}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(thread.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {thread.course && (
                  <>
                    <span>•</span>
                    <span className="font-medium text-brand-600">
                      {thread.course.code}: {thread.course.title}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {thread.isPinned && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 border border-amber-200">
              <Pin className="w-3.5 h-3.5" /> Pinned
            </span>
          )}
        </div>

        {/* Title & Body */}
        <div className="pt-2 border-t border-slate-100">
          <h1 className="text-xl font-bold text-slate-900 leading-snug">
            {thread.title}
          </h1>
          <p className="text-sm text-slate-700 whitespace-pre-line mt-3 leading-relaxed">
            {thread.content}
          </p>
        </div>
      </div>

      {/* Replies Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-600" />
            Replies ({thread.replies?.length || 0})
          </h2>
        </div>

        {/* Replies List */}
        <div className="space-y-3">
          {(!thread.replies || thread.replies.length === 0) ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-400 text-xs">
              No replies yet. Be the first to join the conversation below.
            </div>
          ) : (
            thread.replies.map((reply) => {
              const isReplyAuthor = reply.authorId === user?.id;
              const canDeleteReply = isReplyAuthor || isInstructorOrAdmin;

              return (
                <div
                  key={reply.id}
                  className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-soft-sm flex items-start gap-4 hover:border-slate-300 transition"
                >
                  {/* Reply Author Avatar */}
                  {reply.author?.avatarUrl ? (
                    <img
                      src={reply.author.avatarUrl}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs flex-shrink-0">
                      {reply.author?.firstName?.[0] || 'U'}
                      {reply.author?.lastName?.[0] || ''}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">
                          {reply.author?.firstName} {reply.author?.lastName}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-semibold text-slate-500">
                          {reply.author?.role}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(reply.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {canDeleteReply && (
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this reply?')) {
                              deleteReplyMutation.mutate(reply.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                          title="Delete reply"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 whitespace-pre-line mt-2 leading-relaxed">
                      {reply.content}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reply Composer Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm mt-6">
          <h3 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
            <CornerDownRight className="w-3.5 h-3.5 text-brand-600" />
            Post a Reply
          </h3>
          <form onSubmit={handlePostReply} className="space-y-3">
            <textarea
              required
              rows={3}
              placeholder="Contribute your insights, answer a question, or provide feedback..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none leading-relaxed"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={replyMutation.isPending || !replyContent.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700 transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{replyMutation.isPending ? 'Posting...' : 'Post Reply'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DiscussionDetailPage;
