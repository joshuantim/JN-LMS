import api from './api';

export const documentService = {
  uploadDocument: async (formData, onUploadProgress) => {
    return api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },

  getDocuments: async (params) => {
    return api.get('/documents', { params });
  },

  getDocumentById: async (id) => {
    return api.get(`/documents/${id}`);
  },

  getDocumentChunks: async (id) => {
    return api.get(`/documents/${id}/chunks`);
  },

  deleteDocument: async (id) => {
    return api.delete(`/documents/${id}`);
  },

  downloadDocument: async (id, fileName) => {
    const blob = await api.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName || 'resource-file');
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default documentService;
