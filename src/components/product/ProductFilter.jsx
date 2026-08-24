import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown, Check, Search } from 'lucide-react';
import clsx from 'clsx';
import { useProducts } from '../../context/ProductContext';
import { SORT_OPTIONS } from '../../utils/constants';
import CategoryTreeSidebar from './CategoryTreeSidebar';

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

const FilterDropdown = ({ label, triggerText, isActive, isOpen, onToggle, children, badge }) => {
  const ref = useRef(null);

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
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        {badge > 0 && (
          <span className="w-4 h-4 bg-slate-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>

      <button
        onClick={() => onToggle(!isOpen)}
        className={clsx(
          'w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer',
          isActive
            ? 'border-slate-900 bg-slate-100 text-slate-900 font-bold'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
        )}
      >
        <span className="truncate">{triggerText}</span>
        <ChevronDown
          size={14}
          className={clsx('flex-shrink-0 ml-2 transition-transform duration-200 text-slate-400', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-dropdown overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
};

const OptionList = ({ options, getValue, getLabel, isSelected, onSelect, showSearch = false }) => {
  const [search, setSearch] = useState('');
  const filtered = showSearch
    ? options.filter((o) => getLabel(o).toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <>
      {showSearch && (
        <div className="p-2 border-b border-slate-100">
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            <Search size={13} className="text-slate-400 flex-shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm..."
              className="flex-1 bg-transparent text-xs outline-none text-slate-700 placeholder-slate-400"
            />
          </div>
        </div>
      )}
      <div className="overflow-y-auto max-h-60 scrollbar-hide py-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Không tìm thấy</p>
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
                  'w-full flex items-center justify-between px-3.5 py-2 text-xs transition-colors cursor-pointer',
                  selected
                    ? 'bg-slate-100 text-slate-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                )}
              >
                <span>{lbl}</span>
                {selected && <Check size={13} className="text-slate-900 flex-shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </>
  );
};

const ProductFilter = ({ className = '' }) => {
  const { filters, sortBy, updateFilter, setSortBy, resetFilters, filteredProducts, categories } = useProducts();
  const [openKey, setOpenKey] = useState(null);

  const [brandSearch, setBrandSearch] = useState('');
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [stockFilter, setStockFilter] = useState('all');

  const toggle = useCallback((key) => (nextOpen) => {
    setOpenKey(nextOpen ? key : null);
  }, []);

  const toggleColor = (key) =>
    setSelectedColors((prev) => prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]);

  const toggleSize = (s) =>
    setSelectedSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const toggleBrand = (b) =>
    setSelectedBrands((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]);

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
        'rounded-2xl border border-slate-200/80 bg-white shadow-card',
        className
      )}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
            <SlidersHorizontal size={14} className="text-slate-800" />
          </div>
          <span className="font-extrabold text-xs uppercase tracking-wider text-slate-900">Bộ lọc</span>
          {activeCount > 0 && (
            <span className="w-4 h-4 bg-slate-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-rose-600 font-semibold cursor-pointer"
          >
            <X size={12} /> Xóa bộ lọc
          </button>
        )}
      </div>

      <div className="px-4 py-3.5 space-y-3.5">
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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Khoảng giá (đ)</span>
            {(filters.minPrice || filters.maxPrice) && (
              <span className="w-4 h-4 bg-slate-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">1</span>
            )}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1">
              <input
                type="number"
                placeholder="Từ"
                value={filters.minPrice}
                onChange={(e) => updateFilter('minPrice', e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-slate-900 bg-white font-medium"
              />
            </div>
            <div className="w-2 h-px bg-slate-300 flex-shrink-0" />
            <div className="flex-1">
              <input
                type="number"
                placeholder="Đến"
                value={filters.maxPrice}
                onChange={(e) => updateFilter('maxPrice', e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-slate-900 bg-white font-medium"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {[
              { label: '< 500k', min: '', max: '500000' },
              { label: '500k–2tr', min: '500000', max: '2000000' },
              { label: '> 2tr', min: '2000000', max: '' },
            ].map(({ label, min, max }) => (
              <button
                key={label}
                onClick={() => { updateFilter('minPrice', min); updateFilter('maxPrice', max); }}
                className={clsx(
                  'px-2 py-0.5 text-[11px] rounded border transition-colors font-medium cursor-pointer',
                  filters.minPrice === min && filters.maxPrice === max
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'border-slate-200 text-slate-600 hover:border-slate-400 bg-white'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

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
                  'w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer',
                  filters.minRating === r
                    ? 'bg-slate-100 text-slate-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                )}
              >
                <span className="flex items-center gap-1">
                  <span className="text-amber-400">{'★'.repeat(r)}</span>
                  <span className="text-slate-300">{'★'.repeat(5 - r)}</span>
                  <span className="text-slate-500 ml-1">trở lên</span>
                </span>
                {filters.minRating === r && <Check size={13} className="text-slate-900" />}
              </button>
            ))}
          </div>
        </FilterDropdown>

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

        <FilterDropdown
          label="Màu sắc"
          triggerText={colorLabel}
          isActive={selectedColors.length > 0}
          isOpen={openKey === 'color'}
          onToggle={toggle('color')}
          badge={selectedColors.length}
        >
          <div className="p-3">
            <div className="flex flex-wrap gap-2">
              {COLORS.map(({ key, label, hex, border }) => (
                <button
                  key={key}
                  onClick={() => toggleColor(key)}
                  title={label}
                  className={clsx(
                    'w-7 h-7 rounded-full transition-all flex items-center justify-center cursor-pointer',
                    border && 'border border-slate-300',
                    selectedColors.includes(key)
                      ? 'ring-2 ring-offset-2 ring-slate-900 scale-105'
                      : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: hex }}
                >
                  {selectedColors.includes(key) && (
                    <Check size={11} className={key === 'white' ? 'text-slate-800' : 'text-white'} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </FilterDropdown>

        <FilterDropdown
          label="Kích thước"
          triggerText={sizeLabel}
          isActive={selectedSizes.length > 0}
          isOpen={openKey === 'size'}
          onToggle={toggle('size')}
          badge={selectedSizes.length}
        >
          <div className="p-2.5">
            <div className="flex flex-wrap gap-1.5">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSize(s)}
                  className={clsx(
                    'px-3 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer',
                    selectedSizes.includes(s)
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'border-slate-200 text-slate-700 hover:border-slate-400'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </FilterDropdown>
      </div>

      <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-2">
        <p className="text-xs text-center text-slate-500 font-medium">
          <span className="text-slate-900 font-bold">{filteredProducts.length}</span> sản phẩm được tìm thấy
        </p>
        {activeCount > 0 && (
          <button
            onClick={handleReset}
            className="w-full py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            Xóa bộ lọc ({activeCount})
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductFilter;
