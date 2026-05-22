import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ProductForm from '../../components/admin/ProductForm';
import { adminService } from '../../services/adminService';
import { Spinner } from '../../components/common/Loading';

const EditProduct = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    adminService.getProductById(id)
      .then(setProduct)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (error || !product) return <Navigate to="/admin/products" replace />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/admin/products"
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Chỉnh sửa sản phẩm</h2>
          <p className="text-sm text-gray-500">{product.name}</p>
        </div>
      </div>
      <ProductForm initialData={product} />
    </div>
  );
};

export default EditProduct;
