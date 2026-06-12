import api from './api';

export const recommendationService = {
  getHomepageRecommendations: async () => {
    try {
      let sessionId = localStorage.getItem('nivora_session_id');
      if (!sessionId) {
        sessionId = 'session_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
        localStorage.setItem('nivora_session_id', sessionId);
      }

      let guestViewedIds = [];
      try {
        const stored = localStorage.getItem('nivora_guest_viewed_ids');
        if (stored) {
          guestViewedIds = JSON.parse(stored);
        }
      } catch (e) {
        console.error('Failed to parse guest viewed IDs', e);
      }

      const params = {
        sessionId,
      };

      if (guestViewedIds.length > 0) {
        params.guestViewedIds = guestViewedIds.join(',');
      }

      const res = await api.get('/recommendations/homepage', { params });
      return res.data.data;
    } catch (error) {
      console.error('Failed to fetch homepage recommendations:', error);
      return null;
    }
  },

  getRecommendationsByLocation: async (location, limit = 8) => {
    try {
      const res = await api.get('/recommendations/location', {
        params: { location, limit }
      });
      return res.data.data;
    } catch (error) {
      console.error(`Failed to fetch recommendations for location ${location}:`, error);
      return [];
    }
  },
};
