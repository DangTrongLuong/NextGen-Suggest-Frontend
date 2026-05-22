import api from './api';

export const orderService = {
  checkout: async (checkoutData) => {
    const res = await api.post('/orders/checkout', checkoutData);
    return res.data.data;
  },

  getMyOrders: async (page = 0, size = 10) => {
    const res = await api.get('/orders', { params: { page, size } });
    return res.data.data;
  },

  getById: async (id) => {
    const res = await api.get(`/orders/${id}`);
    return res.data.data;
  },

  getByNumber: async (orderNumber) => {
    const res = await api.get(`/orders/number/${orderNumber}`);
    return res.data.data;
  },

  cancel: async (id, reason = 'Cancelled by customer') => {
    const res = await api.post(`/orders/${id}/cancel`, null, { params: { reason } });
    return res.data.data;
  },
};
