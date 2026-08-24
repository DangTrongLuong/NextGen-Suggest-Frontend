import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, User, Lock, ArrowLeft, Check, Landmark } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';
import Input from '../common/Input';
import Button from '../common/Button';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/formatPrice';
import { useBehaviorTracker } from '../../hooks/useBehaviorTracker';
import api from '../../services/api';

const steps = ['Địa chỉ giao hàng', 'Phương thức thanh toán', 'Xác nhận đơn hàng'];
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const CheckoutForm = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { clearCart, cartTotal, items } = useCart();
  const navigate = useNavigate();
  const { trackPurchase } = useBehaviorTracker();

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('');

  const [mapboxLoaded, setMapboxLoaded] = useState(false);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [shipping, setShipping] = useState({
    recipientName: '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    addressDetail: '',
    latitude: null,
    longitude: null,
    paymentMethod: 'COD',
    notes: '',
  });

  const [payment, setPayment] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    axios.get('https://provinces.open-api.vn/api/p/')
      .then(res => {
        setProvinces(res.data);
      })
      .catch(err => console.error('Lỗi khi tải danh sách tỉnh thành:', err));
  }, []);

  useEffect(() => {
    if (provinces.length > 0) {
      api.get('/user-addresses/default')
        .then(async (res) => {
          const defaultAddr = res.data?.data;
          if (defaultAddr) {
            const matchedProv = provinces.find(p => p.name.toLowerCase() === defaultAddr.province.toLowerCase());
            if (matchedProv) {
              setSelectedProvinceCode(matchedProv.code);
              try {
                const distRes = await axios.get(`https://provinces.open-api.vn/api/p/${matchedProv.code}?depth=2`);
                const distList = distRes.data.districts || [];
                setDistricts(distList);

                const matchedDist = distList.find(d => d.name.toLowerCase() === defaultAddr.district.toLowerCase());
                if (matchedDist) {
                  setSelectedDistrictCode(matchedDist.code);
                  const wardRes = await axios.get(`https://provinces.open-api.vn/api/d/${matchedDist.code}?depth=2`);
                  const wardList = wardRes.data.wards || [];
                  setWards(wardList);
                }
              } catch (err) {
                console.error('Lỗi khi tải quận/phường mặc định:', err);
              }
            }

            setShipping(s => ({
              ...s,
              recipientName: defaultAddr.recipientName || '',
              phone: defaultAddr.phone || '',
              province: defaultAddr.province || '',
              district: defaultAddr.district || '',
              ward: defaultAddr.ward || '',
              addressDetail: defaultAddr.addressDetail || '',
              latitude: defaultAddr.latitude || null,
              longitude: defaultAddr.longitude || null,
            }));
            toast.success('Đã tự động điền địa chỉ mặc định');
          }
        })
        .catch(err => console.log('Không có địa chỉ mặc định:', err));
    }
  }, [provinces]);

  useEffect(() => {
    if (step === 0 && MAPBOX_TOKEN) {
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
  }, [step]);

  useEffect(() => {
    if (step === 0 && mapboxLoaded && mapContainerRef.current && shipping.latitude && shipping.longitude) {
      const mapboxgl = window.mapboxgl;
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [shipping.longitude, shipping.latitude],
        zoom: 15,
      });

      const marker = new mapboxgl.Marker({ draggable: true })
        .setLngLat([shipping.longitude, shipping.latitude])
        .addTo(map);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        setShipping(s => ({ ...s, latitude: lngLat.lat, longitude: lngLat.lng }));
      });

      mapRef.current = map;
      markerRef.current = marker;

      return () => {
        map.remove();
        mapRef.current = null;
        markerRef.current = null;
      };
    }
  }, [step, mapboxLoaded, shipping.latitude, shipping.longitude]);

  const handleShippingChange = (e) => {
    setShipping((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const handleProvinceChange = async (e) => {
    const code = e.target.value;
    setSelectedProvinceCode(code);
    setSelectedDistrictCode('');
    setDistricts([]);
    setWards([]);

    const prov = provinces.find(p => String(p.code) === String(code));
    const name = prov ? prov.name : '';
    setShipping(s => ({ ...s, province: name, district: '', ward: '' }));

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
    setShipping(s => ({ ...s, district: name, ward: '' }));

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
    setShipping(s => ({ ...s, ward: name }));
  };

  const handlePaymentChange = (e) => {
    setPayment((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const triggerGeocoding = async () => {
    const { addressDetail, ward, district, province } = shipping;
    if (!addressDetail || !ward || !district || !province || !MAPBOX_TOKEN) return;

    const query = `${addressDetail}, ${ward}, ${district}, ${province}, Việt Nam`;
    try {
      const res = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
      );
      if (res.data?.features?.length > 0) {
        const [lng, lat] = res.data.features[0].geometry.coordinates;
        setShipping(s => ({ ...s, latitude: lat, longitude: lng }));
      }
    } catch (e) {
      console.error('Lỗi khi định vị Mapbox geocoding:', e);
    }
  };

  const handleAddressBlur = () => {
    triggerGeocoding();
  };

  const validateStep = (targetStep) => {
    const next = {};
    if (targetStep === 1) {
      if (!shipping.recipientName.trim()) next.recipientName = 'Vui lòng nhập tên người nhận';
      if (!shipping.phone.trim()) next.phone = 'Vui lòng nhập số điện thoại';
      if (!shipping.province.trim()) next.province = 'Vui lòng chọn Tỉnh/Thành phố';
      if (!shipping.district.trim()) next.district = 'Vui lòng chọn Quận/Huyện';
      if (!shipping.ward.trim()) next.ward = 'Vui lòng chọn Phường/Xã';
      if (!shipping.addressDetail.trim()) next.addressDetail = 'Vui lòng nhập địa chỉ chi tiết';
    }
    if (targetStep === 2 && shipping.paymentMethod === 'CARD') {
      if (!payment.cardNumber.trim()) next.cardNumber = 'Vui lòng nhập số thẻ';
      if (!payment.cardName.trim()) next.cardName = 'Vui lòng nhập tên chủ thẻ';
      if (!payment.expiry.trim()) next.expiry = 'Vui lòng nhập ngày hết hạn';
      if (!payment.cvv.trim()) next.cvv = 'Vui lòng nhập CVV';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const payload = {
        recipientName: shipping.recipientName,
        phone: shipping.phone,
        addressLine1: shipping.addressDetail,
        city: shipping.province,
        postalCode: '100000',
        countryCode: 'VN',
        paymentMethod: shipping.paymentMethod,
        notes: shipping.notes,
        currency: 'VND',
        province: shipping.province,
        district: shipping.district,
        ward: shipping.ward,
        addressDetail: shipping.addressDetail,
        latitude: shipping.latitude,
        longitude: shipping.longitude,
      };

      await api.post('/orders/checkout', payload);

      (items || []).forEach((item) => {
        if (item.id) {
          trackPurchase(item.id);
        }
      });

      clearCart();
      toast.success('Đặt hàng thành công!');
      navigate('/');
    } catch (err) {
      console.error('Đặt hàng thất bại:', err);
      toast.error('Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const shippingFee = cartTotal >= 1000000 ? 0 : 30000;
  const tax = cartTotal * 0.08;
  const total = cartTotal + shippingFee + tax;

  return (
    <div>
      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-6">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
              i <= step ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              {i + 1}
            </div>
            <span className={`ml-2 text-xs font-semibold hidden sm:block ${i <= step ? 'text-slate-900' : 'text-slate-400'}`}>
              {s}
            </span>
            {i < steps.length - 1 && (
              <div className={`w-8 sm:w-16 h-0.5 mx-2 transition-colors ${i < step ? 'bg-slate-900' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Address */}
      {step === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={18} className="text-slate-900" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Địa chỉ giao hàng</h3>
          </div>

          <Input
            label="Họ và tên người nhận"
            name="recipientName"
            value={shipping.recipientName}
            onChange={handleShippingChange}
            error={errors.recipientName}
            required
          />

          <Input
            label="Số điện thoại"
            name="phone"
            type="tel"
            value={shipping.phone}
            onChange={handleShippingChange}
            error={errors.phone}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Tỉnh/Thành phố *</label>
              <select
                value={selectedProvinceCode}
                onChange={handleProvinceChange}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-slate-900 transition-colors font-medium"
              >
                <option value="">Chọn Tỉnh/Thành phố</option>
                {provinces.map(p => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
              {errors.province && <p className="text-xs text-rose-600">{errors.province}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Quận/Huyện *</label>
              <select
                value={selectedDistrictCode}
                onChange={handleDistrictChange}
                disabled={!selectedProvinceCode}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-slate-900 transition-colors font-medium disabled:opacity-50"
              >
                <option value="">Chọn Quận/Huyện</option>
                {districts.map(d => (
                  <option key={d.code} value={d.code}>{d.name}</option>
                ))}
              </select>
              {errors.district && <p className="text-xs text-rose-600">{errors.district}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Phường/Xã *</label>
              <select
                value={wards.find(w => w.name === shipping.ward)?.code || ''}
                onChange={handleWardChange}
                disabled={!selectedDistrictCode}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-slate-900 transition-colors font-medium disabled:opacity-50"
              >
                <option value="">Chọn Phường/Xã</option>
                {wards.map(w => (
                  <option key={w.code} value={w.code}>{w.name}</option>
                ))}
              </select>
              {errors.ward && <p className="text-xs text-rose-600">{errors.ward}</p>}
            </div>
          </div>

          <Input
            label="Địa chỉ chi tiết (Số nhà, đường, ngõ...)"
            name="addressDetail"
            value={shipping.addressDetail}
            onChange={handleShippingChange}
            onBlur={handleAddressBlur}
            error={errors.addressDetail}
            required
          />

          {shipping.latitude && shipping.longitude && MAPBOX_TOKEN && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Xác thực vị trí trên bản đồ</label>
              <div ref={mapContainerRef} className="w-full h-48 rounded-xl overflow-hidden border border-slate-200 shadow-xs" />
            </div>
          )}

          <Input
            label="Ghi chú đơn hàng"
            name="notes"
            value={shipping.notes}
            onChange={handleShippingChange}
            placeholder="Ví dụ: Giao giờ hành chính..."
          />

          <button
            onClick={() => validateStep(1) && setStep(1)}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            Tiếp tục: Thanh toán
          </button>
        </motion.div>
      )}

      {/* Step 1: Payment Method */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={18} className="text-slate-900" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Phương thức thanh toán</h3>
          </div>

          <div className="space-y-2.5">
            <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
              shipping.paymentMethod === 'COD' ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
            }`}>
              <input
                type="radio"
                name="paymentMethod"
                value="COD"
                checked={shipping.paymentMethod === 'COD'}
                onChange={() => setShipping(s => ({ ...s, paymentMethod: 'COD' }))}
                className="text-slate-900 focus:ring-slate-900 h-4 w-4"
              />
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-900">Thanh toán khi nhận hàng (COD)</p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-normal">Thanh toán tiền mặt trực tiếp cho shipper khi nhận hàng</p>
              </div>
            </label>

            <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
              shipping.paymentMethod === 'CARD' ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
            }`}>
              <input
                type="radio"
                name="paymentMethod"
                value="CARD"
                checked={shipping.paymentMethod === 'CARD'}
                onChange={() => setShipping(s => ({ ...s, paymentMethod: 'CARD' }))}
                className="text-slate-900 focus:ring-slate-900 h-4 w-4"
              />
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-900">Thẻ ngân hàng / Thẻ quốc tế</p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-normal">Hỗ trợ Visa, MasterCard, ATM nội địa</p>
              </div>
            </label>
          </div>

          {shipping.paymentMethod === 'CARD' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                <Lock size={13} />
                Thông tin được mã hóa bảo mật theo tiêu chuẩn PCI DSS.
              </div>
              <Input
                label="Số thẻ"
                name="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={payment.cardNumber}
                onChange={handlePaymentChange}
                error={errors.cardNumber}
                required
              />
              <Input
                label="Tên chủ thẻ"
                name="cardName"
                placeholder="NGUYEN VAN A"
                value={payment.cardName}
                onChange={handlePaymentChange}
                error={errors.cardName}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Hạn thẻ (MM/YY)"
                  name="expiry"
                  placeholder="12/28"
                  value={payment.expiry}
                  onChange={handlePaymentChange}
                  error={errors.expiry}
                  required
                />
                <Input
                  label="Mã CVV"
                  name="cvv"
                  placeholder="123"
                  value={payment.cvv}
                  onChange={handlePaymentChange}
                  error={errors.cvv}
                  required
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setStep(0)}
              className="px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Quay lại
            </button>
            <button
              onClick={() => validateStep(2) && setStep(2)}
              className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              Xác nhận đơn hàng
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Review Order */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <User size={18} className="text-slate-900" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Xác nhận đơn hàng</h3>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
            <div>
              <p className="font-bold text-slate-400 uppercase tracking-wider">Người nhận</p>
              <p className="font-bold text-slate-900 mt-0.5">{shipping.recipientName} - {shipping.phone}</p>
            </div>
            <div>
              <p className="font-bold text-slate-400 uppercase tracking-wider">Địa chỉ</p>
              <p className="text-slate-700 font-medium mt-0.5">
                {shipping.addressDetail}, {shipping.ward}, {shipping.district}, {shipping.province}
              </p>
            </div>
            <div>
              <p className="font-bold text-slate-400 uppercase tracking-wider">Thanh toán</p>
              <p className="text-slate-900 font-bold mt-0.5">
                {shipping.paymentMethod === 'COD' ? 'Thanh toán tiền mặt (COD)' : 'Thẻ ngân hàng'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sản phẩm ({items.length})</p>
            {items.map((item) => (
              <div key={`${item.id}-${item.color}`} className="flex items-center gap-3 p-2.5 bg-white border border-slate-200/80 rounded-xl">
                <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-slate-50" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 line-clamp-1">{item.name}</p>
                  <p className="text-[11px] text-slate-500 font-medium">SL: {item.quantity} {item.color && `| ${item.color}`}</p>
                </div>
                <p className="text-xs font-extrabold text-slate-900">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 space-y-1.5 border border-slate-200/80 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Tạm tính</span><span>{formatPrice(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Phí vận chuyển</span>
              <span className={shippingFee === 0 ? 'text-emerald-600 font-bold' : ''}>
                {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Thuế (8%)</span><span>{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Tổng cộng</span><span className="text-slate-900 text-sm font-extrabold">{formatPrice(total)}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Quay lại
            </button>
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : `Đặt hàng • ${formatPrice(total)}`}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CheckoutForm;
