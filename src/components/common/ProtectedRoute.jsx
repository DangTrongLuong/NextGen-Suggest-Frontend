import { Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      toast.error('Vui lòng đăng nhập để tiếp tục');
      window.dispatchEvent(new Event('open-login-modal'));
    }
    if (!loading && user && requireAdmin && !isAdmin) {
      toast.error('Bạn không có quyền truy cập trang này');
    }
  }, [loading, user, isAdmin, requireAdmin]);

  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;
  return children;
};

export default ProtectedRoute;
