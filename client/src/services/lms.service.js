import api from './api';

export const lmsService = {
  // Announcements
  getAnnouncements: async (params) => {
    return api.get('/announcements', { params });
  },

  createAnnouncement: async (data) => {
    return api.post('/announcements', data);
  },

  deleteAnnouncement: async (id) => {
    return api.delete(`/announcements/${id}`);
  },

  // Discussions
  getDiscussions: async (params) => {
    return api.get('/discussions', { params });
  },

  getDiscussionById: async (id) => {
    return api.get(`/discussions/${id}`);
  },

  createDiscussion: async (data) => {
    return api.post('/discussions', data);
  },

  replyToDiscussion: async (id, data) => {
    return api.post(`/discussions/${id}/replies`, data);
  },

  togglePinDiscussion: async (id) => {
    return api.patch(`/discussions/${id}/pin`);
  },

  deleteDiscussion: async (id) => {
    return api.delete(`/discussions/${id}`);
  },

  deleteDiscussionReply: async (discussionId, replyId) => {
    return api.delete(`/discussions/${discussionId}/replies/${replyId}`);
  },

  // Notifications
  getNotifications: async (params) => {
    return api.get('/notifications', { params });
  },

  markNotificationAsRead: async (id) => {
    return api.patch(`/notifications/${id}/read`);
  },

  markAllNotificationsAsRead: async () => {
    return api.patch('/notifications/read-all');
  },

  deleteNotification: async (id) => {
    return api.delete(`/notifications/${id}`);
  },

  // Calendar
  getCalendarEvents: async (params) => {
    return api.get('/calendar/events', { params });
  },

  // Analytics
  getInstructorAnalytics: async (params) => {
    return api.get('/analytics/instructor', { params });
  },

  getAdminAnalytics: async () => {
    return api.get('/analytics/admin');
  },
};

export default lmsService;
