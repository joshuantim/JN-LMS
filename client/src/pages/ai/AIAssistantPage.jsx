import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { aiService } from '../../services/ai.service';
import { courseService } from '../../services/course.service';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  BookOpen,
  MessageSquare,
  Bot,
  User as UserIcon,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  FileText,
  Copy,
  Check,
} from 'lucide-react';

export const AIAssistantPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const [activeConversationId, setActiveConversationId] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Fetch courses
  const { data: coursesData } = useQuery({
    queryKey: ['myCourses'],
    queryFn: () => courseService.getCourses({ limit: 100 }),
  });
  const courses = coursesData?.data?.courses || [];

  // Fetch conversations list
  const { data: convsData, isLoading: loadingConvs } = useQuery({
    queryKey: ['aiConversations'],
    queryFn: () => aiService.getConversations(),
  });
  const conversations = convsData?.data || [];

  // Fetch active conversation messages
  const { data: activeConvData, isLoading: loadingMessages } = useQuery({
    queryKey: ['aiConversation', activeConversationId],
    queryFn: () => aiService.getConversationById(activeConversationId),
    enabled: Boolean(activeConversationId),
  });
  const activeConversation = activeConvData?.data;
  const messages = activeConversation?.messages || [];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConversationId]);

  // Send Message Mutation
  const sendMutation = useMutation({
    mutationFn: (data) => aiService.sendMessage(data),
    onSuccess: (res) => {
      setInputMessage('');
      const newConvId = res.data?.conversationId;
      if (newConvId && newConvId !== activeConversationId) {
        setActiveConversationId(newConvId);
      }
      queryClient.invalidateQueries(['aiConversations']);
      queryClient.invalidateQueries(['aiConversation', newConvId || activeConversationId]);
    },
  });

  // Delete Conversation Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => aiService.deleteConversation(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries(['aiConversations']);
      if (activeConversationId === deletedId) {
        setActiveConversationId(null);
      }
    },
  });

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || sendMutation.isPending) return;

    sendMutation.mutate({
      conversationId: activeConversationId || undefined,
      courseId: selectedCourse || undefined,
      message: inputMessage.trim(),
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    {
      title: 'Summarize Key Formulas',
      prompt: 'Summarize the core formulas and statistical conditions from our uploaded course notes.',
      icon: Lightbulb,
    },
    {
      title: 'Explain Hypothesis Testing',
      prompt: 'Explain the null and alternative hypothesis and what p-value means based on our lecture notes.',
      icon: HelpCircle,
    },
    {
      title: 'Practice Questions',
      prompt: 'Generate 3 conceptual review questions based on the uploaded lecture materials.',
      icon: Sparkles,
    },
  ];

  return (
    <div className="flex h-[calc(100vh-6.5rem)] rounded-3xl border border-slate-200/80 bg-white shadow-soft-md overflow-hidden">
      {/* Sidebar: Conversation History */}
      <div className="hidden md:flex w-72 flex-col border-r border-slate-100 bg-slate-50/60">
        <div className="p-4 border-b border-slate-100">
          <button
            onClick={() => {
              setActiveConversationId(null);
              setInputMessage('');
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Study Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
            Recent Conversations
          </span>
          {loadingConvs ? (
            <div className="py-8 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">No previous chats</p>
          ) : (
            conversations.map((c) => {
              const isActive = c.id === activeConversationId;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveConversationId(c.id)}
                  className={`group flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs cursor-pointer transition ${
                    isActive
                      ? 'bg-brand-100/70 text-brand-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-slate-400 group-hover:text-brand-600" />
                    <span className="truncate">{c.title}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Delete this conversation?')) {
                        deleteMutation.mutate(c.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3.5 bg-slate-50/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-600 text-white shadow-soft-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                JN LMS AI Assistant
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  RAG Grounded
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Powered by PostgreSQL pgvector similarity search
              </p>
            </div>
          </div>

          {/* Target Course Filter */}
          <div className="w-64">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="">All Uploaded Course Documents</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}: {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!activeConversationId && messages.length === 0 ? (
            <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-brand-600 via-brand-500 to-accent-500 text-white shadow-soft-xl">
                <Sparkles className="h-8 w-8 animate-pulse" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Ask Anything About Your Course Materials
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                  I search your lecture notes, uploaded PDFs, and syllabi using pgvector embeddings to provide grounded answers with exact source citations.
                </p>
              </div>

              {/* Quick Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
                {quickPrompts.map((qp, idx) => {
                  const Icon = qp.icon;
                  return (
                    <div
                      key={idx}
                      onClick={() => setInputMessage(qp.prompt)}
                      className="group p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-brand-300 hover:shadow-soft-sm cursor-pointer transition space-y-2"
                    >
                      <div className="p-2 rounded-xl bg-brand-50 text-brand-600 w-fit group-hover:bg-brand-600 group-hover:text-white transition">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">{qp.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {qp.prompt}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : loadingMessages ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
                >
                  {!isUser && (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-brand-600 to-accent-600 flex items-center justify-center text-white flex-shrink-0 mt-1 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`space-y-2.5 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                    {/* Message Bubble */}
                    <div
                      className={`rounded-2xl p-4 text-xs leading-relaxed shadow-soft-sm ${
                        isUser
                          ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-tr-none'
                          : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {!isUser && (
                        <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                          <span>Grounding: Course Knowledge Base</span>
                          <button
                            onClick={() => handleCopyText(msg.id, msg.content)}
                            className="inline-flex items-center gap-1 hover:text-slate-600 transition"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Interactive Citations Card (if assistant message has citations) */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3 space-y-2">
                        <span className="text-[11px] font-bold text-purple-900 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                          Referenced Course Sources ({msg.citations.length})
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.citations.map((cite, cIdx) => (
                            <div
                              key={cIdx}
                              className="rounded-lg bg-white p-2 border border-purple-100/80 shadow-soft-xs text-[11px] space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800 truncate">
                                  {cite.title || 'Course Material'}
                                </span>
                                {cite.pageNumber && (
                                  <span className="rounded bg-slate-100 px-1 text-[9px] font-semibold text-slate-600">
                                    p. {cite.pageNumber}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 line-clamp-2 italic">
                                "{cite.snippet}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0 mt-1">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {sendMutation.isPending && (
            <div className="flex gap-3 mr-auto items-center text-xs text-slate-400">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-brand-600 to-accent-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span>Searching course vectors and synthesizing answer...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Composer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <form onSubmit={handleSend} className="relative flex items-end gap-2">
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                rows={2}
                placeholder="Ask a question about your course materials... (Shift+Enter for new line)"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full rounded-2xl border border-slate-200 bg-white p-3 pr-10 text-xs text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={sendMutation.isPending || !inputMessage.trim()}
              className="h-11 w-11 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-soft-sm hover:bg-brand-700 transition disabled:opacity-50 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
