import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Image as ImagePlus, RefreshCw, Upload, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../common/Input';
import Button from '../common/Button';
import { categoryService } from '../../services/categoryService';
import { uploadService } from '../../services/uploadService';
import { categoryMainService } from '../../services/categoryMainService';

const generateSlug = (name) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

const CategoryForm = ({ initialData = null }) => {
  const navigate = useNavigate();
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    imageUrl: initialData?.imageUrl || '',
    icon: initialData?.icon || '',
    parentId: initialData?.parentId ?? '',
    categoryMainId: initialData?.categoryMainId ?? '',
    sortOrder: initialData?.sortOrder ?? 0,
    isActive: initialData?.isActive ?? true,
    seoTitle: initialData?.seoTitle || '',
    seoDescription: initialData?.seoDescription || '',
  });

  const [allCategories, setAllCategories] = useState([]);
  const [categoryMains, setCategoryMains] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [slugManual, setSlugManual] = useState(isEdit);

  useEffect(() => {
    categoryService.getAllAdmin()
      .then(setAllCategories)
      .catch(() => setAllCategories([]));

    categoryMainService.getAllAdmin()
      .then(setCategoryMains)
      .catch(() => setCategoryMains([]));
  }, []);

  // Auto-slug
  useEffect(() => {
    if (!slugManual && form.name) {
      setForm((p) => ({ ...p, slug: generateSlug(form.name) }));
    }
  }, [form.name, slugManual]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleSlugChange = (e) => {
    setSlugManual(true);
    setForm((p) => ({ ...p, slug: e.target.value }));
    if (errors.slug) setErrors((p) => ({ ...p, slug: '' }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await uploadService.uploadImage(file, 'categories');
      setForm((p) => ({ ...p, imageUrl: data.url }));
      toast.success('Tải ảnh thành công');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tải ảnh thất bại');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Loại bỏ chính nó và descendants khỏi danh sách parent
  const getDescendantIds = (id) => {
    const children = allCategories.filter((c) => c.parentId === id);
    return children.reduce((acc, child) => [...acc, child.id, ...getDescendantIds(child.id)], []);
  };

  const validParents = allCategories.filter((c) => {
    if (!isEdit) return true;
    if (c.id === initialData.id) return false;
    return !getDescendantIds(initialData.id).includes(c.id);
  });

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Tên danh mục là bắt buộc';
    else if (form.name.trim().length < 2) errs.name = 'Tối thiểu 2 ký tự';

    if (!form.slug.trim()) errs.slug = 'Slug là bắt buộc';
    else if (!/^[a-z0-9-]+$/.test(form.slug)) errs.slug = 'Slug chỉ gồm a-z, 0-9 và dấu -';
    else {
      const dup = allCategories.find((c) => c.slug === form.slug && (!isEdit || c.id !== initialData.id));
      if (dup) errs.slug = 'Slug đã tồn tại';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description || null,
      imageUrl: form.imageUrl || null,
      icon: form.icon || null,
      parentId: form.parentId === '' ? null : Number(form.parentId),
      categoryMainId: form.categoryMainId === '' ? null : Number(form.categoryMainId),
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
      seoTitle: form.seoTitle || null,
      seoDescription: form.seoDescription || null,
    };

    try {
      if (isEdit) {
        await categoryService.update(initialData.id, payload);
        toast.success('Đã cập nhật danh mục');
      } else {
        await categoryService.create(payload);
        toast.success('Đã thêm danh mục mới');
      }
      navigate('/admin/categories');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lưu danh mục thất bại');
    } finally {
      setLoading(false);
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
            label="Tên danh mục"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="VD: Điện thoại"
            required
            className="md:col-span-2"
          />

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Slug <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                name="slug"
                value={form.slug}
                onChange={handleSlugChange}
                placeholder="vd: dien-thoai"
                className={`flex-1 px-4 py-3 text-sm border rounded-xl outline-none transition-all ${
                  errors.slug
                    ? 'border-red-400 focus:ring-2 focus:ring-red-300'
                    : 'border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                }`}
              />
              <button
                type="button"
                onClick={() => { setSlugManual(false); setForm((p) => ({ ...p, slug: generateSlug(form.name) })); }}
                className="px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                title="Tạo lại từ tên"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Danh mục chính</label>
            <select
              name="categoryMainId"
              value={form.categoryMainId}
              onChange={handleChange}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">Chọn danh mục chính...</option>
              {categoryMains.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Danh mục cha</label>
            <select
              name="parentId"
              value={form.parentId}
              onChange={handleChange}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">Không có (danh mục gốc)</option>
              {validParents.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <Input
            label="Thứ tự hiển thị"
            name="sortOrder"
            type="number"
            min="0"
            value={form.sortOrder}
            onChange={handleChange}
            hint="Số nhỏ hiển thị trước"
          />

          <Input
            label="Icon (emoji)"
            name="icon"
            value={form.icon}
            onChange={handleChange}
            placeholder="VD: 📱"
            className="md:col-span-2"
          />

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Mô tả</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Mô tả ngắn về danh mục..."
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Image */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-base font-bold text-gray-900 mb-5">Hình ảnh</h3>
        <div className="flex gap-5 flex-wrap items-start">
          <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center flex-shrink-0 relative">
            {form.imageUrl ? (
              <>
                <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, imageUrl: '' }))}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </>
            ) : (
              <ImagePlus size={28} className="text-gray-300" />
            )}
          </div>
          <div className="flex-1 min-w-48">
            <label className="block w-full cursor-pointer">
              <div className="px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-center hover:border-emerald-400 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 text-sm font-medium text-gray-600">
                {uploading ? (
                  <><Loader2 size={16} className="animate-spin" /> Đang tải lên...</>
                ) : (
                  <><Upload size={16} /> Chọn ảnh từ máy</>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
            <p className="text-xs text-gray-400 mt-2 mb-1">Hoặc nhập URL ảnh:</p>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4">Trạng thái</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${form.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.isActive ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
          <span className="text-sm font-medium text-gray-700">
            {form.isActive ? 'Đang hoạt động' : 'Tạm ẩn'}
          </span>
        </label>
      </div>

      {/* SEO */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-base font-bold text-gray-900 mb-5">SEO (tùy chọn)</h3>
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
              placeholder="Mô tả SEO..."
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="ghost" onClick={() => navigate('/admin/categories')}>
          Hủy
        </Button>
        <Button type="submit" loading={loading} size="lg">
          {isEdit ? 'Cập nhật danh mục' : 'Thêm danh mục'}
        </Button>
      </div>
    </motion.form>
  );
};

export default CategoryForm;
