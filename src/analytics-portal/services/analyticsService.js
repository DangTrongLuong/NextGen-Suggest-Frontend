import api from './api';

export const analyticsService = {
  getOverview: async (timeRange = '24h') => {
    return api.get('/analytics/search/overview', {
      params: { time_range: timeRange }
    });
  },

  getHistory: async (params = {}) => {
    return api.get('/analytics/search/history', { params });
  },

  getDetail: async (logId) => {
    return api.get(`/analytics/search/detail/${logId}`);
  },

  getTopKeywords: async (timeRange = '24h', limit = 15) => {
    return api.get('/analytics/search/top-keywords', {
      params: { time_range: timeRange, limit }
    });
  },

  getTopProducts: async (timeRange = '24h', limit = 15) => {
    return api.get('/analytics/search/top-products', {
      params: { time_range: timeRange, limit }
    });
  },

  getSystemStatus: async () => {
    return api.get('/analytics/system-status');
  },

  getAuditLogs: async (page = 0, size = 20) => {
    return api.get('/analytics/audit-logs', {
      params: { page, size }
    });
  },

  trackClick: async (requestId, productId, productName) => {
    return api.post('/analytics/search/click', {
      request_id: requestId,
      product_id: productId,
      product_name: productName
    });
  }
};
