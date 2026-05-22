import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

// ── Helpers ──────────────────────────────────────────────
const saveTokens = (accessToken, refreshToken) => {
  localStorage.setItem('auth_tokens', JSON.stringify({ accessToken, refreshToken }));
};

const clearTokens = () => {
  localStorage.removeItem('auth_tokens');
  localStorage.removeItem('user');
};

const getStoredUser = () => {
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

// ── Provider ──────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(false);

  // On mount: if we have tokens but no user, fetch /users/me
  useEffect(() => {
    const tokens = localStorage.getItem('auth_tokens');
    if (tokens && !user) {
      authService.getMe()
        .then((me) => {
          setUser(me);
          localStorage.setItem('user', JSON.stringify(me));
        })
        .catch(() => {
          clearTokens();
          setUser(null);
        });
    }
  }, []);

  // ── Login ──────────────────────────────────────────────
  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      saveTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success(`Chào mừng trở lại, ${data.user.name}!`);
      window.dispatchEvent(new Event('auth-change'));
      return { success: true, user: data.user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Email hoặc mật khẩu không đúng';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // ── Register ───────────────────────────────────────────
  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const data = await authService.register(name, email, password);
      saveTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success(`Chào mừng, ${data.user.name}!`);
      window.dispatchEvent(new Event('auth-change'));
      return { success: true, user: data.user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Đăng ký thất bại';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // ── Google Login ───────────────────────────────────────
  const loginWithGoogle = () => {
    // Redirect to Spring Security OAuth2 endpoint
    window.location.href = `${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}/oauth2/authorization/google`;
  };

  // ── Handle OAuth2 Callback (called from OAuth2Callback page) ──
  const handleOAuth2Login = async (accessToken, refreshToken, userBase64) => {
    saveTokens(accessToken, refreshToken);

    let userData;
    if (userBase64) {
      // Decode user info từ Base64 JSON — không cần gọi thêm API
      try {
        const json = atob(userBase64.replace(/-/g, '+').replace(/_/g, '/'));
        userData = JSON.parse(json);
      } catch {
        // fallback: gọi API nếu decode thất bại
        userData = await authService.getMe();
      }
    } else {
      userData = await authService.getMe();
    }

    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    toast.success(`Chào mừng, ${userData.name}!`);
    window.dispatchEvent(new Event('auth-change'));
    return userData;
  };

  // ── Logout ─────────────────────────────────────────────
  const logout = async () => {
    try {
      const tokens = localStorage.getItem('auth_tokens');
      if (tokens) {
        const { refreshToken } = JSON.parse(tokens);
        await authService.logout(refreshToken).catch(() => {});
      }
    } finally {
      clearTokens();
      setUser(null);
      toast.success('Đã đăng xuất');
      window.dispatchEvent(new Event('auth-change'));
    }
  };

  const isAdmin = user?.role === 'admin' || user?.roles?.includes('admin');
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, loginWithGoogle, handleOAuth2Login, isAdmin, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
