import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Spinner } from '../../components/common/Loading';
import CategoryMainForm from '../../components/admin/CategoryMainForm';
import { categoryMainService } from '../../services/categoryMainService';

const EditCategoryMain = () => {
  const { id } = useParams();
  const [categoryMain, setCategoryMain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchCategoryMain = async () => {
      try {
        const data = await categoryMainService.getByIdAdmin(id);
        setCategoryMain(data);
      } catch (err) {
        toast.error('Không tải được thông tin danh mục chính');
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryMain();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !categoryMain) return <Navigate to="/admin/category-mains" replace />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/admin/category-mains"
          className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Sửa danh mục chính</h2>
          <p className="text-sm text-gray-500 mt-0.5">Cập nhật thông tin danh mục chính</p>
        </div>
      </div>

      <CategoryMainForm initialData={categoryMain} />
    </div>
  );
};

export default EditCategoryMain;
