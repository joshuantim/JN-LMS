import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { documentService } from '../../services/document.service';
import { courseService } from '../../services/course.service';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  FileText,
  UploadCloud,
  Search,
  Trash2,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  Eye,
  X,
  FileCheck,
  FileType,
} from 'lucide-react';

export const DocumentsPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [selectedCourse, setSelectedCourse] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  // Chunk Inspector Modal State
  const [inspectingDoc, setInspectingDoc] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [loadingChunks, setLoadingChunks] = useState(false);

  // Fetch courses
  const { data: coursesData } = useQuery({
    queryKey: ['myCourses'],
    queryFn: () => courseService.getCourses({ limit: 100 }),
  });
  const courses = coursesData?.data?.courses || [];

  // Fetch documents
  const { data: docsData, isLoading, refetch } = useQuery({
    queryKey: ['documents', selectedCourse, searchQuery],
    queryFn: () =>
      documentService.getDocuments({
        courseId: selectedCourse || undefined,
        search: searchQuery || undefined,
      }),
    refetchInterval: (query) => {
      // Auto-poll every 3s if any document is PROCESSING
      const docs = query.state.data?.data || [];
      const hasProcessing = docs.some((d) => d.status === 'PROCESSING' || d.status === 'UPLOADED');
      return hasProcessing ? 3000 : false;
    },
  });
  const documents = docsData?.data || [];

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: (formData) =>
      documentService.uploadDocument(formData, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percent);
      }),
    onSuccess: () => {
      setUploadProgress(null);
      setUploadError(null);
      queryClient.invalidateQueries(['documents']);
    },
    onError: (err) => {
      setUploadProgress(null);
      setUploadError(err.response?.data?.message || err.message || 'File upload failed');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => documentService.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      if (inspectingDoc) setInspectingDoc(null);
    },
  });

  const handleFileUpload = (file) => {
    if (!file) return;
    setUploadError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    if (selectedCourse) {
      formData.append('courseId', selectedCourse);
    }

    uploadMutation.mutate(formData);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleViewChunks = async (doc) => {
    setInspectingDoc(doc);
    setLoadingChunks(true);
    try {
      const res = await documentService.getDocumentChunks(doc.id);
      setChunks(res.data || []);
    } catch (err) {
      console.error('Error fetching chunks:', err);
      setChunks([]);
    } finally {
      setLoadingChunks(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getFileBadge = (fileType) => {
    const ext = (fileType || '').toLowerCase();
    switch (ext) {
      case 'pdf':
        return <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">PDF</span>;
      case 'docx':
      case 'doc':
        return <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">DOCX</span>;
      case 'pptx':
        return <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">SLIDES</span>;
      default:
        return <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">TEXT</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
              <Layers className="w-6 h-6" />
            </div>
            AI Document Repository & Knowledge Base
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload course materials, lecture slide decks, syllabus PDFs, and personal study notes for the AI Learning Assistant.
          </p>
        </div>

        {/* Course Filter */}
        <div className="sm:w-72">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="">All Uploaded Documents</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}: {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative rounded-3xl border-2 border-dashed p-8 text-center cursor-pointer transition ${
          isDragging
            ? 'border-brand-500 bg-brand-50/50 scale-[1.01]'
            : 'border-slate-200 hover:border-brand-400 bg-gradient-to-b from-white to-slate-50/50 hover:shadow-soft-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.pptx,.txt,.md"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-3 shadow-inner">
          <UploadCloud className="h-7 w-7" />
        </div>

        <h3 className="text-sm font-bold text-slate-900">
          Drop course materials here, or <span className="text-brand-600 underline">browse files</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Supports PDF, Word (.docx), PowerPoint (.pptx), Markdown (.md), and Text files up to 25 MB.
        </p>

        {/* Upload Progress Bar */}
        {uploadProgress !== null && (
          <div className="mt-4 max-w-xs mx-auto">
            <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
              <span>Uploading to Knowledge Base...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-600 to-accent-600 transition-all duration-200 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Upload Error Banner */}
        {uploadError && (
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          placeholder="Filter documents by name or keyword..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none"
        />
      </div>

      {/* Document Library Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-soft-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Processed Materials ({documents.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Auto-synced with Redis & BullMQ
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : documents.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Layers className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            No documents uploaded yet. Upload your first lecture notes or slides above!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-3">Document Title</th>
                  <th className="px-6 py-3">Course</th>
                  <th className="px-6 py-3">File Size</th>
                  <th className="px-6 py-3">AI Chunks</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => {
                  const canDelete =
                    doc.uploaderId === user?.id ||
                    user?.role === 'ADMIN' ||
                    user?.role === 'INSTRUCTOR';

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {getFileBadge(doc.fileType)}
                          <div>
                            <span className="font-bold text-slate-900 block truncate max-w-xs sm:max-w-sm">
                              {doc.title}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate block">
                              {doc.fileName} • {new Date(doc.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-3.5">
                        {doc.course ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded text-[11px]">
                            <BookOpen className="w-3 h-3" />
                            {doc.course.code}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Personal Study Note</span>
                        )}
                      </td>

                      <td className="px-6 py-3.5 text-slate-500">
                        {formatFileSize(doc.fileSize)}
                      </td>

                      <td className="px-6 py-3.5">
                        {doc.status === 'READY' ? (
                          <button
                            onClick={() => handleViewChunks(doc)}
                            className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700 hover:bg-purple-100 transition"
                            title="Click to view semantic chunks"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>{doc._count?.chunks || 0} Chunks</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="px-6 py-3.5">
                        {doc.status === 'READY' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> READY
                          </span>
                        ) : doc.status === 'PROCESSING' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200 animate-pulse">
                            <Clock className="w-3 h-3 animate-spin" /> EXTRACTING
                          </span>
                        ) : (
                          <span
                            title={doc.errorMessage || 'Processing failed'}
                            className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200 cursor-help"
                          >
                            <AlertCircle className="w-3 h-3" /> FAILED
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {doc.status === 'READY' && (
                            <button
                              onClick={() => handleViewChunks(doc)}
                              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                              title="Inspect AI Chunks"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete document "${doc.title}" and its AI index?`)) {
                                  deleteMutation.mutate(doc.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Chunk Inspector Modal */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-soft-xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    AI Semantic Chunks Inspector
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {inspectingDoc.title} ({chunks.length} chunks generated)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingDoc(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {loadingChunks ? (
                <div className="py-12 flex justify-center">
                  <LoadingSpinner />
                </div>
              ) : chunks.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">
                  No chunks generated for this document.
                </p>
              ) : (
                chunks.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2 hover:border-purple-300 transition"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded">
                        Chunk #{c.chunkIndex + 1}
                      </span>
                      <div className="flex items-center gap-2 text-slate-400">
                        {c.pageNumber && <span>Page {c.pageNumber}</span>}
                        <span>•</span>
                        <span>~{c.tokenCount || Math.ceil(c.content.length / 4)} tokens</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 font-mono leading-relaxed bg-white p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                      {c.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setInspectingDoc(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
