import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp } from 'lucide-react';
import Button from '../common/Button';

const mockReviews = [
  {
    id: 1,
    author: 'Nguyễn Văn An',
    avatar: 'https://ui-avatars.com/api/?name=Nguyen+Van+An&background=0f172a&color=fff',
    rating: 5,
    date: '15-01-2026',
    title: 'Sản phẩm vượt ngoài mong đợi!',
    body: 'Chất lượng gia công hoàn hảo, đóng gói cẩn thận. Trải nghiệm sử dụng thực sự cao cấp và đáng tiền.',
    helpful: 24,
    verified: true,
  },
  {
    id: 2,
    author: 'Trần Thị Mai',
    avatar: 'https://ui-avatars.com/api/?name=Tran+Thi+Mai&background=0f172a&color=fff',
    rating: 4,
    date: '08-01-2026',
    title: 'Chất lượng tốt, giao hàng nhanh',
    body: 'Sản phẩm đẹp đúng mô tả, thiết kế tối giản sang trọng. Nhân viên hỗ trợ tư vấn rất nhiệt tình.',
    helpful: 12,
    verified: true,
  },
  {
    id: 3,
    author: 'Lê Hoàng Nam',
    avatar: 'https://ui-avatars.com/api/?name=Le+Hoang+Nam&background=0f172a&color=fff',
    rating: 5,
    date: '20-12-2025',
    title: 'Đáng tiền mua!',
    body: 'Sau 1 tháng sử dụng vẫn vô cùng ưng ý. Rất khuyến khích mọi người lựa chọn sản phẩm này.',
    helpful: 31,
    verified: true,
  },
];

const StarRating = ({ rating, size = 15 }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={size}
        className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}
      />
    ))}
  </div>
);

const ProductReview = ({ product }) => {
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', body: '' });

  const ratingBreakdown = [5, 4, 3, 2, 1].map((r) => ({
    stars: r,
    count: mockReviews.filter((rev) => rev.rating === r).length,
    percent: (mockReviews.filter((rev) => rev.rating === r).length / mockReviews.length) * 100,
  }));

  const productRating = product.rating || 4.8;
  const reviewCount = product.reviewCount || mockReviews.length;

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6 uppercase tracking-tight">Đánh giá từ khách hàng</h2>

      {/* Summary */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8 p-5 bg-slate-50 border border-slate-200/80 rounded-2xl">
        <div className="flex flex-col items-center justify-center sm:pr-6 sm:border-r border-slate-200">
          <span className="text-4xl font-extrabold text-slate-900">{Number(productRating).toFixed(1)}</span>
          <StarRating rating={Math.round(productRating)} size={18} />
          <span className="text-xs text-slate-500 font-medium mt-1">{reviewCount} nhận xét</span>
        </div>
        <div className="flex-1 space-y-1.5">
          {ratingBreakdown.map(({ stars, count, percent }) => (
            <div key={stars} className="flex items-center gap-2 text-xs">
              <span className="text-slate-600 font-semibold w-3">{stars}</span>
              <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.6 }}
                  className="h-full bg-slate-900 rounded-full"
                />
              </div>
              <span className="text-slate-400 w-4 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Write Review Button */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-900 text-sm">{mockReviews.length} Đánh giá chi tiết</h3>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          Viết đánh giá
        </Button>
      </div>

      {/* Review Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 mb-6"
        >
          <h4 className="font-bold text-slate-900 text-sm mb-3">Đánh giá của bạn</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Chọn số sao</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button key={r} onClick={() => setNewReview((p) => ({ ...p, rating: r }))} className="cursor-pointer">
                    <Star
                      size={20}
                      className={r <= newReview.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}
                    />
                  </button>
                ))}
              </div>
            </div>
            <input
              placeholder="Tiêu đề đánh giá..."
              value={newReview.title}
              onChange={(e) => setNewReview((p) => ({ ...p, title: e.target.value }))}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-900 bg-white"
            />
            <textarea
              placeholder="Chia sẻ nhận xét chi tiết về sản phẩm..."
              rows={3}
              value={newReview.body}
              onChange={(e) => setNewReview((p) => ({ ...p, body: e.target.value }))}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-900 resize-none bg-white"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setShowForm(false)}>Gửi đánh giá</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Hủy</Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Reviews List */}
      <div className="space-y-5">
        {mockReviews.map((review) => (
          <div
            key={review.id}
            className="border-b border-slate-100 pb-5 last:border-0"
          >
            <div className="flex items-start gap-3">
              <img
                src={review.avatar}
                alt={review.author}
                className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{review.author}</span>
                    {review.verified && (
                      <span className="text-[10px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-semibold border border-slate-200">
                        Đã mua hàng
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">{review.date}</span>
                </div>
                <StarRating rating={review.rating} size={12} />
                <h4 className="font-semibold text-slate-900 text-xs mt-1.5 mb-1">{review.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{review.body}</p>
                <button className="flex items-center gap-1 mt-2 text-[11px] font-medium text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                  <ThumbsUp size={12} />
                  Hữu ích ({review.helpful})
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductReview;
