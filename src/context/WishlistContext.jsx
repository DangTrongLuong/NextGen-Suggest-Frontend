import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);

  const isAuthenticated = () => !!localStorage.getItem('auth_tokens');

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated()) { setWishlist([]); return; }
    try {
      const res = await api.get('/wishlist');
      setWishlist(res.data.data || []);
    } catch (err) {
      if (err.response?.status !== 401) setWishlist([]);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  useEffect(() => {
    const handler = () => fetchWishlist();
    window.addEventListener('auth-change', handler);
    return () => window.removeEventListener('auth-change', handler);
  }, [fetchWishlist]);

  const addToWishlist = async (product) => {
    if (!isAuthenticated()) {
      toast.error('Vui lòng đăng nhập để lưu yêu thích');
      return;
    }
    try {
      await api.post(`/wishlist/${product.id}`);
      setWishlist((prev) => {
        if (prev.find((p) => p.id === product.id)) return prev;
        return [...prev, product];
      });
      toast.success('Đã thêm vào yêu thích!');
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg?.includes('already')) {
        toast('Sản phẩm đã có trong danh sách yêu thích');
      } else {
        toast.error('Không thể thêm vào yêu thích');
      }
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      await api.delete(`/wishlist/${productId}`);
      setWishlist((prev) => prev.filter((p) => p.id !== productId));
      toast.success('Đã xóa khỏi yêu thích');
    } catch {
      toast.error('Không thể xóa khỏi yêu thích');
    }
  };

  const toggleWishlist = async (product) => {
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product);
    }
  };

  const isInWishlist = (id) => wishlist.some((p) => p.id === id);

  return (
    <WishlistContext.Provider
      value={{ wishlist, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
