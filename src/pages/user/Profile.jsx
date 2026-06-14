import { useState, useEffect, useRef } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Package, Edit2, Save, X, ArrowRight, Truck, Calendar, Briefcase, Coins, Heart, MapPin, Plus, Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import Breadcrumb from '../../components/layout/Breadcrumb';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Spinner } from '../../components/common/Loading';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { addressService } from '../../services/addressService';
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
  const { user, isAuthenticated, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    age: user?.age || '',
    gender: user?.gender || '',
    occupation: user?.occupation || '',
    income: user?.income || '',
    maritalStatus: user?.maritalStatus || '',
  });
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // User addresses tab states
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'addresses'
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Address levels
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('');

  // Mapbox loading states
  const [mapboxLoaded, setMapboxLoaded] = useState(false);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

  const [addressForm, setAddressForm] = useState({
    id: null,
    recipientName: '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    addressDetail: '',
    latitude: null,
    longitude: null,
    isDefault: false,
    label: 'Nhà riêng',
  });

  if (!isAuthenticated) return <Navigate to="/" replace />;

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        age: user.age || '',
        gender: user.gender || '',
        occupation: user.occupation || '',
        income: user.income || '',
        maritalStatus: user.maritalStatus || '',
      });
    }
  }, [user]);

  useEffect(() => {
    orderService.getMyOrders(0, 4)
      .then((data) => setOrders(data?.content || []))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));
  }, []);

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const data = await addressService.getAddresses();
      setAddresses(data || []);
    } catch (error) {
      console.error('Lỗi khi tải danh sách địa chỉ:', error);
      toast.error('Không thể tải danh sách địa chỉ');
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'addresses') {
      fetchAddresses();
    }
  }, [activeTab]);

  // Load provinces on opening form
  useEffect(() => {
    if (showAddressForm) {
      axios.get('https://provinces.open-api.vn/api/p/')
        .then(res => setProvinces(res.data))
        .catch(err => console.error('Lỗi tải danh sách tỉnh thành:', err));
    }
  }, [showAddressForm]);

  // Dynamic Mapbox scripts injection
  useEffect(() => {
    if (showAddressForm && MAPBOX_TOKEN) {
      const linkId = 'mapbox-gl-css';
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.1.0/mapbox-gl.css';
        document.head.appendChild(link);
      }

      const scriptId = 'mapbox-gl-js';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.1.0/mapbox-gl.js';
        script.onload = () => setMapboxLoaded(true);
        document.head.appendChild(script);
      } else {
        setMapboxLoaded(true);
      }
    }
  }, [showAddressForm]);

  // Init map preview
  useEffect(() => {
    if (showAddressForm && mapboxLoaded && mapContainerRef.current) {
      const lat = addressForm.latitude || 21.0285;
      const lng = addressForm.longitude || 105.8542;

      const mapboxgl = window.mapboxgl;
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [lng, lat],
        zoom: addressForm.latitude ? 15 : 6,
      });

      const marker = new mapboxgl.Marker({ draggable: true })
        .setLngLat([lng, lat])
        .addTo(map);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        setAddressForm(prev => ({ ...prev, latitude: lngLat.lat, longitude: lngLat.lng }));
      });

      mapRef.current = map;
      markerRef.current = marker;

      return () => {
        map.remove();
        mapRef.current = null;
        markerRef.current = null;
      };
    }
  }, [showAddressForm, mapboxLoaded]);

  const handleProvinceChange = async (e) => {
    const code = e.target.value;
    setSelectedProvinceCode(code);
    setSelectedDistrictCode('');
    setDistricts([]);
    setWards([]);

    const prov = provinces.find(p => String(p.code) === String(code));
    const name = prov ? prov.name : '';
    setAddressForm(prev => ({ ...prev, province: name, district: '', ward: '' }));

    if (code) {
      axios.get(`https://provinces.open-api.vn/api/p/${code}?depth=2`)
        .then(res => setDistricts(res.data.districts || []))
        .catch(err => console.error('Lỗi khi tải quận huyện:', err));
    }
  };

  const handleDistrictChange = async (e) => {
    const code = e.target.value;
    setSelectedDistrictCode(code);
    setWards([]);

    const dist = districts.find(d => String(d.code) === String(code));
    const name = dist ? dist.name : '';
    setAddressForm(prev => ({ ...prev, district: name, ward: '' }));

    if (code) {
      axios.get(`https://provinces.open-api.vn/api/d/${code}?depth=2`)
        .then(res => setWards(res.data.wards || []))
        .catch(err => console.error('Lỗi khi tải phường xã:', err));
    }
  };

  const handleWardChange = (e) => {
    const code = e.target.value;
    const wardObj = wards.find(w => String(w.code) === String(code));
    const name = wardObj ? wardObj.name : '';
    setAddressForm(prev => ({ ...prev, ward: name }));
  };

  const triggerGeocoding = async () => {
    const { addressDetail, ward, district, province } = addressForm;
    if (!addressDetail || !ward || !district || !province || !MAPBOX_TOKEN) return;

    const query = `${addressDetail}, ${ward}, ${district}, ${province}, Việt Nam`;
    try {
      const res = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
      );
      if (res.data?.features?.length > 0) {
        const [lng, lat] = res.data.features[0].geometry.coordinates;
        setAddressForm(prev => ({ ...prev, latitude: lat, longitude: lng }));
        if (mapRef.current && markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
          mapRef.current.flyTo({ center: [lng, lat], zoom: 15 });
        }
      }
    } catch (e) {
      console.error('Lỗi định vị Mapbox geocoding:', e);
    }
  };

  const handleAddressBlur = () => {
    triggerGeocoding();
  };

  const handleEditClick = async (address) => {
    setAddressForm({
      id: address.id,
      recipientName: address.recipientName,
      phone: address.phone,
      province: address.province,
      district: address.district,
      ward: address.ward,
      addressDetail: address.addressDetail,
      latitude: address.latitude,
      longitude: address.longitude,
      isDefault: address.isDefault,
      label: address.label || 'Nhà riêng',
    });

    try {
      let provs = provinces;
      if (provs.length === 0) {
        const provRes = await axios.get('https://provinces.open-api.vn/api/p/');
        provs = provRes.data;
        setProvinces(provs);
      }

      const matchedProv = provs.find(p => p.name.toLowerCase() === address.province.toLowerCase());
      if (matchedProv) {
        setSelectedProvinceCode(matchedProv.code);
        const distRes = await axios.get(`https://provinces.open-api.vn/api/p/${matchedProv.code}?depth=2`);
        const distList = distRes.data.districts || [];
        setDistricts(distList);

        const matchedDist = distList.find(d => d.name.toLowerCase() === address.district.toLowerCase());
        if (matchedDist) {
          setSelectedDistrictCode(matchedDist.code);
          const wardRes = await axios.get(`https://provinces.open-api.vn/api/d/${matchedDist.code}?depth=2`);
          setWards(wardRes.data.wards || []);
        } else {
          setSelectedDistrictCode('');
          setWards([]);
        }
      } else {
        setSelectedProvinceCode('');
        setSelectedDistrictCode('');
        setDistricts([]);
        setWards([]);
      }
    } catch (e) {
      console.error('Lỗi nạp danh mục cho form sửa:', e);
    }

    setShowAddressForm(true);
  };

  const validateAddressForm = () => {
    if (!addressForm.recipientName.trim()) {
      toast.error('Họ tên người nhận không được trống');
      return false;
    }
    if (!addressForm.phone.trim()) {
      toast.error('Số điện thoại không được trống');
      return false;
    }
    if (!addressForm.province) {
      toast.error('Vui lòng chọn Tỉnh/Thành phố');
      return false;
    }
    if (!addressForm.district) {
      toast.error('Vui lòng chọn Quận/Huyện');
      return false;
    }
    if (!addressForm.ward) {
      toast.error('Vui lòng chọn Phường/Xã');
      return false;
    }
    if (!addressForm.addressDetail.trim()) {
      toast.error('Địa chỉ chi tiết không được trống');
      return false;
    }
    return true;
  };

  const handleSubmitAddress = async () => {
    if (!validateAddressForm()) return;

    try {
      const payload = {
        recipientName: addressForm.recipientName,
        phone: addressForm.phone,
        province: addressForm.province,
        district: addressForm.district,
        ward: addressForm.ward,
        addressDetail: addressForm.addressDetail,
        latitude: addressForm.latitude,
        longitude: addressForm.longitude,
        isDefault: addressForm.isDefault,
        label: addressForm.label,
      };

      if (addressForm.id) {
        await addressService.updateAddress(addressForm.id, payload);
        toast.success('Cập nhật địa chỉ thành công');
      } else {
        await addressService.createAddress(payload);
        toast.success('Thêm địa chỉ mới thành công');
      }

      setShowAddressForm(false);
      fetchAddresses();
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi xảy ra khi lưu địa chỉ');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
    try {
      await addressService.deleteAddress(id);
      toast.success('Xóa địa chỉ thành công');
      fetchAddresses();
    } catch (e) {
      console.error(e);
      toast.error('Không thể xóa địa chỉ');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await addressService.setDefaultAddress(id);
      toast.success('Đặt địa chỉ mặc định thành công');
      fetchAddresses();
    } catch (e) {
      console.error(e);
      toast.error('Không thể đặt địa chỉ mặc định');
    }
  };

  const totalSpent = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);

  const handleSave = async () => {
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        age: form.age ? parseInt(form.age, 10) : null,
        gender: form.gender || null,
        occupation: form.occupation || null,
        income: form.income ? parseFloat(form.income) : null,
        maritalStatus: form.maritalStatus || null,
      };
      
      const res = await updateProfile(payload);
      if (res.success) {
        setEditing(false);
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi lưu thông tin');
    }
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
          {/* Tab Selector */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 flex gap-2">
            <button
              onClick={() => { setActiveTab('profile'); setShowAddressForm(false); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
                activeTab === 'profile'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Thông tin cá nhân
            </button>
            <button
              onClick={() => { setActiveTab('addresses'); setShowAddressForm(false); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
                activeTab === 'addresses'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Địa chỉ giao hàng
            </button>
          </div>

          {activeTab === 'profile' ? (
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
                <div className="space-y-6">
                  <div className="border-b border-gray-100 pb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Thông tin liên hệ</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input label="Họ và tên" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} icon={User} />
                      <Input label="Số điện thoại" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} icon={Phone} />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-emerald-700 mb-1 flex items-center gap-1.5">
                      <span>Hồ sơ cá nhân hóa gợi ý AI</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">KHUYÊN DÙNG</span>
                    </h4>
                    <p className="text-xs text-gray-500 mb-4">
                      Cung cấp các thông tin dưới đây để giúp hệ thống gợi ý AI giới thiệu sản phẩm tối ưu nhất cho nhu cầu của bạn.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input label="Độ tuổi" type="number" value={form.age} onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))} icon={Calendar} />
                      
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Giới tính</label>
                        <select
                          className="w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 border-gray-200 hover:border-gray-300"
                          value={form.gender}
                          onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                        >
                          <option value="">Chọn giới tính</option>
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>

                      <Input label="Nghề nghiệp" value={form.occupation} onChange={(e) => setForm((p) => ({ ...p, occupation: e.target.value }))} icon={Briefcase} />
                      <Input label="Thu nhập hàng tháng (VND)" type="number" value={form.income} onChange={(e) => setForm((p) => ({ ...p, income: e.target.value }))} icon={Coins} />

                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Tình trạng hôn nhân</label>
                        <select
                          className="w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 border-gray-200 hover:border-gray-300"
                          value={form.maritalStatus}
                          onChange={(e) => setForm((p) => ({ ...p, maritalStatus: e.target.value }))}
                        >
                          <option value="">Chọn tình trạng hôn nhân</option>
                          <option value="Độc thân">Độc thân</option>
                          <option value="Đã kết hôn">Đã kết hôn</option>
                          <option value="Đã ly hôn">Đã ly hôn</option>
                          <option value="Góa phụ/Góa phu">Góa phụ/Góa phu</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="border-b border-gray-100 pb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Thông tin liên hệ</h4>
                    <div className="grid md:grid-cols-2 gap-4">
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
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-1.5">
                      <span>Hồ sơ cá nhân hóa gợi ý AI</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">KÍCH HOẠT</span>
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { icon: Calendar, label: 'Độ tuổi', value: user.age ? `${user.age} tuổi` : 'Chưa cập nhật' },
                        { icon: User, label: 'Giới tính', value: user.gender || 'Chưa cập nhật' },
                        { icon: Briefcase, label: 'Nghề nghiệp', value: user.occupation || 'Chưa cập nhật' },
                        { icon: Coins, label: 'Thu nhập hàng tháng', value: user.income ? formatPrice(user.income) : 'Chưa cập nhật' },
                        { icon: Heart, label: 'Tình trạng hôn nhân', value: user.maritalStatus || 'Chưa cập nhật', className: 'md:col-span-2' },
                      ].map(({ icon: Icon, label, value, className = '' }) => (
                        <div key={label} className={`flex items-center gap-3 ${className}`}>
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0"><Icon size={16} className="text-emerald-600" /></div>
                          <div>
                            <p className="text-xs text-gray-500">{label}</p>
                            <p className="text-sm font-medium text-gray-900">{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              {!showAddressForm ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">Địa chỉ nhận hàng</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Quản lý các địa điểm nhận hàng của bạn</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setAddressForm({
                          id: null,
                          recipientName: '',
                          phone: '',
                          province: '',
                          district: '',
                          ward: '',
                          addressDetail: '',
                          latitude: null,
                          longitude: null,
                          isDefault: false,
                          label: 'Nhà riêng',
                        });
                        setSelectedProvinceCode('');
                        setSelectedDistrictCode('');
                        setDistricts([]);
                        setWards([]);
                        setShowAddressForm(true);
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <Plus size={15} /> Thêm địa chỉ
                    </Button>
                  </div>

                  {loadingAddresses ? (
                    <div className="flex justify-center py-12"><Spinner /></div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl">
                      <MapPin size={36} className="text-gray-300 mx-auto mb-3 animate-pulse" />
                      <p className="text-gray-500 text-sm font-medium">Bạn chưa lưu địa chỉ giao hàng nào</p>
                      <p className="text-gray-400 text-xs mt-1">Thêm địa chỉ để thanh toán nhanh hơn nhé!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className="p-5 border border-gray-100 rounded-2xl hover:border-emerald-100 hover:shadow-sm transition-all duration-200 bg-gray-50/50 flex flex-col md:flex-row md:items-start justify-between gap-4"
                        >
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-gray-950">{address.recipientName}</span>
                              <span className="text-gray-300">|</span>
                              <span className="text-gray-500 font-medium">{address.phone}</span>
                              
                              {address.label && (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  {address.label}
                                </span>
                              )}

                              {address.isDefault && (
                                <span className="px-2.5 py-0.5 text-[10px] font-black rounded-md bg-emerald-600 text-white">
                                  Mặc định
                                </span>
                              )}
                            </div>

                            <p className="text-sm text-gray-600 leading-relaxed">
                              {address.addressDetail}, {address.ward}, {address.district}, {address.province}
                            </p>

                            {address.latitude && address.longitude && (
                              <p className="text-[11px] text-gray-400 flex items-center gap-1">
                                <MapPin size={11} className="text-emerald-500" />
                                Tọa độ GPS: {address.latitude.toFixed(5)}, {address.longitude.toFixed(5)}
                              </p>
                            )}
                          </div>

                          <div className="flex md:flex-col items-end gap-2 flex-wrap pt-2 md:pt-0">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditClick(address)}
                                className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-emerald-600 bg-white border border-gray-200 rounded-lg hover:border-emerald-200 transition-colors"
                              >
                                Chỉnh sửa
                              </button>
                              {!address.isDefault && (
                                <button
                                  onClick={() => handleDeleteAddress(address.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 bg-white border border-gray-200 rounded-lg hover:border-red-100 transition-colors"
                                  title="Xóa địa chỉ"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                            
                            {!address.isDefault && (
                              <button
                                onClick={() => handleSetDefault(address.id)}
                                className="px-3 py-1.5 text-xs font-bold text-emerald-600 hover:text-white bg-white hover:bg-emerald-600 border border-emerald-200 rounded-lg transition-colors"
                              >
                                Đặt làm mặc định
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <h3 className="font-bold text-gray-955 text-lg">
                      {addressForm.id ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ giao hàng mới'}
                    </h3>
                    <button
                      onClick={() => setShowAddressForm(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Họ và tên người nhận"
                      placeholder="Nhập họ tên đầy đủ"
                      value={addressForm.recipientName}
                      onChange={(e) => setAddressForm(p => ({ ...p, recipientName: e.target.value }))}
                      icon={User}
                    />
                    <Input
                      label="Số điện thoại"
                      placeholder="Nhập số điện thoại nhận hàng"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm(p => ({ ...p, phone: e.target.value }))}
                      icon={Phone}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">Tỉnh/Thành phố *</label>
                      <select
                        className="w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 border-gray-200 hover:border-gray-300"
                        value={selectedProvinceCode}
                        onChange={handleProvinceChange}
                      >
                        <option value="">Chọn Tỉnh/Thành phố</option>
                        {provinces.map((prov) => (
                          <option key={prov.code} value={prov.code}>{prov.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">Quận/Huyện *</label>
                      <select
                        className="w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 border-gray-200 hover:border-gray-300"
                        value={selectedDistrictCode}
                        onChange={handleDistrictChange}
                        disabled={!selectedProvinceCode}
                      >
                        <option value="">Chọn Quận/Huyện</option>
                        {districts.map((dist) => (
                          <option key={dist.code} value={dist.code}>{dist.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">Phường/Xã *</label>
                      <select
                        className="w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 border-gray-200 hover:border-gray-300"
                        value={wards.find(w => w.name === addressForm.ward)?.code || ''}
                        onChange={handleWardChange}
                        disabled={!selectedDistrictCode}
                      >
                        <option value="">Chọn Phường/Xã</option>
                        {wards.map((ward) => (
                          <option key={ward.code} value={ward.code}>{ward.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Input
                    label="Địa chỉ chi tiết (Số nhà, tên đường, tòa nhà) *"
                    placeholder="Ví dụ: Số 12, Ngõ 34, Đường Nguyễn Trãi"
                    value={addressForm.addressDetail}
                    onChange={(e) => setAddressForm(p => ({ ...p, addressDetail: e.target.value }))}
                    onBlur={handleAddressBlur}
                    icon={MapPin}
                  />

                  <div className="grid md:grid-cols-2 gap-4 items-center">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">Nhãn địa chỉ</label>
                      <div className="flex gap-2">
                        {['Nhà riêng', 'Văn phòng', 'Khác'].map((lbl) => (
                          <button
                            key={lbl}
                            type="button"
                            onClick={() => setAddressForm(p => ({ ...p, label: lbl }))}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg border transition-all ${
                              addressForm.label === lbl
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-400'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 pt-6 h-full">
                      <input
                        type="checkbox"
                        id="isDefaultCheckbox"
                        checked={addressForm.isDefault}
                        onChange={(e) => setAddressForm(p => ({ ...p, isDefault: e.target.checked }))}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <label htmlFor="isDefaultCheckbox" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                        Đặt làm địa chỉ mặc định
                      </label>
                    </div>
                  </div>

                  {/* Geolocation Preview Map */}
                  {MAPBOX_TOKEN && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 block">Vị trí trên bản đồ</label>
                      <div className="relative border border-gray-200 rounded-xl overflow-hidden bg-gray-100 shadow-inner">
                        <div ref={mapContainerRef} className="h-64 w-full" />
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-[11px] font-medium pointer-events-none">
                          Kéo thả ghim để tinh chỉnh tọa độ giao hàng
                        </div>
                      </div>
                      {addressForm.latitude && addressForm.longitude && (
                        <p className="text-xs text-gray-500 font-medium italic">
                          Tọa độ xác định: {addressForm.latitude.toFixed(6)}, {addressForm.longitude.toFixed(6)}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      onClick={() => setShowAddressForm(false)}
                      className="px-5"
                    >
                      Hủy bỏ
                    </Button>
                    <Button
                      onClick={handleSubmitAddress}
                      className="px-6"
                    >
                      Lưu địa chỉ
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent Orders */}
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
