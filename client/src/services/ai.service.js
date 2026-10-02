import api from './api';

export const aiService = {
  // Phase 6: Chat & RAG
  sendMessage: async (data) => {
    return api.post('/ai/chat', data);
  },

  getConversations: async () => {
    return api.get('/ai/conversations');
  },

  getConversationById: async (id) => {
    return api.get(`/ai/conversations/${id}`);
  },

  deleteConversation: async (id) => {
    return api.delete(`/ai/conversations/${id}`);
  },

  searchMaterials: async (params) => {
    return api.get('/ai/search', { params });
  },

  // Phase 7: AI Learning Features
  generateQuestions: async (data) => {
    return api.post('/ai/generate-questions', data);
  },

  generateQuiz: async (data) => {
    return api.post('/ai/generate-quiz', data);
  },

  generateFlashcards: async (data) => {
    return api.post('/ai/generate-flashcards', data);
  },

  getTutorRecommendations: async (params) => {
    return api.get('/ai/tutor/recommendations', { params });
  },
};

export default aiService;
