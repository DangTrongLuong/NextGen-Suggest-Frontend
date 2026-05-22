import clsx from 'clsx';

const Input = ({
  label,
  error,
  hint,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  inputClassName = '',
  required = false,
  ...props
}) => {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={18} />
          </div>
        )}
        <input
          className={clsx(
            'w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400',
            'transition-all duration-200 outline-none',
            'focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
            error ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 hover:border-gray-300',
            Icon && 'pl-10',
            IconRight && 'pr-10',
            inputClassName
          )}
          {...props}
        />
        {IconRight && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <IconRight size={18} />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
};

export default Input;
