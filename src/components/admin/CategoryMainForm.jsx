import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Image as ImagePlus, RefreshCw, Upload, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../common/Input';
import Button from '../common/Button';
import { categoryMainService } from '../../services/categoryMainService';
import { uploadService } from '../../services/uploadService';

const generateSlug = (name) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

const CategoryMainForm = ({ initialData = null }) => {
  const navigate = useNavigate();
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    imageUrl: initialData?.imageUrl || '',
    displayOrder: initialData?.displayOrder ?? 0,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [slugManual, setSlugManual] = useState(isEdit);

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

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Tên danh mục chính là bắt buộc';
    else if (form.name.trim().length < 2) errs.name = 'Tối thiểu 2 ký tự';

    if (!form.slug.trim()) errs.slug = 'Slug là bắt buộc';
    else if (!/^[a-z0-9-]+$/.test(form.slug)) errs.slug = 'Slug chỉ gồm a-z, 0-9 và dấu -';

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
      imageUrl: form.imageUrl || null,
      displayOrder: Number(form.displayOrder) || 0,
    };

    try {
      if (isEdit) {
        await categoryMainService.update(initialData.id, payload);
        toast.success('Đã cập nhật danh mục chính');
      } else {
        await categoryMainService.create(payload);
        toast.success('Đã thêm danh mục chính mới');
      }
      navigate('/admin/category-mains');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lưu danh mục chính thất bại');
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
            label="Tên danh mục chính"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="VD: Nội Thất"
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
                placeholder="vd: noi-that"
                className={`flex-1 px-4 py-3 text-sm border rounded-xl outline-none transition-all ${
                  errors.slug
                    ? 'border-red-400 focus:ring-2 focus:ring-red-300'
                    : 'border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                }`}
              />
              <button
                type="button"
                onClick={() => { setSlugManual(false); setForm((p) => ({ ...p, slug: generateSlug(form.name) })); }}
                className="px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-55 transition-colors"
                title="Tạo lại từ tên"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug}</p>}
          </div>

          <Input
            label="Thứ tự hiển thị"
            name="displayOrder"
            type="number"
            min="0"
            value={form.displayOrder}
            onChange={handleChange}
            hint="Số nhỏ hiển thị trước"
          />
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

      <div className="flex gap-4">
        <Button type="button" variant="ghost" onClick={() => navigate('/admin/category-mains')}>
          Hủy
        </Button>
        <Button type="submit" loading={loading} size="lg">
          {isEdit ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </div>
    </motion.form>
  );
};

export default CategoryMainForm;
