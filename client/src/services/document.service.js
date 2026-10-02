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
};

export default documentService;
