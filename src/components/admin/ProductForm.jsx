import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Upload, Loader2, ArrowLeft, ArrowRight, Check, Trash } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../common/Input';
import Button from '../common/Button';
import { adminService } from '../../services/adminService';
import { categoryService } from '../../services/categoryService';
import { uploadService } from '../../services/uploadService';

const emptyVariant = () => ({
  sku: '',
  name: 'Mặc định',
  price: '',
  comparePrice: '',
  imageUrl: '',
  stock: 0,
  color: '',
  size: '',
  isActive: true,
});

const toFormState = (p) => ({
  name: p?.name || '',
  categoryId: p?.category?.id || '',
  shortDescription: p?.shortDescription || '',
  description: p?.description || '',
  brand: p?.brand || '',
  sku: p?.sku || '',
  stock: p?.stock ?? '',
  basePrice: p?.basePrice ?? '',
  comparePrice: p?.comparePrice ?? '',
  isActive: p?.isActive ?? true,
  isFeatured: p?.isFeatured ?? false,
  isNew: p?.isNew ?? false,
  isBestSeller: p?.isBestSeller ?? false,
  seoTitle: p?.seoTitle || '',
  seoDescription: p?.seoDescription || '',
  imageUrls: [...new Set(p?.images?.map((img) => img.url) || [])],
  variants: p?.variants?.length
    ? p.variants.map((v) => ({
        sku: v.sku || '',
        name: v.name || '',
        price: v.price ?? '',
        comparePrice: v.comparePrice ?? '',
        imageUrl: v.imageUrl || '',
        stock: v.stock ?? 0,
        color: v.color || '',
        size: v.size || '',
        isActive: v.isActive ?? true,
      }))
    : [emptyVariant()],
});

