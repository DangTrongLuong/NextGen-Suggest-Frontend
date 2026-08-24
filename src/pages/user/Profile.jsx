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
  pending:   { label: 'Chờ xác nhận', color: 'bg-slate-100 text-slate-800' },
  confirmed: { label: 'Đã xác nhận',  color: 'bg-emerald-50 text-emerald-700' },
  packing:   { label: 'Đóng gói',     color: 'bg-amber-50 text-amber-700' },
  shipping:  { label: 'Đang giao',    color: 'bg-slate-100 text-slate-900' },
  delivered: { label: 'Đã giao',      color: 'bg-emerald-50 text-emerald-700' },
  cancelled: { label: 'Đã hủy',       color: 'bg-rose-50 text-rose-700' },
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

  const [activeTab, setActiveTab] = useState('profile');
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('');

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

  useEffect(() => {
    if (showAddressForm) {
      axios.get('https://provinces.open-api.vn/api/p/')
        .then(res => setProvinces(res.data))
        .catch(err => console.error('Lỗi tải danh sách tỉnh thành:', err));
    }
  }, [showAddressForm]);

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
        }
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

  const avatarUrl = user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0f172a&color=fff`;

  return (
    <div className="min-h-screen bg-[#fafbfd] py-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="mb-4"><Breadcrumb items={[{ label: 'Tài khoản', to: '/profile' }]} /></div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-6 uppercase tracking-tight">Tài khoản của tôi</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 text-center">
              <div className="relative inline-block mb-3">
                <img src={avatarUrl} alt={user.name} className="w-20 h-20 rounded-full mx-auto border-2 border-slate-200" />
              </div>
              <h2 className="text-base font-bold text-slate-900">{user.name}</h2>
              <p className="text-xs text-slate-500 mb-2">{user.email}</p>
              <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-800 text-[11px] font-bold rounded capitalize">
                {user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
              </span>
              <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-xl font-extrabold text-slate-900">{orders.length}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Đơn hàng</p>
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900 truncate">{formatPrice(totalSpent)}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Đã chi tiêu</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-3 space-y-1">
              <Link to="/orders" className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-2.5">
                  <Truck size={15} className="text-slate-800" />
                  <span className="text-xs font-semibold text-slate-800">Đơn hàng của tôi</span>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
              </Link>
              <Link to="/wishlist" className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-2.5">
                  <Heart size={15} className="text-slate-800" />
                  <span className="text-xs font-semibold text-slate-800">Sản phẩm yêu thích</span>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-1 flex gap-1">
              <button
                onClick={() => { setActiveTab('profile'); setShowAddressForm(false); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Thông tin cá nhân
              </button>
              <button
                onClick={() => { setActiveTab('addresses'); setShowAddressForm(false); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'addresses'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Sổ địa chỉ
              </button>
            </div>

            {activeTab === 'profile' ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-sm">Hồ sơ tài khoản</h3>
                  {!editing ? (
                    <Button variant="ghost" size="sm" onClick={() => setEditing(true)}><Edit2 size={13} /> Chỉnh sửa</Button>
                  ) : (
                    <div className="flex gap-1.5">
                      <Button size="sm" onClick={handleSave}><Save size={13} /> Lưu</Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X size={13} /></Button>
                    </div>
                  )}
                </div>
                {editing ? (
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-4">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Thông tin liên hệ</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        <Input label="Họ và tên" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} icon={User} />
                        <Input label="Số điện thoại" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} icon={Phone} />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                        Hồ sơ gợi ý AI
                      </h4>
                      <p className="text-[11px] text-slate-500 mb-3">
                        Giúp hệ thống cá nhân hóa các sản phẩm hiển thị trên trang chủ cho bạn.
                      </p>
                      <div className="grid md:grid-cols-2 gap-3">
                        <Input label="Độ tuổi" type="number" value={form.age} onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))} icon={Calendar} />
                        
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-slate-700">Giới tính</label>
                          <select
                            className="w-full rounded-lg border bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900 border-slate-200 font-medium"
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
                        <Input label="Thu nhập (VND)" type="number" value={form.income} onChange={(e) => setForm((p) => ({ ...p, income: e.target.value }))} icon={Coins} />

                        <div className="flex flex-col gap-1 md:col-span-2">
                          <label className="text-xs font-semibold text-slate-700">Tình trạng hôn nhân</label>
                          <select
                            className="w-full rounded-lg border bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900 border-slate-200 font-medium"
                            value={form.maritalStatus}
                            onChange={(e) => setForm((p) => ({ ...p, maritalStatus: e.target.value }))}
                          >
                            <option value="">Chọn tình trạng hôn nhân</option>
                            <option value="Độc thân">Độc thân</option>
                            <option value="Đã kết hôn">Đã kết hôn</option>
                            <option value="Khác">Khác</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-4">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Liên hệ</h4>
                      <div className="grid md:grid-cols-2 gap-3 text-xs">
                        {[
                          { icon: User, label: 'Họ và tên', value: user.name },
                          { icon: Mail, label: 'Email', value: user.email },
                          { icon: Phone, label: 'Số điện thoại', value: user.phone || 'Chưa cập nhật' },
                        ].map(({ icon: Icon, label, value }) => (
                          <div key={label} className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Icon size={14} className="text-slate-700" /></div>
                            <div>
                              <p className="text-[11px] text-slate-400">{label}</p>
                              <p className="font-semibold text-slate-900">{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Hồ sơ sở thích</h4>
                      <div className="grid md:grid-cols-2 gap-3 text-xs">
                        {[
                          { icon: Calendar, label: 'Độ tuổi', value: user.age ? `${user.age} tuổi` : 'Chưa cập nhật' },
                          { icon: User, label: 'Giới tính', value: user.gender || 'Chưa cập nhật' },
                          { icon: Briefcase, label: 'Nghề nghiệp', value: user.occupation || 'Chưa cập nhật' },
                          { icon: Coins, label: 'Thu nhập hàng tháng', value: user.income ? formatPrice(user.income) : 'Chưa cập nhật' },
                        ].map(({ icon: Icon, label, value }) => (
                          <div key={label} className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Icon size={14} className="text-slate-700" /></div>
                            <div>
                              <p className="text-[11px] text-slate-400">{label}</p>
                              <p className="font-semibold text-slate-900">{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
                {!showAddressForm ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">Địa chỉ nhận hàng</h3>
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
                      >
                        <Plus size={14} /> Thêm địa chỉ
                      </Button>
                    </div>

                    {loadingAddresses ? (
                      <div className="flex justify-center py-8"><Spinner /></div>
                    ) : addresses.length === 0 ? (
                      <div className="text-center py-8 border border-slate-200 rounded-xl">
                        <MapPin size={32} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-600 text-xs font-semibold">Chưa có địa chỉ nào được lưu</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {addresses.map((address) => (
                          <div
                            key={address.id}
                            className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col md:flex-row md:items-start justify-between gap-3 text-xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{address.recipientName}</span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-600 font-medium">{address.phone}</span>
                                {address.isDefault && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-900 text-white">
                                    Mặc định
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-600">
                                {address.addressDetail}, {address.ward}, {address.district}, {address.province}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditClick(address)}
                                className="px-2.5 py-1 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg hover:border-slate-400 cursor-pointer"
                              >
                                Sửa
                              </button>
                              {!address.isDefault && (
                                <button
                                  onClick={() => handleDeleteAddress(address.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                        {addressForm.id ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
                      </h3>
                      <button onClick={() => setShowAddressForm(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <X size={16} />
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <Input
                        label="Họ tên người nhận"
                        value={addressForm.recipientName}
                        onChange={(e) => setAddressForm(p => ({ ...p, recipientName: e.target.value }))}
                        icon={User}
                      />
                      <Input
                        label="Số điện thoại"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm(p => ({ ...p, phone: e.target.value }))}
                        icon={Phone}
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-700">Tỉnh/Thành phố *</label>
                        <select
                          className="w-full rounded-lg border bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900 border-slate-200 font-medium"
                          value={selectedProvinceCode}
                          onChange={handleProvinceChange}
                        >
                          <option value="">Chọn Tỉnh/Thành phố</option>
                          {provinces.map((prov) => (
                            <option key={prov.code} value={prov.code}>{prov.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-700">Quận/Huyện *</label>
                        <select
                          className="w-full rounded-lg border bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900 border-slate-200 font-medium disabled:opacity-50"
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

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-700">Phường/Xã *</label>
                        <select
                          className="w-full rounded-lg border bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900 border-slate-200 font-medium disabled:opacity-50"
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
                      label="Địa chỉ chi tiết *"
                      value={addressForm.addressDetail}
                      onChange={(e) => setAddressForm(p => ({ ...p, addressDetail: e.target.value }))}
                      onBlur={handleAddressBlur}
                      icon={MapPin}
                    />

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <Button variant="ghost" size="sm" onClick={() => setShowAddressForm(false)}>Hủy</Button>
                      <Button size="sm" onClick={handleSubmitAddress}>Lưu địa chỉ</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-slate-900" />
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Đơn hàng gần đây</h3>
                </div>
                <Link to="/orders" className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 transition-colors">
                  Tất cả <ArrowRight size={13} />
                </Link>
              </div>
              {loadingOrders ? (
                <div className="flex justify-center py-6"><Spinner /></div>
              ) : orders.length === 0 ? (
                <div className="text-center py-6">
                  <Package size={30} className="text-slate-300 mx-auto mb-1.5" />
                  <p className="text-slate-500 text-xs">Chưa có đơn hàng nào</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {orders.map((order) => {
                    const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.pending;
                    return (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                        <div>
                          <p className="font-bold text-slate-900">#{order.orderNumber}</p>
                          <p className="text-[11px] text-slate-400">
                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-slate-900">{formatPrice(order.totalAmount)}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusInfo.color}`}>{statusInfo.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
