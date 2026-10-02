import api from './api';

export const assessmentService = {
  // Assignments
  getAssignments: async (params = {}) => {
    const response = await api.get('/assignments', { params });
    return response.data;
  },

  getAssignmentById: async (id) => {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
  },

  createAssignment: async (data) => {
    const response = await api.post('/assignments', data);
    return response.data;
  },

  updateAssignment: async (id, data) => {
    const response = await api.patch(`/assignments/${id}`, data);
    return response.data;
  },

  submitAssignment: async (id, data) => {
    const response = await api.post(`/assignments/${id}/submit`, data);
    return response.data;
  },

  gradeSubmission: async (submissionId, data) => {
    const response = await api.patch(`/assignments/submissions/${submissionId}/grade`, data);
    return response.data;
  },

  // Quizzes
  getQuizzes: async (params = {}) => {
    const response = await api.get('/quizzes', { params });
    return response.data;
  },

  getQuizById: async (id) => {
    const response = await api.get(`/quizzes/${id}`);
    return response.data;
  },

  createQuiz: async (data) => {
    const response = await api.post('/quizzes', data);
    return response.data;
  },

  updateQuiz: async (id, data) => {
    const response = await api.patch(`/quizzes/${id}`, data);
    return response.data;
  },

  addQuestionToQuiz: async (quizId, data) => {
    const response = await api.post(`/quizzes/${quizId}/questions`, data);
    return response.data;
  },

  // Question Bank
  getQuestions: async (params = {}) => {
    const response = await api.get('/questions', { params });
    return response.data;
  },

  createQuestion: async (data) => {
    const response = await api.post('/questions', data);
    return response.data;
  },

  updateQuestion: async (id, data) => {
    const response = await api.patch(`/questions/${id}`, data);
    return response.data;
  },

  deleteQuestion: async (id) => {
    const response = await api.delete(`/questions/${id}`);
    return response.data;
  },

  // Quiz Attempts & Real-time Flow
  startQuizAttempt: async (quizId) => {
    const response = await api.post(`/attempts/quiz/${quizId}/start`);
    return response.data;
  },

  recordAnswer: async (attemptId, data) => {
    const response = await api.post(`/attempts/${attemptId}/answer`, data);
    return response.data;
  },

  submitQuizAttempt: async (attemptId) => {
    const response = await api.post(`/attempts/${attemptId}/submit`);
    return response.data;
  },

  getAttemptReview: async (attemptId) => {
    const response = await api.get(`/attempts/${attemptId}/review`);
    return response.data;
  },

  // Gradebook
  getStudentGradebook: async (studentId = null) => {
    const params = studentId ? { studentId } : {};
    const response = await api.get('/grades', { params });
    return response.data;
  },
};
