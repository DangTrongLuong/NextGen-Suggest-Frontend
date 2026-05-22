import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Store, Bell, Shield, Palette } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { APP_NAME } from '../../utils/constants';

const SettingsSection = ({ icon: Icon, title, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
  >
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
        <Icon size={18} className="text-emerald-600" />
      </div>
      <h3 className="font-bold text-gray-900">{title}</h3>
    </div>
    {children}
  </motion.div>
);

const Toggle = ({ label, description, defaultChecked = false }) => {
  const [on, setOn] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`relative w-11 h-6 rounded-full transition-colors ${on ? 'bg-emerald-600' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
};

const Settings = () => {
  const [store, setStore] = useState({
    name: APP_NAME,
    email: 'support@luxeshop.com',
    phone: '+1 (555) 000-0000',
    address: '123 Commerce St, New York, NY',
    currency: 'USD',
    taxRate: '8',
  });

  const handleSave = () => {
    toast.success('Đã lưu (chỉ lưu cục bộ — backend Settings chưa được hỗ trợ)');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Store Info */}
      <SettingsSection icon={Store} title="Store Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Store Name" value={store.name} onChange={(e) => setStore((p) => ({ ...p, name: e.target.value }))} />
          <Input label="Support Email" type="email" value={store.email} onChange={(e) => setStore((p) => ({ ...p, email: e.target.value }))} />
          <Input label="Phone" value={store.phone} onChange={(e) => setStore((p) => ({ ...p, phone: e.target.value }))} />
          <Input label="Address" value={store.address} onChange={(e) => setStore((p) => ({ ...p, address: e.target.value }))} />
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Currency</label>
            <select
              value={store.currency}
              onChange={(e) => setStore((p) => ({ ...p, currency: e.target.value }))}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
            </select>
          </div>
          <Input label="Tax Rate (%)" type="number" value={store.taxRate} onChange={(e) => setStore((p) => ({ ...p, taxRate: e.target.value }))} />
        </div>
        <div className="mt-5">
          <Button onClick={handleSave}><Save size={15} /> Save Changes</Button>
        </div>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection icon={Bell} title="Notifications">
        <Toggle label="New Order Alerts" description="Get notified when a new order is placed" defaultChecked />
        <Toggle label="Low Stock Alerts" description="Alert when product stock falls below 10" defaultChecked />
        <Toggle label="Customer Reviews" description="Notify on new product reviews" />
        <Toggle label="Weekly Reports" description="Receive weekly sales summary" defaultChecked />
      </SettingsSection>

      {/* Security */}
      <SettingsSection icon={Shield} title="Security">
        <Toggle label="Two-Factor Authentication" description="Add an extra layer of security" />
        <Toggle label="Login Notifications" description="Email on new login from unknown device" defaultChecked />
        <Toggle label="Session Timeout" description="Auto logout after 30 minutes of inactivity" defaultChecked />
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection icon={Palette} title="Appearance">
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Primary Color</p>
          <div className="flex gap-3">
            {['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'].map((color) => (
              <button
                key={color}
                className="w-8 h-8 rounded-full border-2 border-white shadow-md ring-2 ring-transparent hover:ring-gray-300 transition-all"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </SettingsSection>
    </div>
  );
};

export default Settings;