const ProductForm = ({ initialData = null }) => {
  const navigate = useNavigate();
  const isEdit = !!initialData;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => toFormState(initialData));
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Variant helper option tags states
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const [colorImages, setColorImages] = useState({});

  // Fetch categories
  useEffect(() => {
    categoryService.getAllAdmin()
      .then((cats) => {
        setCategories(cats);
        if (!isEdit && !form.categoryId && cats.length > 0) {
          // Find first leaf category as default
          const firstLeaf = cats.find(c => !cats.some(other => other.parentId === c.id));
          if (firstLeaf) {
            setForm((p) => ({ ...p, categoryId: firstLeaf.id }));
          }
        }
      })
      .catch(() => setCategories([]));
  }, [isEdit, form.categoryId]);

  // Load existing variant options in edit mode
  useEffect(() => {
    if (initialData?.variants) {
      const existingColors = [...new Set(initialData.variants.map((v) => v.color).filter(Boolean))];
      const existingSizes = [...new Set(initialData.variants.map((v) => v.size).filter(Boolean))];
      setColors(existingColors);
      setSizes(existingSizes);

      // Initialize color images mapping
      const mapping = {};
      initialData.variants.forEach((v) => {
        if (v.color && v.imageUrl && !mapping[v.color]) {
          mapping[v.color] = v.imageUrl;
        }
      });
      setColorImages(mapping);
    }
  }, [initialData]);

  // Dynamically generate variant combinations matrix in creation mode
  useEffect(() => {
    if (isEdit) return;

    const newVariants = [];
    const colorsList = colors.length > 0 ? colors : [''];
    const sizesList = sizes.length > 0 ? sizes : [''];

    colorsList.forEach((c) => {
      sizesList.forEach((s) => {
        const nameParts = [c, s].filter(Boolean);
        const name = nameParts.length > 0 ? nameParts.join(' / ') : 'Mặc định';
        
        // Generate SKU based on name, color, size
        const skuPrefix = form.sku || form.name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const skuParts = [skuPrefix, c, s].filter(Boolean).map(x => 
          x.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9]/g, '')
            .toUpperCase()
        );
        const sku = skuParts.join('-');

        const existing = form.variants.find((v) => v.color === c && v.size === s);

        newVariants.push({
          sku: existing?.sku || sku,
          name: existing?.name || name,
          price: existing?.price || form.basePrice || '',
          comparePrice: existing?.comparePrice || form.comparePrice || '',
          imageUrl: existing?.imageUrl || '',
          stock: existing?.stock ?? 0,
          color: c,
          size: s,
          isActive: existing?.isActive ?? true,
        });
      });
    });

    setForm((prev) => ({ ...prev, variants: newVariants }));
  }, [colors, sizes, form.sku, form.name, form.basePrice, form.comparePrice, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  // ── Image uploads ──────────────────────────────────────
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map((f) => uploadService.uploadImage(f, 'products'))
      );
      const urls = uploaded.map((u) => u.url);
      setForm((p) => ({ ...p, imageUrls: [...p.imageUrls, ...urls] }));
      toast.success(`Đã tải lên ${urls.length} ảnh`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tải ảnh lên thất bại');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (idx) => {
    setForm((p) => ({ ...p, imageUrls: p.imageUrls.filter((_, i) => i !== idx) }));
  };

  // ── Variants Matrix Modifiers ─────────────────────────
  const updateVariant = (idx, field, value) => {
    setForm((p) => {
      const variants = [...p.variants];
      variants[idx] = { ...variants[idx], [field]: value };
      return { ...p, variants };
    });
  };

  const addColor = (e) => {
    e.preventDefault();
    const val = colorInput.trim();
    if (val && !colors.includes(val)) {
      setColors([...colors, val]);
      setColorInput('');
    }
  };

  const removeColor = (val) => {
    setColors(colors.filter((c) => c !== val));
  };

  const addSize = (e) => {
    e.preventDefault();
    const val = sizeInput.trim();
    if (val && !sizes.includes(val)) {
      setSizes([...sizes, val]);
      setSizeInput('');
    }
  };

  const removeSize = (val) => {
    setSizes(sizes.filter((s) => s !== val));
  };

  // ── Validation by Step ───────────────────────────────
  const validateStep1 = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Tên sản phẩm là bắt buộc';
    else if (form.name.trim().length < 3) errs.name = 'Tên sản phẩm phải có ít nhất 3 ký tự';
    
    if (!form.categoryId) {
      errs.categoryId = 'Chọn danh mục';
    } else {
      // Enforce leaf category check: must not be parent of another category
      const isLeaf = !categories.some(c => c.parentId === Number(form.categoryId));
      if (!isLeaf) {
        errs.categoryId = 'Vui lòng chọn danh mục cấp cuối (leaf category) chứa sản phẩm trực tiếp';
      }
    }
    
    if (!form.brand.trim()) errs.brand = 'Thương hiệu là bắt buộc';
    else if (form.brand.trim().length < 2) errs.brand = 'Thương hiệu phải có ít nhất 2 ký tự';

    if (form.basePrice !== '' && (isNaN(form.basePrice) || Number(form.basePrice) <= 0))
      errs.basePrice = 'Giá bán phải lớn hơn 0';
    if (form.comparePrice !== '' && Number(form.comparePrice) <= Number(form.basePrice))
      errs.comparePrice = 'Giá so sánh phải lớn hơn giá bán';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    const skuSet = new Set();

    if (form.variants.length === 0) {
      toast.error('Sản phẩm phải có ít nhất 1 phiên bản');
      return false;
    }

    form.variants.forEach((v, i) => {
      if (!v.sku.trim()) errs[`variant_${i}_sku`] = 'SKU bắt buộc';
      else if (skuSet.has(v.sku.trim().toLowerCase())) errs[`variant_${i}_sku`] = 'SKU bị trùng';
      skuSet.add(v.sku.trim().toLowerCase());
      
      if (!v.name.trim()) errs[`variant_${i}_name`] = 'Tên phiên bản bắt buộc';
      
      if (!v.price || isNaN(v.price) || Number(v.price) <= 0)
        errs[`variant_${i}_price`] = 'Giá phải > 0';
      
      if (v.comparePrice && Number(v.comparePrice) <= Number(v.price))
        errs[`variant_${i}_comparePrice`] = 'Giá so sánh phải lớn hơn giá bán';
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ───────────────────────────────────────────
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (step < 3) {
      return;
    }
    if (!validateStep1() || !validateStep2()) {
      toast.error('Vui lòng kiểm tra lại thông tin các bước');
      return;
    }
    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      categoryId: Number(form.categoryId),
      shortDescription: form.shortDescription || null,
      description: form.description || null,
      brand: form.brand.trim(),
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      isNew: form.isNew,
      isBestSeller: form.isBestSeller,
      seoTitle: form.seoTitle || null,
      seoDescription: form.seoDescription || null,
      imageUrls: form.imageUrls,
      // Fallback base price (calculated as min price of variants if empty)
      basePrice: form.basePrice ? Number(form.basePrice) : Math.min(...form.variants.map(v => Number(v.price))),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
      imageUrl: form.imageUrls[0] || null, // fallback
      variants: form.variants.map((v) => ({
        sku: v.sku.trim(),
        name: v.name.trim(),
        price: Number(v.price),
        comparePrice: v.comparePrice ? Number(v.comparePrice) : null,
        stock: Number(v.stock) || 0,
        imageUrl: (v.color && colorImages[v.color]) ? colorImages[v.color] : null,
        color: v.color || null,
        size: v.size || null,
        isActive: v.isActive,
        attributes: '{}',
      })),
    };

    try {
      if (isEdit) {
        await adminService.updateProduct(initialData.id, payload);
        toast.success('Đã cập nhật sản phẩm');
      } else {
        await adminService.createProduct(payload);
        toast.success('Đã thêm sản phẩm mới');
      }
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lưu sản phẩm thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  return (
    <div className="space-y-6">
      {/* Wizard Steps indicator */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
        {[
          { num: 1, label: 'Thông tin chung' },
          { num: 2, label: 'Cấu hình phân loại (Variants)' },
          { num: 3, label: 'Kho hình ảnh' }
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-3 flex-1 last:flex-none">
            <div className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
              step === s.num
                ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                : step > s.num
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-400'
            )}>
              {step > s.num ? <Check size={16} /> : s.num}
            </div>
            <span className={clsx(
              'text-sm font-semibold transition-colors hidden sm:inline',
              step === s.num ? 'text-gray-900' : 'text-gray-400'
            )}>
              {s.label}
            </span>
            {s.num < 3 && <div className="h-0.5 flex-1 bg-gray-100 mx-4 hidden sm:block" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatePresence mode="wait">
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <h3 className="text-base font-bold text-gray-900 mb-2 border-b pb-2">Thông tin cơ bản</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    label="Tên sản phẩm"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    error={errors.name}
                    required
                    className="md:col-span-2"
                  />
                  <Input
                    label="Thương hiệu"
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                    error={errors.brand}
                    required
                  />
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Danh mục cấp cuối (Leaf Category) <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="categoryId"
                      value={form.categoryId}
                      onChange={handleChange}
                      className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="">— Chọn danh mục —</option>
                      {categories.map((c) => {
                        const disabled = categories.some(other => other.parentId === c.id);
                        return (
                          <option key={c.id} value={c.id} disabled={disabled}>
                            {c.parentName ? `${c.parentName} > ` : ''}{c.name} {disabled ? '(Danh mục gốc/cha)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    {errors.categoryId ? (
                      <p className="text-xs text-red-500 mt-1">{errors.categoryId}</p>
                    ) : (
                      <p className="text-[11px] text-gray-400 mt-1">Sản phẩm bắt buộc phải thuộc danh mục lá cuối cùng (không có danh mục con).</p>
                    )}
                  </div>
                  <Input
                    label="Mã SKU sản phẩm gốc (dùng làm tiền tố SKU các variant)"
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                    placeholder="VD: NK-TSHIRT"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Giá ước lượng (VND)"
                      name="basePrice"
                      type="number"
                      value={form.basePrice}
                      onChange={handleChange}
                      error={errors.basePrice}
                      hint="Giá mặc định của sản phẩm"
                    />
                    <Input
                      label="Giá so sánh (VND)"
                      name="comparePrice"
                      type="number"
                      value={form.comparePrice}
                      onChange={handleChange}
                      error={errors.comparePrice}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Mô tả ngắn</label>
                    <input
                      name="shortDescription"
                      value={form.shortDescription}
                      onChange={handleChange}
                      placeholder="Mô tả ngắn gọn về sản phẩm..."
                      className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Mô tả chi tiết</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Mô tả chi tiết sản phẩm..."
                      className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Status and Flags */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4 border-b pb-2">Trạng thái & Hiển thị</h3>
                <div className="flex flex-wrap gap-6">
                  {[
                    { name: 'isActive', label: 'Đang hoạt động' },
                    { name: 'isFeatured', label: 'Sản phẩm nổi bật' },
                    { name: 'isNew', label: 'Hàng mới về' },
                    { name: 'isBestSeller', label: 'Bán chạy' },
                  ].map(({ name, label }) => (
                    <label key={name} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        name={name}
                        checked={form[name]}
                        onChange={handleChange}
                        className="w-4 h-4 rounded accent-emerald-600"
                      />
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* SEO */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-base font-bold text-gray-900 mb-5 border-b pb-2">SEO (Tùy chọn)</h3>
                <div className="space-y-4">
                  <Input
                    label="SEO Title"
                    name="seoTitle"
                    value={form.seoTitle}
                    onChange={handleChange}
                    placeholder="Tiêu đề SEO..."
                  />
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">SEO Description</label>
                    <textarea
                      name="seoDescription"
                      value={form.seoDescription}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Mô tả công cụ tìm kiếm..."
                      className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Matrix Variants Generator */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              {/* Option definition */}
              {!isEdit && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Colors tag input */}
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-900 block border-b pb-1.5">Phân loại theo Màu sắc</label>
                    <div className="flex gap-2">
                      <input
                        value={colorInput}
                        onChange={(e) => setColorInput(e.target.value)}
                        placeholder="Nhập màu, vd: Đỏ, Đen..."
                        onKeyDown={(e) => e.key === 'Enter' && addColor(e)}
                        className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={addColor}
                        className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        Thêm
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {colors.map((c) => (
                        <span key={c} className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-xl font-bold border border-emerald-100">
                          {c}
                          <button type="button" onClick={() => removeColor(c)} className="text-emerald-500 hover:text-emerald-700"><X size={12} /></button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Sizes tag input */}
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-900 block border-b pb-1.5">Phân loại theo Kích thước</label>
                    <div className="flex gap-2">
                      <input
                        value={sizeInput}
                        onChange={(e) => setSizeInput(e.target.value)}
                        placeholder="Nhập kích thước, vd: S, M, L..."
                        onKeyDown={(e) => e.key === 'Enter' && addSize(e)}
                        className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={addSize}
                        className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        Thêm
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {sizes.map((s) => (
                        <span key={s} className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-xl font-bold border border-blue-100">
                          {s}
                          <button type="button" onClick={() => removeSize(s)} className="text-blue-500 hover:text-blue-700"><X size={12} /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Generated matrix table */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-x-auto">
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <h3 className="text-base font-bold text-gray-900">Danh sách phiên bản ({form.variants.length})</h3>
                  <p className="text-xs text-gray-400">Tự động đồng bộ các thay đổi ở trên và bảo toàn dữ liệu chỉnh sửa.</p>
                </div>

                <table className="w-full text-left text-sm border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold text-xs uppercase bg-gray-50/50">
                      <th className="py-3 px-2">#</th>
                      {colors.length > 0 && <th className="py-3 px-2">Màu sắc</th>}
                      {sizes.length > 0 && <th className="py-3 px-2">Kích thước</th>}
                      <th className="py-3 px-2">Tên phiên bản</th>
                      <th className="py-3 px-2">Mã SKU *</th>
                      <th className="py-3 px-2">Giá bán (VND) *</th>
                      <th className="py-3 px-2">Giá so sánh (VND)</th>
                      <th className="py-3 px-2">Tồn kho</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.variants.map((v, idx) => (
                      <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/30">
                        <td className="py-3.5 px-2 font-medium text-gray-400">{idx + 1}</td>
                        {colors.length > 0 && (
                          <td className="py-3.5 px-2 font-semibold text-emerald-700">{v.color || '—'}</td>
                        )}
                        {sizes.length > 0 && (
                          <td className="py-3.5 px-2 font-semibold text-blue-700">{v.size || '—'}</td>
                        )}
                        <td className="py-3.5 px-2 font-bold text-gray-800">{v.name}</td>
                        <td className="py-3.5 px-2">
                          <input
                            value={v.sku}
                            onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                            disabled={isEdit}
                            className={`px-3 py-1.5 text-xs border rounded-lg outline-none w-44 ${
                              errors[`variant_${idx}_sku`] ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-emerald-500'
                            }`}
                          />
                          {errors[`variant_${idx}_sku`] && (
                            <p className="text-[10px] text-red-500 mt-0.5">{errors[`variant_${idx}_sku`]}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-2">
                          <input
                            type="number"
                            value={v.price}
                            onChange={(e) => updateVariant(idx, 'price', e.target.value)}
                            className={`px-3 py-1.5 text-xs border rounded-lg outline-none w-32 ${
                              errors[`variant_${idx}_price`] ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-emerald-500'
                            }`}
                          />
                          {errors[`variant_${idx}_price`] && (
                            <p className="text-[10px] text-red-500 mt-0.5">{errors[`variant_${idx}_price`]}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-2">
                          <input
                            type="number"
                            value={v.comparePrice}
                            onChange={(e) => updateVariant(idx, 'comparePrice', e.target.value)}
                            className={`px-3 py-1.5 text-xs border rounded-lg border-gray-200 focus:border-emerald-500 outline-none w-32 ${
                              errors[`variant_${idx}_comparePrice`] ? 'border-red-400 bg-red-50' : ''
                            }`}
                          />
                          {errors[`variant_${idx}_comparePrice`] && (
                            <p className="text-[10px] text-red-500 mt-0.5">{errors[`variant_${idx}_comparePrice`]}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-2">
                          <input
                            type="number"
                            value={v.stock}
                            onChange={(e) => updateVariant(idx, 'stock', e.target.value)}
                            className="px-3 py-1.5 text-xs border border-gray-200 focus:border-emerald-500 rounded-lg outline-none w-20"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Images & Variant Override Image Uploads */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              {/* Product General Gallery */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-base font-bold text-gray-900 mb-5 border-b pb-2">Thư viện ảnh sản phẩm chung</h3>
                <div className="flex flex-wrap gap-4 mb-4">
                  {form.imageUrls.map((url, i) => (
                    <div key={i} className="relative w-28 h-28 rounded-2xl overflow-hidden border border-gray-200 shadow-sm group">
                      <img src={url} alt={`Preview #${i + 1}`} className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-bold rounded-lg uppercase tracking-wide">
                          Ảnh chính
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <label className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-300 hover:border-emerald-500 hover:bg-emerald-50/50 flex flex-col items-center justify-center text-gray-400 cursor-pointer transition-all">
                    {uploading ? (
                      <Loader2 size={24} className="animate-spin text-emerald-600" />
                    ) : (
                      <>
                        <Upload size={24} />
                        <span className="text-[10px] mt-1.5 font-bold uppercase tracking-wide">Tải ảnh lên</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-400">Kéo thả hoặc click để chọn nhiều ảnh. Định dạng PNG, JPG, WEBP tối đa 5MB. Ảnh đầu tiên được dùng làm ảnh chính đại diện.</p>
              </div>

              {/* Cấu hình hình ảnh theo phân loại màu sắc */}
              {colors.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-6">
                  <h3 className="text-base font-bold text-gray-900 mb-5 border-b pb-2">Hình ảnh đại diện theo màu sắc</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {colors.map((color) => {
                      const imgUrl = colorImages[color];
                      return (
                        <div key={color} className="flex gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/50 items-center">
                          <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-white relative flex items-center justify-center">
                            {imgUrl ? (
                              <>
                                <img src={imgUrl} alt={color} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setColorImages((prev) => ({ ...prev, [color]: '' }))}
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
                                >
                                  <X size={10} />
                                </button>
                              </>
                            ) : (
                              <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-gray-400 hover:text-emerald-600 transition-colors">
                                {uploading ? (
                                  <Loader2 size={16} className="animate-spin text-emerald-600" />
                                ) : (
                                  <>
                                    <Upload size={16} />
                                    <span className="text-[9px] font-bold mt-1 uppercase">Tải ảnh</span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={uploading}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    try {
                                      setUploading(true);
                                      const uploaded = await uploadService.uploadImage(file, 'products/variants');
                                      setColorImages((prev) => ({ ...prev, [color]: uploaded.url }));
                                      toast.success(`Đã cập nhật ảnh cho màu: ${color}`);
                                    } catch (err) {
                                      toast.error(err.response?.data?.message || 'Tải ảnh thất bại');
                                    } finally {
                                      setUploading(false);
                                      e.target.value = '';
                                    }
                                  }}
                                />
                              </label>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-800 truncate">Màu sắc: {color}</p>
                            <p className="text-[10px] text-gray-400 font-medium">Ảnh đại diện của biến thể màu này.</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wizard Controls */}
        <div className="flex justify-between items-center bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/admin/products')}
            >
              Hủy bỏ
            </Button>
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-1.5"
              >
                <ArrowLeft size={16} /> Quay lại
              </Button>
            )}
          </div>
          
          <div>
            {step === 1 && (
              <Button
                key="btn-step-1"
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5"
              >
                Tiếp tục <ArrowRight size={16} />
              </Button>
            )}
            {step === 2 && (
              <Button
                key="btn-step-2"
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5"
              >
                Tiếp tục <ArrowRight size={16} />
              </Button>
            )}
            {step === 3 && (
              <Button
                key="btn-submit"
                type="submit"
                loading={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Hoàn tất & Lưu sản phẩm
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;