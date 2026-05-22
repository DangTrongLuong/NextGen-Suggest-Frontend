import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Plus, Upload, Loader2 } from 'lucide-react';
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
  isActive: true,
});

// Convert API product → form-friendly shape
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
  imageUrls: p?.images?.map((img) => img.url) || [],
  variants: p?.variants?.length
    ? p.variants.map((v) => ({
        sku: v.sku || '',
        name: v.name || '',
        price: v.price ?? '',
        comparePrice: v.comparePrice ?? '',
        imageUrl: v.imageUrl || '',
        stock: v.stock ?? 0,
        isActive: v.isActive ?? true,
      }))
    : [emptyVariant()],
});

const ProductForm = ({ initialData = null }) => {
  const navigate = useNavigate();
  const isEdit = !!initialData;

  const [form, setForm] = useState(() => toFormState(initialData));
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    categoryService.getAllAdmin()
      .then((cats) => {
        setCategories(cats);
        // Default category if creating
        if (!isEdit && !form.categoryId && cats.length > 0) {
          setForm((p) => ({ ...p, categoryId: cats[0].id }));
        }
      })
      .catch(() => setCategories([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  // ── Image upload ──────────────────────────────────────
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

  // ── Variants ─────────────────────────────────────────
  const updateVariant = (idx, field, value) => {
    setForm((p) => {
      const variants = [...p.variants];
      variants[idx] = { ...variants[idx], [field]: value };
      return { ...p, variants };
    });
  };

  const addVariant = () => {
    setForm((p) => ({ ...p, variants: [...p.variants, emptyVariant()] }));
  };

  const removeVariant = (idx) => {
    setForm((p) => ({
      ...p,
      variants: p.variants.length > 1 ? p.variants.filter((_, i) => i !== idx) : p.variants,
    }));
  };

  // ── Validation ───────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Tên sản phẩm là bắt buộc';
    else if (form.name.trim().length < 3) errs.name = 'Tên sản phẩm phải có ít nhất 3 ký tự';
    if (!form.categoryId) errs.categoryId = 'Chọn danh mục';
    if (!form.brand.trim()) errs.brand = 'Thương hiệu là bắt buộc';
    else if (form.brand.trim().length < 2) errs.brand = 'Thương hiệu phải có ít nhất 2 ký tự';
    if (form.stock !== '' && (isNaN(form.stock) || Number(form.stock) < 0))
      errs.stock = 'Số lượng tồn kho phải >= 0';
    if (!form.basePrice || isNaN(form.basePrice) || Number(form.basePrice) <= 0)
      errs.basePrice = 'Giá phải lớn hơn 0';
    if (form.comparePrice && Number(form.comparePrice) <= Number(form.basePrice))
      errs.comparePrice = 'Giá so sánh phải lớn hơn giá bán';

    // Variants
    const skuSet = new Set();
    form.variants.forEach((v, i) => {
      if (!v.sku.trim()) errs[`variant_${i}_sku`] = 'SKU bắt buộc';
      else if (skuSet.has(v.sku.trim().toLowerCase())) errs[`variant_${i}_sku`] = 'SKU bị trùng';
      skuSet.add(v.sku.trim().toLowerCase());
      if (!v.name.trim()) errs[`variant_${i}_name`] = 'Tên phiên bản bắt buộc';
      if (!v.price || isNaN(v.price) || Number(v.price) <= 0)
        errs[`variant_${i}_price`] = 'Giá phải > 0';
      if (v.comparePrice && Number(v.comparePrice) < Number(v.price))
        errs[`variant_${i}_comparePrice`] = 'Giá so sánh phải lớn hơn giá bán';
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ───────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Vui lòng kiểm tra lại các trường nhập');
      return;
    }
    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      categoryId: Number(form.categoryId),
      shortDescription: form.shortDescription || null,
      description: form.description || null,
      brand: form.brand.trim(),
      sku: form.sku || null,
      basePrice: Number(form.basePrice),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      isNew: form.isNew,
      isBestSeller: form.isBestSeller,
      seoTitle: form.seoTitle || null,
      seoDescription: form.seoDescription || null,
      imageUrls: form.imageUrls,
      stock: form.stock !== '' ? Number(form.stock) : null,
      variants: form.variants.map((v) => ({
        sku: v.sku.trim(),
        name: v.name.trim(),
        price: Number(v.price),
        comparePrice: v.comparePrice ? Number(v.comparePrice) : null,
        stock: Number(v.stock) || 0,
        imageUrl: v.imageUrl || null,
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

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-base font-bold text-gray-900 mb-5">Thông tin cơ bản</h3>
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
              Danh mục <span className="text-red-500">*</span>
            </label>
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">— Chọn danh mục —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId}</p>}
          </div>
          <Input label="SKU sản phẩm" name="sku" value={form.sku} onChange={handleChange} />
          <Input
            label="Số lượng tồn kho"
            name="stock"
            type="number"
            min="0"
            value={form.stock}
            onChange={handleChange}
            error={errors.stock}
            hint="Tồn kho tổng cho SKU sản phẩm"
          />
          <Input
            label="Giá bán (VND)"
            name="basePrice"
            type="number"
            min="0"
            value={form.basePrice}
            onChange={handleChange}
            error={errors.basePrice}
            required
          />
          <Input
            label="Giá so sánh (VND)"
            name="comparePrice"
            type="number"
            min="0"
            value={form.comparePrice}
            onChange={handleChange}
            error={errors.comparePrice}
            hint="Để trống nếu không khuyến mãi"
          />
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Mô tả ngắn</label>
            <input
              name="shortDescription"
              value={form.shortDescription}
              onChange={handleChange}
              placeholder="Tóm tắt ngắn về sản phẩm..."
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
              placeholder="Mô tả đầy đủ..."
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-base font-bold text-gray-900 mb-5">Hình ảnh sản phẩm</h3>
        <div className="flex flex-wrap gap-3 mb-4">
          {form.imageUrls.map((url, i) => (
            <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group">
              <img src={url} alt={`#${i + 1}`} className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded">
                  Chính
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 flex flex-col items-center justify-center text-gray-400 cursor-pointer transition-all">
            {uploading ? (
              <Loader2 size={20} className="animate-spin text-emerald-600" />
            ) : (
              <>
                <Upload size={20} />
                <span className="text-[10px] mt-1 font-medium">Tải lên</span>
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
        <p className="text-xs text-gray-400">Ảnh đầu tiên là ảnh chính. PNG, JPG, WEBP tối đa 5MB.</p>
      </div>

      {/* Variants */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-gray-900">Phiên bản (Variants)</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEdit
                ? 'Variants chỉ chỉnh sửa khi tạo mới. Để cập nhật, dùng quản lý kho riêng.'
                : 'Tối thiểu 1 phiên bản, mỗi SKU phải duy nhất.'}
            </p>
          </div>
          {!isEdit && (
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              <Plus size={14} /> Thêm phiên bản
            </button>
          )}
        </div>

        <div className="space-y-4">
          {form.variants.map((v, idx) => (
            <div
              key={idx}
              className={`rounded-xl border p-4 ${isEdit ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}`}
            >
              {/* Header row: variant number + delete */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  Phiên bản #{idx + 1}
                </span>
                {!isEdit && form.variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(idx)}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                  >
                    <X size={13} /> Xóa
                  </button>
                )}
              </div>

              {/* Main content: ảnh bên trái + fields bên phải */}
              <div className="flex gap-4">
                {/* Ảnh variant */}
                <div className="flex-shrink-0 w-24">
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Ảnh</label>
                  {v.imageUrl ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 group">
                      <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover" />
                      {!isEdit && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateVariant(idx, 'imageUrl', '')}
                            className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <label className={`flex flex-col items-center justify-center w-24 h-24 rounded-lg border-2 border-dashed text-gray-400 text-[10px] text-center leading-tight transition-colors ${isEdit ? 'border-gray-200 bg-gray-100 cursor-not-allowed' : 'border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer'}`}>
                      <Upload size={16} className="mb-1" />
                      <span>Upload ảnh</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isEdit || uploading}
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            setUploading(true);
                            const uploaded = await uploadService.uploadImage(file, 'products/variants');
                            updateVariant(idx, 'imageUrl', uploaded.url);
                            toast.success('Đã tải ảnh variant');
                          } catch (err) {
                            toast.error(err.response?.data?.message || 'Tải ảnh variant thất bại');
                          } finally {
                            setUploading(false);
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Fields */}
                <div className="flex-1 min-w-0">
                  {/* Row 1: SKU + Tên phiên bản */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">SKU <span className="text-red-400">*</span></label>
                      <input
                        value={v.sku}
                        disabled={isEdit}
                        onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                        placeholder="VD: SP-001-BLACK"
                        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none ${
                          errors[`variant_${idx}_sku`] ? 'border-red-400 bg-red-50' : 'border-gray-200'
                        } ${isEdit ? 'bg-gray-100 text-gray-500' : 'focus:ring-2 focus:ring-emerald-500'}`}
                      />
                      {errors[`variant_${idx}_sku`] && (
                        <p className="text-[11px] text-red-500 mt-0.5">{errors[`variant_${idx}_sku`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Tên phiên bản <span className="text-red-400">*</span></label>
                      <input
                        value={v.name}
                        disabled={isEdit}
                        onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                        placeholder="VD: Đen / 256GB"
                        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none ${
                          errors[`variant_${idx}_name`] ? 'border-red-400 bg-red-50' : 'border-gray-200'
                        } ${isEdit ? 'bg-gray-100 text-gray-500' : 'focus:ring-2 focus:ring-emerald-500'}`}
                      />
                      {errors[`variant_${idx}_name`] && (
                        <p className="text-[11px] text-red-500 mt-0.5">{errors[`variant_${idx}_name`]}</p>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Giá + Giá so sánh + Tồn kho */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Giá bán (VND) <span className="text-red-400">*</span></label>
                      <input
                        type="number"
                        min="0"
                        value={v.price}
                        disabled={isEdit}
                        onChange={(e) => updateVariant(idx, 'price', e.target.value)}
                        placeholder="0"
                        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none ${
                          errors[`variant_${idx}_price`] ? 'border-red-400 bg-red-50' : 'border-gray-200'
                        } ${isEdit ? 'bg-gray-100 text-gray-500' : 'focus:ring-2 focus:ring-emerald-500'}`}
                      />
                      {errors[`variant_${idx}_price`] && (
                        <p className="text-[11px] text-red-500 mt-0.5">{errors[`variant_${idx}_price`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Giá so sánh (VND)</label>
                      <input
                        type="number"
                        min="0"
                        value={v.comparePrice}
                        disabled={isEdit}
                        onChange={(e) => updateVariant(idx, 'comparePrice', e.target.value)}
                        placeholder="Để trống nếu không KM"
                        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none ${
                          errors[`variant_${idx}_comparePrice`] ? 'border-red-400 bg-red-50' : 'border-gray-200'
                        } ${isEdit ? 'bg-gray-100 text-gray-500' : 'focus:ring-2 focus:ring-emerald-500'}`}
                      />
                      {errors[`variant_${idx}_comparePrice`] && (
                        <p className="text-[11px] text-red-500 mt-0.5">{errors[`variant_${idx}_comparePrice`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Tồn kho</label>
                      <input
                        type="number"
                        min="0"
                        value={v.stock}
                        disabled={isEdit}
                        onChange={(e) => updateVariant(idx, 'stock', e.target.value)}
                        placeholder="0"
                        className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none ${
                          isEdit ? 'bg-gray-100 text-gray-500' : 'focus:ring-2 focus:ring-emerald-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Flags */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-base font-bold text-gray-900 mb-5">Trạng thái & Hiển thị</h3>
        <div className="flex flex-wrap gap-6">
          {[
            { name: 'isActive', label: 'Đang hoạt động' },
            { name: 'isFeatured', label: 'Sản phẩm nổi bật' },
            { name: 'isNew', label: 'Hàng mới' },
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

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="button" variant="ghost" onClick={() => navigate('/admin/products')}>
          Hủy
        </Button>
        <Button type="submit" loading={submitting} size="lg">
          {isEdit ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
        </Button>
      </div>
    </motion.form>
  );
};

export default ProductForm;