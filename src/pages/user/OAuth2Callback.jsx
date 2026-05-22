import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

/**
 * Nhận redirect từ backend sau Google OAuth2:
 * /oauth2/callback?token=...&refreshToken=...&user=<base64>
 *
 * Lưu token + user vào localStorage rồi full-reload về "/" để đảm bảo
 * tất cả context (Auth, Cart, Wishlist) khởi tạo lại với user đã đăng nhập.
 */
const OAuth2Callback = () => {
  const [searchParams] = useSearchParams();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token        = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const userBase64   = searchParams.get('user');
    const error        = searchParams.get('error');

    if (error || !token) {
      toast.error('Đăng nhập Google thất bại');
      window.location.replace('/login');
      return;
    }

    try {
      // Lưu tokens
      localStorage.setItem(
        'auth_tokens',
        JSON.stringify({ accessToken: token, refreshToken })
      );

      // Decode user info từ Base64 JSON
      if (userBase64) {
        const json = atob(userBase64.replace(/-/g, '+').replace(/_/g, '/'));
        const userData = JSON.parse(json);
        localStorage.setItem('user', JSON.stringify(userData));
      }

      // Full reload — buộc AuthProvider khởi tạo lại với user mới
      // Header sẽ tự render avatar
      window.location.replace('/');
    } catch (err) {
      console.error('OAuth2 callback error:', err);
      toast.error('Đăng nhập thất bại, vui lòng thử lại');
      window.location.replace('/login');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
};

export default OAuth2Callback;
