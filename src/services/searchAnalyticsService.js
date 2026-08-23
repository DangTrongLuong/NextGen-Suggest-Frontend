import api from './api';

export const searchAnalyticsService = {
  trackClick: async ({ productId, productName, requestId, sessionId }) => {
    try {
      const activeSessionId = sessionId || localStorage.getItem('nivora_session_id');
      const payload = {
        product_id: String(productId || ''),
        product_name: productName || '',
        request_id: requestId || null,
        session_id: activeSessionId || null,
      };

      const jsonBody = JSON.stringify(payload);

      // Use fetch with keepalive: true so browser delivers click payload to FastAPI (/analytics/search/click)
      if (typeof window !== 'undefined' && window.fetch) {
        window.fetch('/analytics/search/click', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Id': activeSessionId || '',
          },
          body: jsonBody,
          keepalive: true,
        }).catch(() => {
          // Fallback to fetch without keepalive if needed
          window.fetch('/analytics/search/click', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Session-Id': activeSessionId || '',
            },
            body: jsonBody,
          }).catch(() => {});
        });
      }
    } catch (err) {
      console.warn('Click tracking notice:', err?.message);
    }
  },
};

export default searchAnalyticsService;
