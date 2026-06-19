import api from './api';

export const authService = {
  login: async (usernameOrEmail, password) => {
    return api.post('/analytics/auth/login', {
      username_or_email: usernameOrEmail,
      password: password
    });
  },

  logout: async () => {
    return api.post('/analytics/auth/logout');
  },

  getMe: async () => {
    return api.get('/analytics/auth/me');
  }
};
