import api from './api';

export const courseService = {
  // Course Catalog & Details
  getCourses: async (params = {}) => {
    const response = await api.get('/courses', { params });
    // Interceptor returns response.data = { success, message, data: { courses, pagination } }
    return response.data;
  },

  getCourseById: async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  createCourse: async (data) => {
    const response = await api.post('/courses', data);
    return response.data;
  },

  updateCourse: async (id, data) => {
    const response = await api.patch(`/courses/${id}`, data);
    return response.data;
  },

  deleteCourse: async (id) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },

  // Enrollments
  getMyEnrollments: async () => {
    const response = await api.get('/enrollments/my');
    return response.data;
  },

  enrollInCourse: async (courseId) => {
    const response = await api.post(`/enrollments/${courseId}`);
    return response.data;
  },

  dropCourse: async (courseId) => {
    const response = await api.delete(`/enrollments/${courseId}`);
    return response.data;
  },

  getCourseRoster: async (courseId) => {
    const response = await api.get(`/enrollments/course/${courseId}`);
    return response.data;
  },

  // Modules
  createModule: async (courseId, data) => {
    const response = await api.post(`/modules/course/${courseId}`, data);
    return response.data;
  },

  updateModule: async (id, data) => {
    const response = await api.patch(`/modules/${id}`, data);
    return response.data;
  },

  deleteModule: async (id) => {
    const response = await api.delete(`/modules/${id}`);
    return response.data;
  },

  // Lessons
  createLesson: async (moduleId, data) => {
    const response = await api.post(`/lessons/module/${moduleId}`, data);
    return response.data;
  },

  getLessonById: async (id) => {
    const response = await api.get(`/lessons/${id}`);
    return response.data;
  },

  updateLesson: async (id, data) => {
    const response = await api.patch(`/lessons/${id}`, data);
    return response.data;
  },

  deleteLesson: async (id) => {
    const response = await api.delete(`/lessons/${id}`);
    return response.data;
  },
};

