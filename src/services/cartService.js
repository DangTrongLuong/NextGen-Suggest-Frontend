import api from './api';

export const cartService = {
  getCart: async () => {
    const res = await api.get('/cart');
    return res.data.data;
  },

  addItem: async (variantId, quantity) => {
    const res = await api.post('/cart/items', { variantId, quantity });
    return res.data.data;
  },

  updateItem: async (variantId, quantity) => {
    const res = await api.put(`/cart/items/${variantId}`, null, { params: { quantity } });
    return res.data.data;
  },

  removeItem: async (variantId) => {
    const res = await api.delete(`/cart/items/${variantId}`);
    return res.data.data;
  },

  clearCart: async () => {
    await api.delete('/cart');
  },
};
