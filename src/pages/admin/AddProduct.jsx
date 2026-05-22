import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ProductForm from '../../components/admin/ProductForm';

const AddProduct = () => {
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
          <h2 className="text-xl font-bold text-gray-900">Thêm sản phẩm mới</h2>
          <p className="text-sm text-gray-500">Điền thông tin để tạo sản phẩm</p>
        </div>
      </div>
      <ProductForm />
    </div>
  );
};

export default AddProduct;
