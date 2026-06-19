import { create } from 'zustand';
import { authService } from '../services/authService';

export const useAnalyticsStore = create((set, get) => ({
  accessToken: null,
  user: null,
  loading: true,
  isConnected: false,
  alerts: [],
  systemStatus: null,

  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setConnected: (isConnected) => set({ isConnected }),
  setAlerts: (alerts) => set({ alerts }),
  setSystemStatus: (systemStatus) => set({ systemStatus }),

  addAlert: (alert) => set((state) => ({ 
    alerts: [alert, ...state.alerts].slice(0, 100) // Keep last 100 alerts
  })),

  loginUser: async (usernameOrEmail, password) => {
    set({ loading: true });
    try {
      const res = await authService.login(usernameOrEmail, password);
      const token = res.data.access_token;
      
      // Temporarily set access token to allow fetching profile info
      set({ accessToken: token });
      
      const meRes = await authService.getMe();
      set({ user: meRes.data, loading: false });
      return { success: true };
    } catch (err) {
      set({ accessToken: null, user: null, loading: false });
      return { success: false, error: err.message || 'Đăng nhập thất bại.' };
    }
  },

  logoutUser: async () => {
    set({ loading: true });
    try {
      await authService.logout().catch(() => {});
    } finally {
      set({ accessToken: null, user: null, isConnected: false, loading: false });
    }
  },

  initializeAuth: async () => {
    set({ loading: true });
    try {
      // Triggers silent refresh automatically if access token is empty
      // but refresh cookie exists because api.js intercepts 401
      const res = await authService.getMe();
      set({ user: res.data, loading: false });
    } catch (err) {
      set({ accessToken: null, user: null, loading: false });
    }
  }
}));
