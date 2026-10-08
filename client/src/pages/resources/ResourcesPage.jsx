import React, { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { documentService } from '../../services/document.service';
import { courseService } from '../../services/course.service';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Folder,
  FolderOpen,
  FileText,
  UploadCloud,
  Search,
  Trash2,
  Download,
  Eye,
  Plus,
  RefreshCw,
  Sparkles,
  Layers,
  FileCode,
  FileCheck,
  ChevronRight,
  HardDrive,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ExternalLink,
} from 'lucide-react';

export const ResourcesPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const isInstructorOrAdmin = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';

  // Filters & View State
  const [selectedCourse, setSelectedCourse] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'name' | 'size'

  // Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCourseId, setUploadCourseId] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Download & Preview State
  const [downloadingId, setDownloadingId] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewChunks, setPreviewChunks] = useState([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch Courses
  const { data: coursesData } = useQuery({
    queryKey: ['myCourses'],
    queryFn: () => courseService.getCourses({ limit: 100 }),
  });
  const courses = coursesData?.courses || coursesData?.data?.courses || [];

  // Fetch Documents
  const {
    data: docsData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['resources', selectedCourse, searchQuery],
    queryFn: () =>
      documentService.getDocuments({
        courseId: selectedCourse || undefined,
        search: searchQuery || undefined,
      }),
    refetchInterval: (query) => {
      const docs = query.state.data?.data || [];
      const hasProcessing = docs.some(
        (d) => d.status === 'PROCESSING' || d.status === 'UPLOADED'
      );
      return hasProcessing ? 3000 : false;
    },
  });

  const rawDocuments = docsData?.data || [];

  // Filter & Sort
  const filteredDocuments = useMemo(() => {
    let list = [...rawDocuments];

    if (fileTypeFilter !== 'ALL') {
      list = list.filter((doc) => {
        const ext = (doc.fileType || '').toLowerCase();
        if (fileTypeFilter === 'PDF') return ext === 'pdf';
        if (fileTypeFilter === 'SLIDES') return ext === 'pptx' || ext === 'ppt';
        if (fileTypeFilter === 'DOCS') return ext === 'docx' || ext === 'doc';
        if (fileTypeFilter === 'TEXT') return ext === 'txt' || ext === 'md';
        return true;
      });
    }

    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'name') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'size') {
      list.sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0));
    }

    return list;
  }, [rawDocuments, fileTypeFilter, sortBy]);

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: (formData) =>
      documentService.uploadDocument(formData, (progressEvent) => {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percent);
      }),
    onSuccess: () => {
      setUploadProgress(null);
      setUploadError(null);
      setUploadFile(null);
      setUploadTitle('');
      setUploadCourseId('');
      setIsUploadOpen(false);
      queryClient.invalidateQueries(['resources']);
    },
    onError: (err) => {
      setUploadProgress(null);
      setUploadError(
        err.response?.data?.message || err.message || 'File upload failed'
      );
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => documentService.deleteDocument(id),
    onSuccess: () => {
      setDeletingId(null);
      queryClient.invalidateQueries(['resources']);
      if (previewDoc) setPreviewDoc(null);
    },
    onError: (err) => {
      setDeletingId(null);
      alert(err.response?.data?.message || 'Failed to delete resource');
    },
  });

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please choose a file to upload');
      return;
    }

    setUploadError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', uploadFile);
    if (uploadTitle.trim()) {
      formData.append('title', uploadTitle.trim());
    }
    if (uploadCourseId) {
      formData.append('courseId', uploadCourseId);
    }

    uploadMutation.mutate(formData);
  };

  const handleDownload = async (doc) => {
    try {
      setDownloadingId(doc.id);
      await documentService.downloadDocument(doc.id, doc.fileName);
    } catch (err) {
      console.error('Download error:', err);
      // Fallback: if storageUrl is public URL
      if (doc.storageUrl) {
        window.open(doc.storageUrl, '_blank');
      } else {
        alert('Could not download file. Please try again.');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handleInspect = async (doc) => {
    setPreviewDoc(doc);
    setLoadingChunks(true);
    try {
      const res = await documentService.getDocumentChunks(doc.id);
      setPreviewChunks(res.data || []);
    } catch (err) {
      console.error('Failed to load chunks:', err);
      setPreviewChunks([]);
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

  const getFileIcon = (fileType) => {
    const ext = (fileType || '').toLowerCase();
    if (ext === 'pdf') {
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
          <span className="text-[10px] font-extrabold uppercase">PDF</span>
        </div>
      );
    }
    if (ext === 'pptx' || ext === 'ppt') {
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
          <span className="text-[10px] font-extrabold uppercase">PPT</span>
        </div>
      );
    }
    if (ext === 'docx' || ext === 'doc') {
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
          <span className="text-[10px] font-extrabold uppercase">DOC</span>
        </div>
      );
    }
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
        <FileText className="h-4 w-4" />
      </div>
    );
  };

  const selectedCourseObj = courses.find((c) => c.id === selectedCourse);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-brand-600">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-100">
              <Folder className="h-3.5 w-3.5 text-brand-600" />
              Academic File Repository
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-normal">Cloudflare R2 Storage</span>
          </div>

          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Site Resources
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Browse, download, and manage learning materials, lecture slides, and course notes.
          </p>

          {/* Breadcrumb Navigation */}
          <nav className="mt-3 flex items-center space-x-2 text-xs text-slate-500">
            <button
              onClick={() => setSelectedCourse('')}
              className={`hover:text-brand-600 font-medium transition ${
                !selectedCourse ? 'text-brand-600 font-semibold' : ''
              }`}
            >
              All site files
            </button>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-semibold text-slate-700">
              {selectedCourseObj ? `${selectedCourseObj.code} - ${selectedCourseObj.title}` : 'Home'}
            </span>
          </nav>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-soft-xs hover:bg-slate-50 transition"
            title="Refresh resources list"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin text-brand-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {isInstructorOrAdmin && (
            <button
              onClick={() => {
                setUploadCourseId(selectedCourse || '');
                setIsUploadOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-2 text-xs font-semibold text-white shadow-soft-sm hover:from-brand-700 hover:to-accent-700 transition"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Upload Learning Material</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-soft-xs">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Materials</p>
          <p className="mt-1 text-xl font-bold text-slate-800">{rawDocuments.length}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-soft-xs">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Courses</p>
          <p className="mt-1 text-xl font-bold text-slate-800">{courses.length}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-soft-xs">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Storage Engine</p>
          <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-brand-700">
            <HardDrive className="h-4 w-4 text-brand-600" />
            <span>Cloudflare R2</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-soft-xs">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">AI Integration</p>
          <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <span>Semantic Ready</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search learning materials by title, topic, or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-8 text-xs text-slate-800 placeholder-slate-400 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Course Selector Dropdown */}
          <div className="w-full md:w-64">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-700 focus:border-brand-500 focus:bg-white focus:outline-none"
            >
              <option value="">All Courses & Materials</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} — {course.title}
                </option>
              ))}
            </select>
          </div>

          {/* Sort & View Mode */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-700 focus:border-brand-500 focus:bg-white focus:outline-none"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="name">Sort: Title (A-Z)</option>
              <option value="size">Sort: File Size</option>
            </select>

            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table' ? 'bg-white text-brand-600 shadow-soft-xs' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Table List View"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-white text-brand-600 shadow-soft-xs' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* File Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-medium text-slate-400 mr-1">Format:</span>
          {[
            { label: 'All Files', value: 'ALL' },
            { label: 'PDF Documents', value: 'PDF' },
            { label: 'Lecture Slides (PPT)', value: 'SLIDES' },
            { label: 'Word Documents', value: 'DOCS' },
            { label: 'Notes (Text/MD)', value: 'TEXT' },
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => setFileTypeFilter(type.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                fileTypeFilter === type.value
                  ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-soft-xs'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 text-center">
          <LoadingSpinner />
          <p className="mt-3 text-xs text-slate-500">Loading resources repository...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-soft-sm">
            <FolderOpen className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">
            {searchQuery || fileTypeFilter !== 'ALL' || selectedCourse
              ? 'No matching resources found'
              : 'No learning materials uploaded yet'}
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
            {isInstructorOrAdmin
              ? 'Upload your lecture slides, syllabus, or reading documents so your students can access and download them.'
              : 'Your instructors have not published materials for this course yet. Check back soon!'}
          </p>
          {isInstructorOrAdmin && (
            <button
              onClick={() => {
                setUploadCourseId(selectedCourse || '');
                setIsUploadOpen(true);
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Upload First Resource</span>
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Table View matching Sakai/Canvas file table structure */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Title & Name</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Access</th>
                  <th className="py-3 px-4">Uploaded By</th>
                  <th className="py-3 px-4">Modified</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocuments.map((doc) => {
                  const isOwnerOrAdmin =
                    user?.id === doc.uploaderId || user?.role === 'ADMIN';

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Title & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3 min-w-[200px]">
                          {getFileIcon(doc.fileType)}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate group-hover:text-brand-600 transition-colors">
                              {doc.title}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {doc.fileName}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Course */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {doc.course ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-brand-50 text-brand-700 border border-brand-100">
                            <BookOpen className="h-3 w-3 text-brand-500" />
                            {doc.course.code}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            General Resource
                          </span>
                        )}
                      </td>

                      {/* Access */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {doc.course ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            Enrolled Students
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
                            All Users
                          </span>
                        )}
                      </td>

                      {/* Uploaded By */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700">
                            {doc.uploader?.firstName?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="text-slate-800 font-medium">
                              {doc.uploader?.firstName} {doc.uploader?.lastName}
                            </p>
                            <span className="text-[10px] text-slate-400 capitalize">
                              {doc.uploader?.role?.toLowerCase()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Modified Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        {new Date(doc.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Size */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                        {formatFileSize(doc.fileSize)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Download Button */}
                          <button
                            onClick={() => handleDownload(doc)}
                            disabled={downloadingId === doc.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 hover:border-brand-300 transition shadow-soft-2xs"
                            title="Download material"
                          >
                            <Download className={`h-3.5 w-3.5 text-brand-600 ${downloadingId === doc.id ? 'animate-bounce' : ''}`} />
                            <span className="hidden sm:inline">Download</span>
                          </button>

                          {/* Inspect / Preview Button */}
                          <button
                            onClick={() => handleInspect(doc)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition"
                            title="Preview Content"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {/* Ask AI about this */}
                          <button
                            onClick={() => navigate('/ai-assistant')}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition"
                            title="Ask AI about this document"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete (if allowed) */}
                          {isOwnerOrAdmin && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete "${doc.title}"?`)) {
                                  deleteMutation.mutate(doc.id);
                                }
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition"
                              title="Delete Material"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
        </div>
      ) : (
        /* Grid Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const isOwnerOrAdmin =
              user?.id === doc.uploaderId || user?.role === 'ADMIN';

            return (
              <div
                key={doc.id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft-xs hover:shadow-soft-md hover:border-brand-200 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-2.5">
                      {getFileIcon(doc.fileType)}
                      <div className="min-w-0">
                        {doc.course && (
                          <span className="inline-block text-[10px] font-semibold text-brand-600 uppercase tracking-wider">
                            {doc.course.code}
                          </span>
                        )}
                        <h4 className="font-semibold text-slate-800 text-xs truncate max-w-[180px]">
                          {doc.title}
                        </h4>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">
                      {formatFileSize(doc.fileSize)}
                    </span>
                  </div>

                  <p className="mt-3 text-[11px] text-slate-500 truncate">
                    {doc.fileName}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    By {doc.uploader?.firstName} {doc.uploader?.lastName} •{' '}
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleInspect(doc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
                      title="Inspect extracted text"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => navigate('/ai-assistant')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
                      title="Ask AI"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                    </button>
                    {isOwnerOrAdmin && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${doc.title}"?`)) {
                            deleteMutation.mutate(doc.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleDownload(doc)}
                    disabled={downloadingId === doc.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 font-semibold text-xs hover:bg-brand-100 transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Material Modal (Instructors & Admins) */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-soft-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <UploadCloud className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Upload Learning Material
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Files will be securely stored on Cloudflare R2 and accessible to students.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
              {uploadError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-100">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Course Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Course
                </label>
                <select
                  value={uploadCourseId}
                  onChange={(e) => setUploadCourseId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                >
                  <option value="">General Site Resource (All Students)</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Resource Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Material Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 4: Neural Networks Lecture Slides"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  File Document
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files?.[0]) {
                      setUploadFile(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed cursor-pointer transition ${
                    isDragging
                      ? 'border-brand-500 bg-brand-50/50'
                      : uploadFile
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.doc,.pptx,.txt,.md"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setUploadFile(e.target.files[0]);
                    }}
                  />

                  {uploadFile ? (
                    <div className="flex flex-col items-center text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 mb-2">
                        <FileCheck className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">{uploadFile.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formatFileSize(uploadFile.size)} • Click to replace file
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 mb-2">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-medium text-slate-700">
                        <span className="font-bold text-brand-600">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        PDF, PowerPoint (.pptx), Word (.docx), or Text (max 25 MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {uploadProgress !== null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-brand-700">
                    <span>Uploading to Cloudflare R2...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-brand-600 transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadMutation.isPending || !uploadFile}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-brand-700 transition disabled:opacity-50"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Publish Material</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview / Chunks Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white p-6 shadow-soft-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                {getFileIcon(previewDoc.fileType)}
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{previewDoc.title}</h3>
                  <p className="text-[11px] text-slate-400">
                    {previewDoc.fileName} • {formatFileSize(previewDoc.fileSize)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="font-semibold text-slate-700">Course:</span>{' '}
                  <span className="text-slate-600">
                    {previewDoc.course ? `${previewDoc.course.code} - ${previewDoc.course.title}` : 'General Site Material'}
                  </span>
                </div>
                <button
                  onClick={() => handleDownload(previewDoc)}
                  className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Original</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                  Semantic Content Preview ({previewChunks.length} chunks)
                </h4>

                {loadingChunks ? (
                  <div className="py-10 text-center">
                    <LoadingSpinner />
                  </div>
                ) : previewChunks.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {previewChunks.map((chunk, idx) => (
                      <div
                        key={chunk.id || idx}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap"
                      >
                        {chunk.content}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No chunk content available. Download the file above to view full contents.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setPreviewDoc(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourcesPage;
