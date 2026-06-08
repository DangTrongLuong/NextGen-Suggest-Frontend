import api from './api';

export const adminService = {
  // ── Dashboard ────────────────────────────────────────
  getDashboard: async () => {
    const res = await api.get('/admin/dashboard');
    return res.data.data;
  },

  getDashboardStats: async () => {
    const res = await api.get('/admin/dashboard/stats');
    return res.data.data;
  },

  getDashboardRevenueChart: async () => {
    const res = await api.get('/admin/dashboard/revenue-chart');
    return res.data.data || [];
  },

  getDashboardTopProducts: async () => {
    const res = await api.get('/admin/dashboard/top-products');
    return res.data.data || [];
  },

  getDashboardCategoryStats: async () => {
    const res = await api.get('/admin/dashboard/category-stats');
    return res.data.data || [];
  },

  // ── Products (admin) ─────────────────────────────────
  getProducts: async (params = {}) => {
    const res = await api.get('/admin/products', { params });
    return res.data.data;
  },

  getProductById: async (id) => {
    const res = await api.get(`/admin/products/${id}`);
    return res.data.data;
  },

  createProduct: async (data) => {
    const res = await api.post('/admin/products', data);
    return res.data.data;
  },

  updateProduct: async (id, data) => {
    const res = await api.put(`/admin/products/${id}`, data);
    return res.data.data;
  },

  deleteProduct: async (id) => {
    await api.delete(`/admin/products/${id}`);
  },

  // ── Orders ────────────────────────────────────────────
  getOrders: async (params = {}) => {
    const res = await api.get('/admin/orders', { params });
    return res.data.data;
  },

  getOrderById: async (id) => {
    const res = await api.get(`/admin/orders/${id}`);
    return res.data.data;
  },

  updateOrderStatus: async (id, status) => {
    const res = await api.put(`/admin/orders/${id}/status`, null, { params: { status } });
    return res.data.data;
  },

  // ── Users ─────────────────────────────────────────────
  getUsers: async (params = {}) => {
    const res = await api.get('/admin/users', { params });
    return res.data.data;
  },

  getUserById: async (id) => {
    const res = await api.get(`/admin/users/${id}`);
    return res.data.data;
  },

  setUserActive: async (id, active) => {
    const res = await api.put(`/admin/users/${id}/active`, null, { params: { active } });
    return res.data.data;
  },
};
