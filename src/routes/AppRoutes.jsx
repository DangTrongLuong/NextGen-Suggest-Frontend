import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import UserLayout from '../layouts/UserLayout';
import AdminLayout from '../layouts/AdminLayout';

// User Pages
import Home from '../pages/user/Home';
import Products from '../pages/user/Products';
import ProductDetail from '../pages/user/ProductDetail';
import Cart from '../pages/user/Cart';
import Checkout from '../pages/user/Checkout';
import Wishlist from '../pages/user/Wishlist';
import Profile from '../pages/user/Profile';
import OrderTracking from '../pages/user/OrderTracking';
import Login from '../pages/user/Login';
import Register from '../pages/user/Register';
import OAuth2Callback from '../pages/user/OAuth2Callback';

// Admin Pages
import Dashboard from '../pages/admin/Dashboard';
import ProductManagement from '../pages/admin/ProductManagement';
import AddProduct from '../pages/admin/AddProduct';
import EditProduct from '../pages/admin/EditProduct';
import OrderManagement from '../pages/admin/OrderManagement';
import CustomerManagement from '../pages/admin/CustomerManagement';
import CategoryManagement from '../pages/admin/CategoryManagement';
import AddCategory from '../pages/admin/AddCategory';
import EditCategory from '../pages/admin/EditCategory';
import Settings from '../pages/admin/Settings';
import ImportHistory from '../pages/admin/ImportHistory';
import ProtectedRoute from '../components/common/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* User Routes */}
      <Route element={<UserLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
        <Route path="/orders/:orderId" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
      </Route>

      {/* Auth Routes (no layout) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/oauth2/callback" element={<OAuth2Callback />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<ProductManagement />} />
        <Route path="products/add" element={<AddProduct />} />
        <Route path="products/edit/:id" element={<EditProduct />} />
        <Route path="categories" element={<CategoryManagement />} />
        <Route path="categories/add" element={<AddCategory />} />
        <Route path="categories/edit/:id" element={<EditCategory />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="customers" element={<CustomerManagement />} />
        <Route path="import-history" element={<ImportHistory />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
