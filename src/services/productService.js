import api from './api';

export const productService = {
  getAll: async (params = {}) => {
    const res = await api.get('/products', { params });
    return res.data.data;
  },

  getById: async (id) => {
    const res = await api.get(`/products/${id}`);
    return res.data.data;
  },

  getBySlug: async (slug) => {
    const res = await api.get(`/products/slug/${slug}`);
    return res.data.data;
  },

  getFeatured: async () => {
    const res = await api.get('/products/featured');
    return res.data.data || [];
  },

  getBestSellers: async () => {
    const res = await api.get('/products/best-sellers');
    return res.data.data || [];
  },

  getNewArrivals: async () => {
    const res = await api.get('/products/new-arrivals');
    return res.data.data || [];
  },

  getRelated: async (productId, limit = 4) => {
    const res = await api.get(`/products/${productId}/related`, { params: { limit } });
    return res.data.data || [];
  },

  search: async (query, rerank = true, topK = 10) => {
    const res = await api.get('/products/search', {
      params: { q: query, rerank, top_k: topK },
    });
    return res.data.data || [];
  },

  searchPaginated: async (query, params = {}) => {
    const res = await api.get('/products/search/paginated', {
      params: { q: query, ...params },
    });
    return res.data.data;
  },

  // Admin
  create: async (data) => {
    const res = await api.post('/admin/products', data);
    return res.data.data;
  },

  update: async (id, data) => {
    const res = await api.put(`/admin/products/${id}`, data);
    return res.data.data;
  },

  delete: async (id) => {
    await api.delete(`/admin/products/${id}`);
  },
};
