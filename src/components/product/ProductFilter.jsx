import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown, Check, Search } from 'lucide-react';
import clsx from 'clsx';
import { useProducts } from '../../context/ProductContext';
import { SORT_OPTIONS } from '../../utils/constants';
import CategoryTreeSidebar from './CategoryTreeSidebar';

// ── Constants (unchanged) ─────────────────────────────────
const COLORS = [
  { key: 'black',  label: 'Đen',   hex: '#111827' },
  { key: 'white',  label: 'Trắng', hex: '#f9fafb', border: true },
  { key: 'gray',   label: 'Xám',   hex: '#6b7280' },
  { key: 'red',    label: 'Đỏ',    hex: '#ef4444' },
  { key: 'blue',   label: 'Xanh',  hex: '#3b82f6' },
  { key: 'green',  label: 'Lá',    hex: '#10b981' },
  { key: 'yellow', label: 'Vàng',  hex: '#f59e0b' },
  { key: 'pink',   label: 'Hồng',  hex: '#ec4899' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const BRANDS = ['SoundElite', 'ChronoLux', 'ErgoWork', 'FitPro', 'SpeedStep', 'GlowLab', 'TypeMaster'];
const DISCOUNT_OPTIONS = [
  { label: '≥ 10%', value: 10 },
  { label: '≥ 20%', value: 20 },
  { label: '≥ 30%', value: 30 },
  { label: '≥ 50%', value: 50 },
];

// ── Dropdown wrapper ──────────────────────────────────────
// Renders the label + trigger button + floating panel
const FilterDropdown = ({ label, triggerText, isActive, isOpen, onToggle, children, badge }) => {
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onToggle(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onToggle]);

  return (
    <div ref={ref} className="relative">
      {/* Label row */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</span>
        {badge > 0 && (
          <span className="w-4 h-4 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>

      {/* Trigger button */}
      <button
        onClick={() => onToggle(!isOpen)}
        className={clsx(
          'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all duration-150',
          isActive
            ? 'border-emerald-400 bg-emerald-50 text-emerald-700 font-semibold'
            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
        )}
      >
        <span className="truncate">{triggerText}</span>
        <ChevronDown
          size={14}
          className={clsx('flex-shrink-0 ml-2 transition-transform duration-200 text-gray-400', isOpen && 'rotate-180')}
        />
      </button>

      {/* Floating dropdown panel */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
};

// ── Searchable option list (used inside dropdowns) ────────
const OptionList = ({ options, getValue, getLabel, isSelected, onSelect, showSearch = false }) => {
  const [search, setSearch] = useState('');
  const filtered = showSearch
    ? options.filter((o) => getLabel(o).toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <>
      {showSearch && (
        <div className="p-2 border-b border-gray-100">
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-300 transition-all">
            <Search size={13} className="text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm..."
              className="flex-1 bg-transparent text-xs outline-none text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>
      )}
      <div className="overflow-y-auto max-h-60 scrollbar-hide py-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">Không tìm thấy</p>
        ) : (
          filtered.map((opt) => {
            const val = getValue(opt);
            const lbl = getLabel(opt);
            const selected = isSelected(val);
            return (
              <button
                key={val}
                onClick={() => onSelect(val)}
                className={clsx(
                  'w-full flex items-center justify-between px-3.5 py-2.5 text-sm transition-colors',
                  selected
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <span>{lbl}</span>
                {selected && <Check size={13} className="text-emerald-600 flex-shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </>
  );
};

// ── Main Component ────────────────────────────────────────
const ProductFilter = ({ className = '' }) => {
  const { filters, sortBy, updateFilter, setSortBy, resetFilters, filteredProducts, categories } = useProducts();

  // Which dropdown is open (only one at a time)
  const [openKey, setOpenKey] = useState(null);

  // Filter states (unchanged)
  const [brandSearch, setBrandSearch] = useState('');
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [stockFilter, setStockFilter] = useState('all');

  // Toggle a specific dropdown — opening one closes others
  const toggle = useCallback((key) => (nextOpen) => {
    setOpenKey(nextOpen ? key : null);
  }, []);

  const toggleColor = (key) =>
    setSelectedColors((prev) => prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]);

  const toggleSize = (s) =>
    setSelectedSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const toggleBrand = (b) =>
    setSelectedBrands((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]);

  const filteredBrands = useMemo(
    () => BRANDS.filter((b) => b.toLowerCase().includes(brandSearch.toLowerCase())),
    [brandSearch]
  );

  const handleReset = () => {
    resetFilters();
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedBrands([]);
    setSelectedDiscount(null);
    setStockFilter('all');
    setBrandSearch('');
    setOpenKey(null);
  };

  const activeCount = [
    filters.category !== 'All',
    !!filters.minPrice || !!filters.maxPrice,
    !!filters.minRating,
    selectedColors.length > 0,
    selectedSizes.length > 0,
    selectedBrands.length > 0,
    !!selectedDiscount,
    stockFilter !== 'all',
  ].filter(Boolean).length;

  const allCategories = ['All', ...categories.map((c) => c.name)];

  // Derived display labels for trigger buttons
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Chọn...';
  const categoryLabel = filters.category === 'All' ? 'Tất cả danh mục' : filters.category;
  const ratingLabel = filters.minRating ? `≥ ${filters.minRating} sao` : 'Chọn đánh giá';
  const stockLabel = stockFilter === 'all' ? 'Tất cả' : stockFilter === 'instock' ? 'Còn hàng' : 'Hết hàng';
  const discountLabel = selectedDiscount ? `≥ ${selectedDiscount}%` : 'Chọn mức giảm';
  const colorLabel = selectedColors.length > 0 ? `${selectedColors.length} màu` : 'Chọn màu';
  const sizeLabel = selectedSizes.length > 0 ? selectedSizes.join(', ') : 'Chọn size';
  const brandLabel = selectedBrands.length > 0 ? `${selectedBrands.length} thương hiệu` : 'Chọn thương hiệu';

  return (
    <div
      className={clsx(
        'rounded-3xl border border-gray-100/80 bg-white/80 backdrop-blur-xl',
        'shadow-[0_4px_24px_rgba(0,0,0,0.06)]',
        className
      )}
    >
      {/* ── Header (unchanged) ── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
            <SlidersHorizontal size={15} className="text-emerald-600" />
          </div>
          <span className="font-bold text-gray-900">Bộ lọc</span>
          {activeCount > 0 && (
            <span className="w-5 h-5 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-semibold transition-colors"
          >
            <X size={12} /> Xóa tất cả
          </motion.button>
        )}
      </div>

      {/* ── Filter rows ── */}
      <div className="px-5 py-4 space-y-4">

        {/* Sắp xếp theo */}
        <FilterDropdown
          label="Sắp xếp theo"
          triggerText={sortLabel}
          isActive={sortBy !== 'featured'}
          isOpen={openKey === 'sort'}
          onToggle={toggle('sort')}
        >
          <OptionList
            options={SORT_OPTIONS}
            getValue={(o) => o.value}
            getLabel={(o) => o.label}
            isSelected={(v) => sortBy === v}
            onSelect={(v) => { setSortBy(v); setOpenKey(null); }}
          />
        </FilterDropdown>

        {/* Danh mục */}
        <FilterDropdown
          label="Danh mục"
          triggerText={categoryLabel}
          isActive={filters.category !== 'All'}
          isOpen={openKey === 'category'}
          onToggle={toggle('category')}
          badge={filters.category !== 'All' ? 1 : 0}
        >
          <div className="p-2">
            <CategoryTreeSidebar
              activeCategory={filters.category}
              onSelectCategory={(slug) => {
                updateFilter('category', slug);
                setOpenKey(null);
              }}
            />
          </div>
        </FilterDropdown>

        {/* Thương hiệu */}
        <FilterDropdown
          label="Thương hiệu"
          triggerText={brandLabel}
          isActive={selectedBrands.length > 0}
          isOpen={openKey === 'brand'}
          onToggle={toggle('brand')}
          badge={selectedBrands.length}
        >
          <OptionList
            showSearch
            options={BRANDS}
            getValue={(b) => b}
            getLabel={(b) => b}
            isSelected={(v) => selectedBrands.includes(v)}
            onSelect={(v) => toggleBrand(v)}
          />
        </FilterDropdown>

        {/* Khoảng giá — inline, no dropdown */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Khoảng giá</span>
            {(filters.minPrice || filters.maxPrice) && (
              <span className="w-4 h-4 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">1</span>
            )}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">$</span>
              <input
                type="number"
                placeholder="Tối thiểu"
                value={filters.minPrice}
                onChange={(e) => updateFilter('minPrice', e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white transition-all"
              />
            </div>
            <div className="w-3 h-px bg-gray-300 flex-shrink-0" />
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">$</span>
              <input
                type="number"
                placeholder="Tối đa"
                value={filters.maxPrice}
                onChange={(e) => updateFilter('maxPrice', e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white transition-all"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: '< $100', min: '', max: '100' },
              { label: '$100–$300', min: '100', max: '300' },
              { label: '> $300', min: '300', max: '' },
            ].map(({ label, min, max }) => (
              <button
                key={label}
                onClick={() => { updateFilter('minPrice', min); updateFilter('maxPrice', max); }}
                className={clsx(
                  'px-2.5 py-1 text-xs rounded-lg border transition-all font-medium',
                  filters.minPrice === min && filters.maxPrice === max
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-600 bg-white'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Đánh giá */}
        <FilterDropdown
          label="Đánh giá"
          triggerText={ratingLabel}
          isActive={!!filters.minRating}
          isOpen={openKey === 'rating'}
          onToggle={toggle('rating')}
          badge={filters.minRating ? 1 : 0}
        >
          <div className="py-1">
            {[4, 3, 2, 1].map((r) => (
              <button
                key={r}
                onClick={() => { updateFilter('minRating', filters.minRating === r ? '' : r); setOpenKey(null); }}
                className={clsx(
                  'w-full flex items-center justify-between px-3.5 py-2.5 text-sm transition-colors',
                  filters.minRating === r
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-amber-400 tracking-tight">{'★'.repeat(r)}</span>
                  <span className="text-gray-300 tracking-tight">{'★'.repeat(5 - r)}</span>
                  <span className="text-xs text-gray-500 ml-1">trở lên</span>
                </span>
                {filters.minRating === r && <Check size={13} className="text-emerald-600" />}
              </button>
            ))}
          </div>
        </FilterDropdown>

        {/* Tình trạng kho */}
        <FilterDropdown
          label="Tình trạng kho"
          triggerText={stockLabel}
          isActive={stockFilter !== 'all'}
          isOpen={openKey === 'stock'}
          onToggle={toggle('stock')}
          badge={stockFilter !== 'all' ? 1 : 0}
        >
          <OptionList
            options={[
              { key: 'all', label: 'Tất cả' },
              { key: 'instock', label: 'Còn hàng' },
              { key: 'outstock', label: 'Hết hàng' },
            ]}
            getValue={(o) => o.key}
            getLabel={(o) => o.label}
            isSelected={(v) => stockFilter === v}
            onSelect={(v) => { setStockFilter(v); setOpenKey(null); }}
          />
        </FilterDropdown>

        {/* Mức giảm giá */}
        <FilterDropdown
          label="Mức giảm giá"
          triggerText={discountLabel}
          isActive={!!selectedDiscount}
          isOpen={openKey === 'discount'}
          onToggle={toggle('discount')}
          badge={selectedDiscount ? 1 : 0}
        >
          <OptionList
            options={DISCOUNT_OPTIONS}
            getValue={(o) => o.value}
            getLabel={(o) => o.label}
            isSelected={(v) => selectedDiscount === v}
            onSelect={(v) => { setSelectedDiscount(selectedDiscount === v ? null : v); setOpenKey(null); }}
          />
        </FilterDropdown>

        {/* Màu sắc */}
        <FilterDropdown
          label="Màu sắc"
          triggerText={colorLabel}
          isActive={selectedColors.length > 0}
          isOpen={openKey === 'color'}
          onToggle={toggle('color')}
          badge={selectedColors.length}
        >
          <div className="p-3">
            <div className="flex flex-wrap gap-2.5">
              {COLORS.map(({ key, label, hex, border }) => (
                <button
                  key={key}
                  onClick={() => toggleColor(key)}
                  title={label}
                  className={clsx(
                    'w-8 h-8 rounded-full transition-all duration-150 flex items-center justify-center',
                    border && 'border border-gray-300',
                    selectedColors.includes(key)
                      ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110'
                      : 'hover:scale-110'
                  )}
                  style={{ backgroundColor: hex }}
                >
                  {selectedColors.includes(key) && (
                    <Check size={12} className={key === 'white' ? 'text-gray-700' : 'text-white'} />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2.5">
              {selectedColors.length > 0
                ? `Đã chọn: ${selectedColors.map((k) => COLORS.find((c) => c.key === k)?.label).join(', ')}`
                : 'Chọn một hoặc nhiều màu'}
            </p>
          </div>
        </FilterDropdown>

        {/* Kích thước */}
        <FilterDropdown
          label="Kích thước"
          triggerText={sizeLabel}
          isActive={selectedSizes.length > 0}
          isOpen={openKey === 'size'}
          onToggle={toggle('size')}
          badge={selectedSizes.length}
        >
          <div className="p-3">
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSize(s)}
                  className={clsx(
                    'px-3.5 py-2 rounded-xl text-sm font-semibold border-2 transition-all',
                    selectedSizes.includes(s)
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-600'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </FilterDropdown>

      </div>

      {/* ── Footer (unchanged) ── */}
      <div className="px-5 pb-5 pt-2 border-t border-gray-100 space-y-3">
        <p className="text-xs text-center text-gray-400">
          <span className="text-emerald-600 font-bold">{filteredProducts.length}</span> sản phẩm được tìm thấy
        </p>
        {activeCount > 0 && (
          <button
            onClick={handleReset}
            className="w-full py-2.5 border-2 border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            Xóa tất cả ({activeCount})
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductFilter;
