import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Store, Bell, Shield, Palette } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { APP_NAME } from '../../utils/constants';

const SettingsSection = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
        <Icon size={16} className="text-slate-900" />
      </div>
      <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">{title}</h3>
    </div>
    {children}
  </div>
);

const Toggle = ({ label, description, defaultChecked = false }) => {
  const [on, setOn] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0 text-xs">
      <div>
        <p className="font-bold text-slate-900">{label}</p>
        {description && <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{description}</p>}
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${on ? 'bg-slate-900' : 'bg-slate-200'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${on ? 'translate-x-4' : ''}`} />
      </button>
    </div>
  );
};

const Settings = () => {
  const [store, setStore] = useState({
    name: APP_NAME,
    email: 'support@nivora.vn',
    phone: '+84 (0) 900 000 000',
    address: 'Hà Nội, Việt Nam',
    currency: 'VND',
    taxRate: '10',
  });

  const handleSave = () => {
    toast.success('Đã lưu cấu hình cửa hàng');
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <SettingsSection icon={Store} title="Thông tin cửa hàng">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Tên cửa hàng" value={store.name} onChange={(e) => setStore((p) => ({ ...p, name: e.target.value }))} />
          <Input label="Email hỗ trợ" type="email" value={store.email} onChange={(e) => setStore((p) => ({ ...p, email: e.target.value }))} />
          <Input label="Số điện thoại" value={store.phone} onChange={(e) => setStore((p) => ({ ...p, phone: e.target.value }))} />
          <Input label="Địa chỉ" value={store.address} onChange={(e) => setStore((p) => ({ ...p, address: e.target.value }))} />
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Tiền tệ</label>
            <select
              value={store.currency}
              onChange={(e) => setStore((p) => ({ ...p, currency: e.target.value }))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-slate-900 bg-white font-medium cursor-pointer"
            >
              <option value="VND">VND — Việt Nam Đồng</option>
              <option value="USD">USD — US Dollar</option>
            </select>
          </div>
          <Input label="Thuế VAT (%)" type="number" value={store.taxRate} onChange={(e) => setStore((p) => ({ ...p, taxRate: e.target.value }))} />
        </div>
        <div className="mt-4">
          <Button size="sm" onClick={handleSave}><Save size={14} /> Lưu thay đổi</Button>
        </div>
      </SettingsSection>

      <SettingsSection icon={Bell} title="Thông báo hệ thống">
        <Toggle label="Thông báo đơn hàng mới" description="Nhận thông báo khi có đơn hàng vừa tạo" defaultChecked />
        <Toggle label="Cảnh báo tồn kho thấp" description="Thông báo khi sản phẩm còn dưới 10 món" defaultChecked />
        <Toggle label="Đánh giá từ khách hàng" description="Thông báo khi có đánh giá sản phẩm mới" />
        <Toggle label="Báo cáo tuần" description="Gửi tổng hợp doanh thu hàng tuần qua email" defaultChecked />
      </SettingsSection>

      <SettingsSection icon={Shield} title="Bảo mật & Quyền">
        <Toggle label="Xác thực 2 yếu tố (2FA)" description="Tăng cường bảo mật đăng nhập Admin" />
        <Toggle label="Cảnh báo đăng nhập mới" description="Email thông báo khi đăng nhập từ thiết bị lạ" defaultChecked />
        <Toggle label="Tự động đăng xuất" description="Tự đăng xuất sau 30 phút không hoạt động" defaultChecked />
      </SettingsSection>
    </div>
  );
};

export default Settings;
