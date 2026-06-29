import api from './api';

export const eventService = {
  track: async (eventType, productId = null, queryText = null) => {
    try {
      let sessionId = localStorage.getItem('nivora_session_id');
      if (!sessionId) {
        sessionId = 'session_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
        localStorage.setItem('nivora_session_id', sessionId);
      }

      const payload = {
        sessionId,
        eventType,
        productId: productId ? parseInt(productId, 10) : null,
        queryText,
      };

      // Duy trì danh sách 10 sản phẩm xem gần nhất của Guest trong localStorage
      if (eventType === 'product_view' && productId) {
        let viewed = [];
        try {
          const stored = localStorage.getItem('nivora_guest_viewed_ids');
          if (stored) viewed = JSON.parse(stored);
        } catch (e) {}
        viewed = [parseInt(productId, 10), ...viewed.filter(id => parseInt(id, 10) !== parseInt(productId, 10))].slice(0, 10);
        localStorage.setItem('nivora_guest_viewed_ids', JSON.stringify(viewed));
      }

      await api.post('/events', payload);
    } catch (error) {
      console.error('Error tracking behavior event:', error);
    }
  },
  trackEvent: async ({ eventType, productId = null, queryText = null }) => {
    return eventService.track(eventType, productId, queryText);
  },
};
