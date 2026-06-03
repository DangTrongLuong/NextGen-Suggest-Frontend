import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import EmptyState from '../common/EmptyState';
import { Search } from 'lucide-react';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const ProductGrid = ({ products, loading = false }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 w-full col-span-full">
        <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="text-gray-500 text-sm font-semibold animate-pulse">Đang tìm kiếm và xếp hạng sản phẩm bằng AI...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="Không tìm thấy sản phẩm"
        description="Hãy thử nhập từ khóa tìm kiếm khác hoặc thay đổi bộ lọc."
      />
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </motion.div>
  );
};

export default ProductGrid;
