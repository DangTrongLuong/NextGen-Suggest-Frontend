import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CategoryForm from '../../components/admin/CategoryForm';
import { categoryService } from '../../services/categoryService';
import { Spinner } from '../../components/common/Loading';

const EditCategory = () => {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    categoryService.getByIdAdmin(id)
      .then(setCategory)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (error || !category) return <Navigate to="/admin/categories" replace />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/admin/categories"
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Chỉnh sửa danh mục</h2>
          <p className="text-sm text-gray-500">{category.name}</p>
        </div>
      </div>
      <CategoryForm initialData={category} />
    </div>
  );
};

export default EditCategory;
