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
      className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
    >
      {/* Image */}
      <Link to={`/products/${item.id}`} className="flex-shrink-0">
        <img
          src={item.image}
          alt={item.name}
          className="w-20 h-20 rounded-xl object-cover bg-gray-50"
        />
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link to={`/products/${item.id}`}>
          <h3 className="text-sm font-semibold text-gray-900 hover:text-emerald-600 transition-colors line-clamp-2">
            {item.name}
          </h3>
        </Link>
        {item.color && (
          <p className="text-xs text-gray-500 mt-0.5">{item.color}</p>
        )}
        <p className="text-sm font-bold text-emerald-600 mt-1">{formatPrice(item.price)}</p>
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => updateQuantity(item.id, item.color, item.quantity - 1)}
          className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <Minus size={14} />
        </button>
        <span className="w-8 text-center text-sm font-semibold text-gray-900">
          {item.quantity}
        </span>
        <button
          onClick={() => updateQuantity(item.id, item.color, item.quantity + 1)}
          disabled={item.quantity >= item.stock}
          className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-40"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Subtotal */}
      <div className="text-right hidden sm:block">
        <p className="text-sm font-bold text-gray-900">
          {formatPrice(item.price * item.quantity)}
        </p>
      </div>

      {/* Remove */}
      <button
        onClick={handleRemove}
        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
      >
        <Trash2 size={16} />
      </button>
    </motion.div>
  );
};

export default CartItem;
