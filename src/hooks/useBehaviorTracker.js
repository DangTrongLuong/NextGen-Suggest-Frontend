import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { eventService } from '../services/eventService';

export const useBehaviorTracker = () => {
  const location = useLocation();

  // Tự động track page_view khi route thay đổi
  useEffect(() => {
    const pageName = location.pathname;
    // Bỏ qua các sự kiện track trang admin hoặc api
    if (!pageName.startsWith('/admin') && !pageName.startsWith('/api')) {
      eventService.track('page_view', null, pageName);
    }
  }, [location.pathname]);

  const trackProductView = (productId) => {
    if (productId) eventService.track('product_view', productId);
  };

  const trackSearch = (queryText) => {
    if (queryText) eventService.track('search', null, queryText);
  };

  const trackAddToCart = (productId) => {
    if (productId) eventService.track('add_to_cart', productId);
  };

  const trackRemoveFromCart = (productId) => {
    if (productId) eventService.track('remove_cart', productId);
  };

  const trackWishlist = (productId) => {
    if (productId) eventService.track('wishlist', productId);
  };

  const trackPurchase = (productId) => {
    if (productId) eventService.track('purchase', productId);
  };

  return {
    trackProductView,
    trackSearch,
    trackAddToCart,
    trackRemoveFromCart,
    trackWishlist,
    trackPurchase,
  };
};
