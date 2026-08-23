import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

// ── Helpers ──────────────────────────────────────────────
const hashPassword = async (password) => {
  if (!password) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

const parseJwt = (token) => {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const saveTokens = (accessToken, refreshToken) => {
  localStorage.setItem('auth_tokens', JSON.stringify({ accessToken, refreshToken }));
};

const clearTokens = () => {
  localStorage.removeItem('auth_tokens');
  localStorage.removeItem('user');
  localStorage.removeItem('nivora_session_id');
  localStorage.removeItem('nivora_guest_viewed_ids');
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

  // Show toast notification for expired login/required actions saved in sessionStorage (e.g. after a page reload redirect)
  useEffect(() => {
    const expiredMsg = sessionStorage.getItem('auth_expired_msg');
    if (expiredMsg) {
      // Small timeout to ensure Toaster is initialized and ready
      const timer = setTimeout(() => {
        toast.error(expiredMsg);
      }, 100);
      sessionStorage.removeItem('auth_expired_msg');
      return () => clearTimeout(timer);
    }
  }, []);

  // ── Login ──────────────────────────────────────────────
  const login = async (email, password) => {
    setLoading(true);
    try {
      const hashedPassword = await hashPassword(password);
      const data = await authService.login(email, hashedPassword);
      saveTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success(`Chào mừng trở lại, ${data.user.name}!`);
      window.dispatchEvent(new Event('auth-change'));
      return { success: true, user: data.user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Email hoặc mật khẩu không đúng';
      if (msg === 'Account not verified') {
        toast.error('Tài khoản chưa được xác thực. Vui lòng kích hoạt.');
        return { success: false, error: 'NOT_VERIFIED', email };
      }
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
      const hashedPassword = await hashPassword(password);
      const data = await authService.register(name, email, hashedPassword);
      if (data.user && !data.user.isActive) {
        toast.success('Đăng ký thành công! Vui lòng kiểm tra email để lấy mã xác thực.');
        return { success: true, user: data.user };
      }
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
    window.location.href = '/oauth2/authorization/google';
  };

  // ── Handle OAuth2 Callback (called from OAuth2Callback page) ──
  const handleOAuth2Login = async (accessToken, refreshToken, userBase64) => {
    saveTokens(accessToken, refreshToken);

    let userData;
    if (userBase64) {
      // Decode user info từ Base64 JSON — không cần gọi thêm API
      try {
        const binaryString = atob(userBase64.replace(/-/g, '+').replace(/_/g, '/'));
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const json = new TextDecoder('utf-8').decode(bytes);
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

  // ── Verify ─────────────────────────────────────────────
  const verify = async (email, code) => {
    setLoading(true);
    try {
      const data = await authService.verify(email, code);
      saveTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success(`Chào mừng, ${data.user.name}!`);
      window.dispatchEvent(new Event('auth-change'));
      return { success: true, user: data.user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Xác thực thất bại';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // ── Resend Code ────────────────────────────────────────
  const resendCode = async (email) => {
    try {
      await authService.resendCode(email);
      toast.success('Mã xác thực mới đã được gửi!');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Gửi lại mã thất bại';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  // ── Update Profile ─────────────────────────────────────
  const updateProfile = async (profileData) => {
    setLoading(true);
    try {
      const updatedUser = await authService.updateProfile(profileData);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Cập nhật hồ sơ thành công!');
      return { success: true, user: updatedUser };
    } catch (err) {
      const msg = err.response?.data?.message || 'Cập nhật hồ sơ thất bại';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = !!user && isUserAdmin(user);
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, loginWithGoogle, handleOAuth2Login, isAdmin, isAuthenticated, updateProfile, verify, resendCode }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const isUserAdmin = (user, accessToken = null) => {
  if (user) {
    const roleStr = String(user.role || '').toLowerCase();
    if (roleStr === 'admin' || roleStr === 'role_admin') return true;

    if (Array.isArray(user.roles)) {
      const hasAdmin = user.roles.some((r) => {
        const itemStr = typeof r === 'string' ? r.toLowerCase() : String(r?.name || '').toLowerCase();
        return itemStr === 'admin' || itemStr === 'role_admin';
      });
      if (hasAdmin) return true;
    }
    if (user.roles && typeof user.roles[Symbol.iterator] === 'function') {
      for (const r of user.roles) {
        const itemStr = typeof r === 'string' ? r.toLowerCase() : String(r?.name || '').toLowerCase();
        if (itemStr === 'admin' || itemStr === 'role_admin') return true;
      }
    }
  }

  const token = accessToken || (() => {
    try {
      const tokensStr = localStorage.getItem('auth_tokens');
      return tokensStr ? JSON.parse(tokensStr)?.accessToken : null;
    } catch {
      return null;
    }
  })();

  if (token) {
    const claims = parseJwt(token);
    if (claims) {
      if (claims.exp && claims.exp * 1000 < Date.now()) {
        return false;
      }
      const roles = claims.roles || [];
      if (Array.isArray(roles)) {
        return roles.some((r) => {
          const itemStr = typeof r === 'string' ? r.toLowerCase() : String(r?.name || '').toLowerCase();
          return itemStr === 'admin' || itemStr === 'role_admin';
        });
      }
    }
  }

  return false;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

