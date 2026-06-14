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

  // Fetch provinces on component mount
  useEffect(() => {
    axios.get('https://provinces.open-api.vn/api/p/')
      .then(res => {
        setProvinces(res.data);
      })
      .catch(err => console.error('Lỗi khi tải danh sách tỉnh thành:', err));
  }, []);

  // Fetch default address if available
  useEffect(() => {
    if (provinces.length > 0) {
      api.get('/user-addresses/default')
        .then(async (res) => {
          const defaultAddr = res.data?.data;
          if (defaultAddr) {
            // Populate dropdown states first
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
            toast.success('Đã tự động điền địa chỉ mặc định của bạn');
          }
        })
        .catch(err => console.log('Không có địa chỉ mặc định:', err));
    }
  }, [provinces]);

  // Load Mapbox library dynamically
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

  // Initialize Mapbox map preview
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

  // Perform geocoding based on typed address
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
    // Step 2 validation is only applicable if paymentMethod is CARD
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
        addressLine1: shipping.addressDetail, // fallback
        city: shipping.province, // fallback
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

      // Track behavior event for items
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
      <div className="flex items-center justify-center mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${
              i <= step ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {i + 1}
            </div>
            <span className={`ml-2 text-sm font-medium hidden sm:block ${i <= step ? 'text-emerald-600' : 'text-gray-400'}`}>
              {s}
            </span>
            {i < steps.length - 1 && (
              <div className={`w-12 sm:w-20 h-0.5 mx-3 transition-all ${i < step ? 'bg-emerald-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Address */}
      {step === 0 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={20} className="text-emerald-600" />
            <h3 className="text-lg font-bold text-gray-900">Địa chỉ giao hàng</h3>
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

          {/* Vietnamese Address Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700">Tỉnh/Thành phố *</label>
              <select
                value={selectedProvinceCode}
                onChange={handleProvinceChange}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors shadow-sm"
              >
                <option value="">Chọn Tỉnh/Thành phố</option>
                {provinces.map(p => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
              {errors.province && <p className="text-xs text-red-500">{errors.province}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700">Quận/Huyện *</label>
              <select
                value={selectedDistrictCode}
                onChange={handleDistrictChange}
                disabled={!selectedProvinceCode}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Chọn Quận/Huyện</option>
                {districts.map(d => (
                  <option key={d.code} value={d.code}>{d.name}</option>
                ))}
              </select>
              {errors.district && <p className="text-xs text-red-500">{errors.district}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700">Phường/Xã *</label>
              <select
                value={wards.find(w => w.name === shipping.ward)?.code || ''}
                onChange={handleWardChange}
                disabled={!selectedDistrictCode}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Chọn Phường/Xã</option>
                {wards.map(w => (
                  <option key={w.code} value={w.code}>{w.name}</option>
                ))}
              </select>
              {errors.ward && <p className="text-xs text-red-500">{errors.ward}</p>}
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

          {/* Mapbox Live Preview */}
          {shipping.latitude && shipping.longitude && MAPBOX_TOKEN && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 block">Xác thực vị trí trên bản đồ (Kéo marker để điều chỉnh)</label>
              <div ref={mapContainerRef} className="w-full h-60 rounded-2xl overflow-hidden border border-gray-200 shadow-sm" />
            </div>
          )}

          <Input
            label="Ghi chú đơn hàng"
            name="notes"
            value={shipping.notes}
            onChange={handleShippingChange}
            placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến..."
          />

          <Button fullWidth size="lg" onClick={() => validateStep(1) && setStep(1)}>Tiếp tục: Phương thức thanh toán</Button>
        </motion.div>
      )}

      {/* Step 1: Payment Method */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={20} className="text-emerald-600" />
            <h3 className="text-lg font-bold text-gray-900">Phương thức thanh toán</h3>
          </div>

          <div className="space-y-3">
            {/* COD option */}
            <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              shipping.paymentMethod === 'COD' ? 'border-emerald-600 bg-emerald-50/50' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                name="paymentMethod"
                value="COD"
                checked={shipping.paymentMethod === 'COD'}
                onChange={() => setShipping(s => ({ ...s, paymentMethod: 'COD' }))}
                className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Thanh toán khi nhận hàng (COD)</p>
                <p className="text-xs text-gray-500 mt-0.5">Thanh toán bằng tiền mặt khi shipper giao hàng tận nơi</p>
              </div>
            </label>

            {/* Card option */}
            <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              shipping.paymentMethod === 'CARD' ? 'border-emerald-600 bg-emerald-50/50' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                name="paymentMethod"
                value="CARD"
                checked={shipping.paymentMethod === 'CARD'}
                onChange={() => setShipping(s => ({ ...s, paymentMethod: 'CARD' }))}
                className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Thanh toán bằng thẻ ngân hàng</p>
                <p className="text-xs text-gray-500 mt-0.5">Sử dụng thẻ tín dụng Visa/MasterCard hoặc thẻ nội địa (Dummy)</p>
              </div>
            </label>
          </div>

          {/* Card Form - Displayed only if CARD is selected */}
          {shipping.paymentMethod === 'CARD' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl text-sm text-emerald-700">
                <Lock size={14} />
                Thông tin thanh toán của bạn được mã hóa an toàn.
              </div>
              <Input
                label="Số thẻ (Tùy chọn)"
                name="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={payment.cardNumber}
                onChange={handlePaymentChange}
                error={errors.cardNumber}
                required
              />
              <Input
                label="Tên chủ thẻ (Tùy chọn)"
                name="cardName"
                placeholder="NGUYEN VAN A"
                value={payment.cardName}
                onChange={handlePaymentChange}
                error={errors.cardName}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Ngày hết hạn (MM/YY)"
                  name="expiry"
                  placeholder="12/28"
                  value={payment.expiry}
                  onChange={handlePaymentChange}
                  error={errors.expiry}
                  required
                />
                <Input
                  label="Mã bảo mật (CVV)"
                  name="cvv"
                  placeholder="123"
                  value={payment.cvv}
                  onChange={handlePaymentChange}
                  error={errors.cvv}
                  required
                />
              </div>
            </motion.div>
          )}

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(0)}>
              <ArrowLeft size={16} className="mr-1" /> Quay lại
            </Button>
            <Button fullWidth size="lg" onClick={() => validateStep(2) && setStep(2)}>Tiếp tục: Xác nhận đơn hàng</Button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Review Order */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={20} className="text-emerald-600" />
            <h3 className="text-lg font-bold text-gray-900">Xác nhận đơn hàng</h3>
          </div>

          {/* Order Details Preview */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Người nhận hàng</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{shipping.recipientName} - {shipping.phone}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Địa chỉ nhận</p>
              <p className="text-sm text-gray-700 mt-0.5">
                {shipping.addressDetail}, {shipping.ward}, {shipping.district}, {shipping.province}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Phương thức thanh toán</p>
              <p className="text-sm text-gray-700 font-bold mt-0.5">
                {shipping.paymentMethod === 'COD' ? 'Thanh toán tiền mặt khi nhận hàng (COD)' : 'Thanh toán qua Thẻ'}
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Danh sách sản phẩm</p>
            {items.map((item) => (
              <div key={`${item.id}-${item.color}`} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-gray-50" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.name}</p>
                  <p className="text-xs text-gray-500">Màu sắc: {item.color || 'Mặc định'} | Số lượng: {item.quantity}</p>
                </div>
                <p className="text-sm font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tạm tính</span><span>{formatPrice(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Phí vận chuyển</span>
              <span className={shippingFee === 0 ? 'text-emerald-600 font-semibold' : ''}>
                {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Thuế (8%)</span><span>{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Tổng cộng</span><span className="text-emerald-600 text-lg">{formatPrice(total)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft size={16} className="mr-1" /> Quay lại
            </Button>
            <Button fullWidth size="lg" loading={loading} onClick={handlePlaceOrder}>
              Đặt hàng — {formatPrice(total)}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CheckoutForm;
