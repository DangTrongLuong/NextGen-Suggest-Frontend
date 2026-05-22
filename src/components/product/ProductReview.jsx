import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp } from 'lucide-react';
import Button from '../common/Button';

const mockReviews = [
  {
    id: 1,
    author: 'James R.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    rating: 5,
    date: '2024-01-15',
    title: 'Absolutely love it!',
    body: 'This product exceeded all my expectations. The build quality is exceptional and it works perfectly. Would definitely recommend to anyone looking for a premium experience.',
    helpful: 24,
    verified: true,
  },
  {
    id: 2,
    author: 'Emily K.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    rating: 4,
    date: '2024-01-08',
    title: 'Great quality, minor issues',
    body: 'Overall very happy with the purchase. The quality is top-notch and it arrived quickly. Took off one star because the packaging could be better, but the product itself is excellent.',
    helpful: 12,
    verified: true,
  },
  {
    id: 3,
    author: 'David M.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    rating: 5,
    date: '2023-12-20',
    title: 'Best purchase this year',
    body: 'I researched for weeks before buying and I\'m so glad I chose this. The performance is outstanding and the design is sleek. Customer service was also very helpful.',
    helpful: 31,
    verified: false,
  },
];

const StarRating = ({ rating, size = 16 }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={size}
        className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
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

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Customer Reviews</h2>

      {/* Summary */}
      <div className="flex flex-col sm:flex-row gap-8 mb-10 p-6 bg-gray-50 rounded-2xl">
        <div className="flex flex-col items-center justify-center">
          <span className="text-5xl font-bold text-gray-900">{product.rating}</span>
          <StarRating rating={Math.round(product.rating)} size={20} />
          <span className="text-sm text-gray-500 mt-1">{product.reviewCount.toLocaleString()} reviews</span>
        </div>
        <div className="flex-1 space-y-2">
          {ratingBreakdown.map(({ stars, count, percent }) => (
            <div key={stars} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-4">{stars}</span>
              <Star size={12} className="text-amber-400 fill-amber-400" />
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="h-full bg-amber-400 rounded-full"
                />
              </div>
              <span className="text-sm text-gray-500 w-4">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Write Review Button */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-gray-900">{mockReviews.length} Reviews</h3>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          Write a Review
        </Button>
      </div>

      {/* Review Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-gray-50 rounded-2xl p-6 mb-6"
        >
          <h4 className="font-semibold text-gray-900 mb-4">Your Review</h4>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button key={r} onClick={() => setNewReview((p) => ({ ...p, rating: r }))}>
                    <Star
                      size={24}
                      className={r <= newReview.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                    />
                  </button>
                ))}
              </div>
            </div>
            <input
              placeholder="Review title"
              value={newReview.title}
              onChange={(e) => setNewReview((p) => ({ ...p, title: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <textarea
              placeholder="Share your experience..."
              rows={4}
              value={newReview.body}
              onChange={(e) => setNewReview((p) => ({ ...p, body: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
            <div className="flex gap-3">
              <Button onClick={() => setShowForm(false)}>Submit Review</Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {mockReviews.map((review) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-b border-gray-100 pb-6 last:border-0"
          >
            <div className="flex items-start gap-4">
              <img
                src={review.avatar}
                alt={review.author}
                className="w-10 h-10 rounded-full bg-gray-100"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm">{review.author}</span>
                    {review.verified && (
                      <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                        Verified
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{review.date}</span>
                </div>
                <StarRating rating={review.rating} size={13} />
                <h4 className="font-semibold text-gray-900 mt-2 mb-1">{review.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{review.body}</p>
                <button className="flex items-center gap-1.5 mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  <ThumbsUp size={13} />
                  Helpful ({review.helpful})
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ProductReview;
