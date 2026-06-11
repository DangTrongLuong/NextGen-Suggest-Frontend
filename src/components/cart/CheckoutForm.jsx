import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, User, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Input from '../common/Input';
import Button from '../common/Button';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/formatPrice';
import { useBehaviorTracker } from '../../hooks/useBehaviorTracker';

const steps = ['Shipping', 'Payment', 'Review'];

const CheckoutForm = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { clearCart, cartTotal, items } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { trackPurchase } = useBehaviorTracker();

  const [shipping, setShipping] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'Vietnam',
  });

  const [payment, setPayment] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
  });
  const [errors, setErrors] = useState({});

  const handleShippingChange = (e) => {
    setShipping((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const handlePaymentChange = (e) => {
    setPayment((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const validateStep = (targetStep) => {
    const next = {};
    if (targetStep === 1) {
      if (!shipping.firstName.trim()) next.firstName = 'Vui lòng nhập họ';
      if (!shipping.lastName.trim()) next.lastName = 'Vui lòng nhập tên';
      if (!shipping.email.trim()) next.email = 'Vui lòng nhập email';
      if (!shipping.address.trim()) next.address = 'Vui lòng nhập địa chỉ';
      if (!shipping.city.trim()) next.city = 'Vui lòng nhập tỉnh/thành';
      if (!shipping.phone.trim()) next.phone = 'Vui lòng nhập số điện thoại';
    }
    if (targetStep === 2) {
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
    await new Promise((r) => setTimeout(r, 1500));

    // Track purchase event for each item in the cart
    (items || []).forEach((item) => {
      if (item.id) {
        trackPurchase(item.id);
      }
    });

    clearCart();
    toast.success('Đặt hàng thành công!');
    navigate('/');
    setLoading(false);
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

      {/* Step 0: Shipping */}
      {step === 0 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={20} className="text-emerald-600" />
            <h3 className="text-lg font-bold text-gray-900">Shipping Information</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" name="firstName" value={shipping.firstName} onChange={handleShippingChange} required />
            <Input label="Last Name" name="lastName" value={shipping.lastName} onChange={handleShippingChange} required />
          </div>
          <Input label="Email" name="email" type="email" value={shipping.email} onChange={handleShippingChange} required />
          <Input label="Phone" name="phone" type="tel" value={shipping.phone} onChange={handleShippingChange} />
          <Input label="Street Address" name="address" value={shipping.address} onChange={handleShippingChange} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City" name="city" value={shipping.city} onChange={handleShippingChange} required />
            <Input label="State" name="state" value={shipping.state} onChange={handleShippingChange} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="ZIP Code" name="zip" value={shipping.zip} onChange={handleShippingChange} required />
            <Input label="Country" name="country" value={shipping.country} onChange={handleShippingChange} required />
          </div>
          <Button fullWidth size="lg" onClick={() => validateStep(1) && setStep(1)}>Continue to Payment</Button>
        </motion.div>
      )}

      {/* Step 1: Payment */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={20} className="text-emerald-600" />
            <h3 className="text-lg font-bold text-gray-900">Payment Details</h3>
          </div>
          <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl text-sm text-emerald-700">
            <Lock size={14} />
            Your payment information is encrypted and secure.
          </div>
          <Input
            label="Card Number"
            name="cardNumber"
            placeholder="1234 5678 9012 3456"
            value={payment.cardNumber}
            onChange={handlePaymentChange}
            required
          />
          <Input
            label="Cardholder Name"
            name="cardName"
            placeholder="John Doe"
            value={payment.cardName}
            onChange={handlePaymentChange}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Expiry Date"
              name="expiry"
              placeholder="MM/YY"
              value={payment.expiry}
              onChange={handlePaymentChange}
              required
            />
            <Input
              label="CVV"
              name="cvv"
              placeholder="123"
              value={payment.cvv}
              onChange={handlePaymentChange}
              required
            />
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
            <Button fullWidth size="lg" onClick={() => validateStep(2) && setStep(2)}>Review Order</Button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Review */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={20} className="text-emerald-600" />
            <h3 className="text-lg font-bold text-gray-900">Review Your Order</h3>
          </div>

          {/* Items */}
          <div className="space-y-3">
            {items.map((item) => (
              <div key={`${item.id}-${item.color}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span><span>{formatPrice(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Shipping</span>
              <span className={shippingFee === 0 ? 'text-emerald-600' : ''}>{shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Thuế</span><span>{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Tổng cộng</span><span>{formatPrice(total)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
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
