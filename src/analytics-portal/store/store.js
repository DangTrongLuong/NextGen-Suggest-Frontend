import { create } from 'zustand';
import { authService } from '../services/authService';

const savedToken = localStorage.getItem('analytics_access_token') || null;

export const useAnalyticsStore = create((set, get) => ({
  accessToken: savedToken,
  user: null,
  loading: true,
  isConnected: false,
  alerts: [],
  systemStatus: null,

  setAccessToken: (token) => {
    if (token) {
      localStorage.setItem('analytics_access_token', token);
    } else {
      localStorage.removeItem('analytics_access_token');
    }
    set({ accessToken: token });
  },
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setConnected: (isConnected) => set({ isConnected }),
  setAlerts: (alerts) => set({ alerts }),
  setSystemStatus: (systemStatus) => set({ systemStatus }),

  addAlert: (alert) => set((state) => ({ 
    alerts: [alert, ...state.alerts].slice(0, 100)
  })),

  loginUser: async (usernameOrEmail, password) => {
    set({ loading: true });
    try {
      const res = await authService.login(usernameOrEmail, password);
      const token = res.data.access_token;
      
      get().setAccessToken(token);
      
      const meRes = await authService.getMe();
      set({ user: meRes.data, loading: false });
      return { success: true };
    } catch (err) {
      get().setAccessToken(null);
      set({ user: null, loading: false });
      return { success: false, error: err.message || 'Đăng nhập thất bại.' };
    }
  },

  logoutUser: async () => {
    set({ loading: true });
    try {
      await authService.logout().catch(() => {});
    } finally {
      get().setAccessToken(null);
      set({ user: null, isConnected: false, loading: false });
    }
  },

  initializeAuth: async () => {
    set({ loading: true });
    try {
      const res = await authService.getMe();
      set({ user: res.data, loading: false });
    } catch (err) {
      // If 401/expired, clear memory and local storage token
      get().setAccessToken(null);
      set({ user: null, loading: false });
    }
  }
}));
