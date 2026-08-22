import { motion } from 'framer-motion';
import { Trash2, Minus, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/formatPrice';
import { useBehaviorTracker } from '../../hooks/useBehaviorTracker';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const { trackRemoveFromCart } = useBehaviorTracker();

  const handleRemove = () => {
    removeFromCart(item.id, item.color);
    trackRemoveFromCart(item.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 p-3.5 sm:p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
    >
      {/* Image */}
      <Link to={`/products/${item.id}`} className="flex-shrink-0">
        <img
          src={item.image}
          alt={item.name}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover bg-gray-50"
        />
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-[140px]">
        <Link to={`/products/${item.id}`}>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 hover:text-emerald-600 transition-colors line-clamp-2">
            {item.name}
          </h3>
        </Link>
        {item.color && (
          <p className="text-[11px] text-gray-500 mt-0.5">{item.color}</p>
        )}
        <p className="text-xs sm:text-sm font-bold text-emerald-600 mt-1">{formatPrice(item.price)}</p>
      </div>

      {/* Quantity & Remove Sub-row on small mobile screens */}
      <div className="flex items-center justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => updateQuantity(item.id, item.color, item.quantity - 1)}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <Minus size={13} />
          </button>
          <span className="w-7 text-center text-xs sm:text-sm font-semibold text-gray-900">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.id, item.color, item.quantity + 1)}
            disabled={item.quantity >= item.stock}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Plus size={13} />
          </button>
        </div>

        {/* Subtotal */}
        <div className="text-right sm:ml-2">
          <p className="text-xs sm:text-sm font-bold text-gray-900">
            {formatPrice(item.price * item.quantity)}
          </p>
        </div>

        {/* Remove */}
        <button
          onClick={handleRemove}
          className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer ml-auto sm:ml-0"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </motion.div>
  );
};

export default CartItem;
