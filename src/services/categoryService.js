import api from './api';

export const categoryService = {
  // Public
  getAll: async () => {
    const res = await api.get('/categories');
    return res.data.data || [];
  },

  getPaginated: async (params = {}) => {
    const res = await api.get('/categories', { params });
    return res.data.data;
  },

  getTree: async () => {
    const res = await api.get('/categories/tree');
    return res.data.data || [];
  },

  getBreadcrumb: async (slug) => {
    const res = await api.get(`/categories/${slug}/breadcrumb`);
    return res.data.data || [];
  },

  getById: async (id) => {
    const res = await api.get(`/categories/${id}`);
    return res.data.data;
  },

  // Admin
  getAllAdmin: async () => {
    const res = await api.get('/admin/categories');
    return res.data.data || [];
  },

  getByIdAdmin: async (id) => {
    const res = await api.get(`/admin/categories/${id}`);
    return res.data.data;
  },

  create: async (data) => {
    const res = await api.post('/admin/categories', data);
    return res.data.data;
  },

  update: async (id, data) => {
    const res = await api.put(`/admin/categories/${id}`, data);
    return res.data.data;
  },

  delete: async (id) => {
    await api.delete(`/admin/categories/${id}`);
  },

  previewCategoryExcel: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/admin/import/categories/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },

  confirmCategoryImport: async (jobId, rows) => {
    const res = await api.post('/admin/import/categories/confirm', { jobId, rows });
    return res.data.data;
  },
};
