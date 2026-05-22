import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Package, Edit2, Save, X, ArrowRight, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import Breadcrumb from '../../components/layout/Breadcrumb';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Spinner } from '../../components/common/Loading';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { formatPrice } from '../../utils/formatPrice';

const STATUS_MAP = {
  pending:   { label: 'Chờ xác nhận', color: 'bg-gray-100 text-gray-700' },
  confirmed: { label: 'Đã xác nhận',  color: 'bg-blue-100 text-blue-700' },
  packing:   { label: 'Đóng gói',     color: 'bg-amber-100 text-amber-700' },
  shipping:  { label: 'Đang giao',    color: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Đã giao',      color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Đã hủy',       color: 'bg-red-100 text-red-700' },
};

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  if (!isAuthenticated) return <Navigate to="/" replace />;

  useEffect(() => {
    orderService.getMyOrders(0, 4)
      .then((data) => setOrders(data?.content || []))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));
  }, []);

  const totalSpent = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);

  const handleSave = () => {
    toast.success('Đã cập nhật thông tin!');
    setEditing(false);
  };

  const avatarUrl = user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6"><Breadcrumb items={[{ label: 'Tài khoản', to: '/profile' }]} /></div>
      <h1 className="text-2xl font-black text-gray-900 mb-8">Tài khoản của tôi</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <div className="relative inline-block mb-4">
              <img src={avatarUrl} alt={user.name} className="w-24 h-24 rounded-full bg-gray-100 mx-auto ring-4 ring-emerald-100" />
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-emerald-700 transition-colors">
                <Edit2 size={13} />
              </button>
            </div>
            <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-500 mb-2">{user.email}</p>
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full capitalize">
              {user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
            </span>
            <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-black text-gray-900">{orders.length}</p>
                <p className="text-xs text-gray-500">Đơn hàng</p>
              </div>
              <div>
                <p className="text-xl font-black text-gray-900">{formatPrice(totalSpent)}</p>
                <p className="text-xs text-gray-500">Đã chi tiêu</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-1">
            <Link to="/orders" className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center"><Truck size={15} className="text-emerald-600" /></div>
                <span className="text-sm font-medium text-gray-700">Theo dõi đơn hàng</span>
              </div>
              <ArrowRight size={15} className="text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
            </Link>
            <Link to="/wishlist" className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center"><Package size={15} className="text-red-500" /></div>
                <span className="text-sm font-medium text-gray-700">Danh sách yêu thích</span>
              </div>
              <ArrowRight size={15} className="text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Thông tin cá nhân</h3>
              {!editing ? (
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}><Edit2 size={14} /> Chỉnh sửa</Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave}><Save size={14} /> Lưu</Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X size={14} /></Button>
                </div>
              )}
            </div>
            {editing ? (
              <div className="space-y-4">
                <Input label="Họ và tên" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} icon={User} />
                <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} icon={Mail} />
                <Input label="Số điện thoại" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} icon={Phone} />
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { icon: User, label: 'Họ và tên', value: user.name },
                  { icon: Mail, label: 'Email', value: user.email },
                  { icon: Phone, label: 'Số điện thoại', value: user.phone || 'Chưa cập nhật' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0"><Icon size={16} className="text-gray-500" /></div>
                    <div>
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="text-sm font-medium text-gray-900">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-emerald-600" />
                <h3 className="font-bold text-gray-900">Đơn hàng gần đây</h3>
              </div>
              <Link to="/orders" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors">
                Xem tất cả <ArrowRight size={14} />
              </Link>
            </div>
            {loadingOrders ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : orders.length === 0 ? (
              <div className="text-center py-10">
                <Package size={36} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Chưa có đơn hàng nào</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.pending;
                  return (
                    <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">#{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('vi-VN')} · {(order.items || []).length} sản phẩm
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{formatPrice(order.totalAmount)}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
