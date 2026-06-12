import api from './api';

export const authService = {
  register: async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data.data;
  },

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data.data;
  },

  logout: async (refreshToken) => {
    await api.post('/auth/logout', { refreshToken });
  },

  refresh: async (refreshToken) => {
    const res = await api.post('/auth/refresh', { refreshToken });
    return res.data.data;
  },

  getMe: async () => {
    const res = await api.get('/users/me');
    return res.data.data;
  },

  updateProfile: async (profileData) => {
    const res = await api.put('/users/me', profileData);
    return res.data.data;
  },
};
