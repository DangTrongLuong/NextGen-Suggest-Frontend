import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { cartService } from '../services/cartService';

const CartContext = createContext(null);

// Normalize backend cart item → frontend shape
const normalizeItem = (item) => ({
  id: item.variantId,
  productId: item.productId,
  cartItemId: item.id,
  name: item.productName,
  variantName: item.variantName,
  price: item.unitPrice,
  image: item.imageUrl,
  quantity: item.quantity,
  stock: item.availableStock,
  sku: item.sku,
});

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const isAuthenticated = () => !!localStorage.getItem('auth_tokens');

  // ── Fetch cart from API ────────────────────────────────
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated()) { setItems([]); return; }
    try {
      const data = await cartService.getCart();
      const normalized = (data?.items || []).map(normalizeItem);
      setItems(normalized);
      setCartTotal(data?.subtotal || 0);
    } catch (err) {
      if (err.response?.status !== 401) setItems([]);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Re-fetch when user logs in/out
  useEffect(() => {
    const handler = () => fetchCart();
    window.addEventListener('auth-change', handler);
    return () => window.removeEventListener('auth-change', handler);
  }, [fetchCart]);

  // ── Add to cart ────────────────────────────────────────
  const addToCart = async (product, quantity = 1, variantId = null) => {
    if (!isAuthenticated()) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }
    setLoading(true);
    try {
      // Use first variant id if not specified
      const vid = variantId || product.variants?.[0]?.id || product.id;
      const data = await cartService.addItem(vid, quantity);
      const normalized = (data?.items || []).map(normalizeItem);
      setItems(normalized);
      setCartTotal(data?.subtotal || 0);
      toast.success(`${product.name} đã thêm vào giỏ!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể thêm vào giỏ hàng');
    } finally {
      setLoading(false);
    }
  };

  // ── Remove from cart ───────────────────────────────────
  const removeFromCart = async (variantId) => {
    setLoading(true);
    try {
      const data = await cartService.removeItem(variantId);
      const normalized = (data?.items || []).map(normalizeItem);
      setItems(normalized);
      setCartTotal(data?.subtotal || 0);
      toast.success('Đã xóa khỏi giỏ hàng');
    } catch {
      toast.error('Không thể xóa sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  // ── Update quantity ────────────────────────────────────
  const updateQuantity = async (variantId, _color, quantity) => {
    setLoading(true);
    try {
      const data = await cartService.updateItem(variantId, quantity);
      const normalized = (data?.items || []).map(normalizeItem);
      setItems(normalized);
      setCartTotal(data?.subtotal || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật số lượng');
    } finally {
      setLoading(false);
    }
  };

  // ── Clear cart ─────────────────────────────────────────
  const clearCart = async () => {
    try {
      await cartService.clearCart();
      setItems([]);
      setCartTotal(0);
    } catch {
      setItems([]);
    }
  };

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const isInCart = (productId) => items.some((i) => i.productId === productId || i.id === productId);

  return (
    <CartContext.Provider
      value={{
        items,
        cartTotal,
        cartCount,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
        refetchCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
