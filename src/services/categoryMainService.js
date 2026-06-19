import api from './api';

export const categoryMainService = {
  // Public
  getAll: async () => {
    const res = await api.get('/category-mains');
    return res.data.data || [];
  },

  getById: async (id) => {
    const res = await api.get(`/category-mains/${id}`);
    return res.data.data;
  },

  // Admin
  getAllAdmin: async () => {
    const res = await api.get('/admin/category-mains');
    return res.data.data || [];
  },

  getByIdAdmin: async (id) => {
    const res = await api.get(`/admin/category-mains/${id}`);
    return res.data.data;
  },

  create: async (data) => {
    const res = await api.post('/admin/category-mains', data);
    return res.data.data;
  },

  update: async (id, data) => {
    const res = await api.put(`/admin/category-mains/${id}`, data);
    return res.data.data;
  },

  delete: async (id) => {
    await api.delete(`/admin/category-mains/${id}`);
  },
};
