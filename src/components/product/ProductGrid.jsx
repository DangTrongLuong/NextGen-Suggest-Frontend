import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import EmptyState from '../common/EmptyState';
import { CardSkeleton } from '../common/Loading';
import { Search } from 'lucide-react';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const ProductGrid = ({ products, loading = false, placeholderCount = 8 }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
        {Array.from({ length: placeholderCount }).map((_, idx) => (
          <CardSkeleton key={idx} />
        ))}
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
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </motion.div>
  );
};

export default ProductGrid;

