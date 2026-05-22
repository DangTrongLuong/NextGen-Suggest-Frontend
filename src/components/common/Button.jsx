import { motion } from 'framer-motion';
import clsx from 'clsx';

const variants = {
  primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200',
  secondary: 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-200',
  outline: 'border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white',
  ghost: 'text-gray-700 hover:bg-gray-100',
  danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200',
  white: 'bg-white text-gray-900 hover:bg-gray-50 shadow-lg',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
  xl: 'px-9 py-4 text-lg',
  icon: 'p-2.5',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  ...props
}) => {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 cursor-pointer select-none',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-60 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </motion.button>
  );
};

export default Button;
