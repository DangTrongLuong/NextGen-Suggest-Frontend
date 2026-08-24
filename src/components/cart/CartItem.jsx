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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-card"
    >
      <Link to={`/products/${item.id}`} className="flex-shrink-0">
        <img
          src={item.image}
          alt={item.name}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover bg-slate-50 border border-slate-100"
        />
      </Link>

      <div className="flex-1 min-w-[140px]">
        <Link to={`/products/${item.id}`}>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 hover:text-emerald-600 transition-colors line-clamp-2">
            {item.name}
          </h3>
        </Link>
        {item.color && (
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{item.color}</p>
        )}
        <p className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1">{formatPrice(item.price)}</p>
      </div>

      <div className="flex items-center justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 gap-3">
        <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg p-0.5">
          <button
            onClick={() => updateQuantity(item.id, item.color, item.quantity - 1)}
            className="w-7 h-7 rounded-md bg-slate-50 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <Minus size={12} />
          </button>
          <span className="w-6 text-center text-xs font-bold text-slate-900">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.id, item.color, item.quantity + 1)}
            disabled={item.quantity >= item.stock}
            className="w-7 h-7 rounded-md bg-slate-50 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-30 cursor-pointer"
          >
            <Plus size={12} />
          </button>
        </div>

        <div className="text-right sm:ml-2">
          <p className="text-xs sm:text-sm font-extrabold text-slate-900">
            {formatPrice(item.price * item.quantity)}
          </p>
        </div>

        <button
          onClick={handleRemove}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ml-auto sm:ml-0"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </motion.div>
  );
};

export default CartItem;
