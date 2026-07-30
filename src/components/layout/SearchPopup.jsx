import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Trash2, TrendingUp, Grid, Search, X, Sparkles, Flame, Eye, Compass, ArrowRight
} from 'lucide-react';
import { searchPopupService } from '../../services/searchPopupService';
import { formatPrice } from '../../utils/formatPrice';
import { useDebounce } from '../../hooks/useDebounce';

const isMaliciousQuery = (q) => {
  if (!q) return true;
  const str = String(q).trim().toLowerCase();
  if (/\b(or|and)\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i.test(str)) return true;
  if (/--|union\s+select|<script|drop\s+table|sleep\s*\(/i.test(str)) return true;
  if (/^[^a-z0-9\u00C0-\u1EF9]+$/i.test(str)) return true;
  return false;
};

const SearchPopup = ({ isOpen, searchQuery, onSelectKeyword, onClose }) => {
  const [popupData, setPopupData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const navigate = useNavigate();

  const debouncedQuery = useDebounce(searchQuery, 150);

  // 1. Fetch default popup data when open and query is empty
  useEffect(() => {
    if (!isOpen) return;
    
    if (searchQuery.trim().length < 2) {
      const fetchPopupData = async () => {
        setLoading(true);
        try {
          const data = await searchPopupService.getSearchPopup();
          if (data) {
            data.searchHistory = (data.searchHistory || []).filter(h => !isMaliciousQuery(h));
            data.trendingSearches = (data.trendingSearches || []).filter(t => !isMaliciousQuery(t));
            data.relatedSearches = (data.relatedSearches || []).filter(r => !isMaliciousQuery(r));
          }
          setPopupData(data);
        } catch (error) {
          console.error('Failed to load search popup data:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchPopupData();
      setSuggestions([]);
    }
  }, [isOpen, searchQuery]);

  // 2. Fetch autocomplete suggestions when user starts typing (2+ chars)
  useEffect(() => {
    if (!isOpen || debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    const fetchSuggestions = async () => {
      setSuggestionsLoading(true);
      try {
        const data = await searchPopupService.getSuggestions(debouncedQuery);
        const filtered = (data.suggestions || []).filter(s => !isMaliciousQuery(s.keyword));
        setSuggestions(filtered);
      } catch (error) {
        console.error('Failed to load autocomplete suggestions:', error);
      } finally {
        setSuggestionsLoading(false);
      }
    };
    fetchSuggestions();
  }, [isOpen, debouncedQuery]);

  // 3. Handle history item deletion
  const handleDeleteHistoryItem = async (e, keyword) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await searchPopupService.deleteHistory(keyword);
      setPopupData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          searchHistory: prev.searchHistory.filter(h => h !== keyword)
        };
      });
    } catch (error) {
      console.error('Failed to delete history item:', error);
    }
  };

  // 4. Clear all history
  const handleClearAllHistory = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await searchPopupService.deleteHistory();
      setPopupData(prev => {
        if (!prev) return prev;
        return { ...prev, searchHistory: [] };
      });
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  };

  if (!isOpen) return null;

  const showSuggestions = searchQuery.trim().length >= 2;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.99 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.25,
        ease: [0.16, 1, 0.3, 1], // Custom cubic-bezier for snappy iOS feel
        when: "beforeChildren",
        staggerChildren: 0.04
      }
    },
    exit: { 
      opacity: 0, 
      y: 10, 
      scale: 0.99,
      transition: { duration: 0.15 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 350, damping: 25 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute top-full left-0 right-0 mt-3 bg-white/90 backdrop-blur-xl rounded-[26px] shadow-[0_20px_50px_rgba(0,0,0,0.12)] overflow-hidden z-50 flex flex-col max-h-[580px] ring-1 ring-black/[0.03]"
    >
      {/* ── SUGGESTIONS LIST ── */}
      {showSuggestions ? (
        <div className="overflow-y-auto py-3 scrollbar-thin">
          {suggestionsLoading ? (
            <div className="px-6 py-10 text-center text-sm text-gray-400 flex flex-col items-center justify-center gap-3">
              <div className="relative w-8 h-8">
                <span className="absolute inset-0 border-3 border-emerald-100 rounded-full"></span>
                <span className="absolute inset-0 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
              </div>
              <span className="font-medium text-gray-500 animate-pulse">Đang tìm kiếm gợi ý thông minh...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400 flex flex-col items-center justify-center gap-2">
              <Search className="w-8 h-8 text-gray-300 mb-1" />
              <span className="font-medium text-gray-500">Không tìm thấy gợi ý phù hợp cho "{searchQuery}"</span>
            </div>
          ) : (
            suggestions.map((item, idx) => (
              <motion.div
                variants={itemVariants}
                key={idx}
                onClick={() => onSelectKeyword(item.keyword)}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/30 cursor-pointer transition-all duration-200 group border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`p-2 rounded-xl transition-colors ${
                    item.type === 'HISTORY' ? 'bg-gray-50 group-hover:bg-emerald-100/50 text-gray-400 group-hover:text-emerald-600' :
                    item.type === 'TRENDING' ? 'bg-amber-50 group-hover:bg-amber-100 text-amber-500' :
                    'bg-emerald-50 group-hover:bg-emerald-100 text-emerald-500'
                  }`}>
                    {item.type === 'HISTORY' ? (
                      <Clock size={15} />
                    ) : item.type === 'TRENDING' ? (
                      <Flame size={15} className="animate-pulse" />
                    ) : (
                      <Sparkles size={15} />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-800 truncate group-hover:text-emerald-700 transition-colors">
                    {item.keyword}
                  </span>
                </div>
                {item.categoryId && item.type === 'AI_SUGGESTION' && (
                  <span className="flex-shrink-0 text-[11px] font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100/50 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all duration-200 shadow-sm">
                    Tìm trong danh mục
                  </span>
                )}
              </motion.div>
            ))
          )}
        </div>
      ) : (
        /* ── DEFAULT POPUP ── */
        <div className="overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {loading ? (
            // Premium Skeletons
            <div className="space-y-6 animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-gray-100/80 rounded-lg w-32"></div>
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-100/80 rounded-full w-24"></div>
                  <div className="h-8 bg-gray-100/80 rounded-full w-32"></div>
                  <div className="h-8 bg-gray-100/80 rounded-full w-20"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-100/80 rounded-lg w-40"></div>
                <div className="flex gap-4">
                  <div className="h-28 bg-gray-100/80 rounded-2xl w-32"></div>
                  <div className="h-28 bg-gray-100/80 rounded-2xl w-32"></div>
                </div>
              </div>
            </div>
          ) : (
            popupData && (
              <>
                {/* Related Searches */}
                {popupData.relatedSearches && popupData.relatedSearches.length > 0 && (
                  <motion.div variants={itemVariants}>
                    <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 mb-2.5 flex items-center gap-1.5">
                      <Sparkles size={12} className="text-emerald-500 animate-spin-slow" /> Có thể bạn quan tâm
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {popupData.relatedSearches.map((term, idx) => (
                        <button
                          key={idx}
                          onClick={() => onSelectKeyword(term)}
                          className="cursor-pointer text-xs font-semibold px-4 py-2 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 text-emerald-800 hover:from-emerald-600 hover:to-emerald-500 hover:text-white transition-all duration-300 rounded-full shadow-sm hover:shadow-emerald-100 hover:scale-[1.02] hover:-translate-y-0.5"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* History Section */}
                {popupData.searchHistory && popupData.searchHistory.length > 0 && (
                  <motion.div variants={itemVariants}>
                    <div className="flex items-center justify-between mb-2.5">
                      <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <Clock size={12} /> Lịch sử tìm kiếm
                      </h3>
                      <button
                        onClick={handleClearAllHistory}
                        className="cursor-pointer text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 hover:underline transition-colors"
                      >
                        <Trash2 size={12} /> Xóa tất cả
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {popupData.searchHistory.map((h, idx) => (
                        <span
                          key={idx}
                          onClick={() => onSelectKeyword(h)}
                          className="cursor-pointer group flex items-center gap-2 px-4 py-2 bg-gray-50/80 hover:bg-white text-xs font-semibold text-gray-700 hover:text-emerald-700 rounded-full shadow-sm transition-all duration-200 hover:-translate-y-0.5"
                        >
                          {h}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteHistoryItem(e, h)}
                            className="cursor-pointer hover:bg-red-50 hover:text-red-500 rounded-full p-0.5 text-gray-400 transition-colors"
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Recently Viewed Products */}
                {popupData.recentlyViewed && popupData.recentlyViewed.length > 0 && (
                  <motion.div variants={itemVariants} className="space-y-2.5">
                    <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Eye size={12} /> Sản phẩm vừa xem gần đây
                    </h3>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin snap-x">
                      {popupData.recentlyViewed.map((p) => (
                        <Link
                          key={p.id}
                          to={`/products/${p.id}`}
                          onClick={onClose}
                          className="flex-shrink-0 w-36 border border-gray-100 hover:border-emerald-300/80 rounded-2xl p-2.5 bg-gray-50/20 hover:bg-white transition-all duration-300 shadow-sm hover:shadow-[0_8px_20px_rgba(16,185,129,0.08)] hover:-translate-y-0.5 group snap-start"
                        >
                          <div className="overflow-hidden rounded-xl bg-gray-50 mb-2 relative aspect-[4/3]">
                            <img
                              src={p.imageUrl || (p.images?.find(img => img.isPrimary)?.url ?? p.images?.[0]?.url ?? '')}
                              alt={p.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                          <p className="text-[11px] font-semibold text-gray-800 line-clamp-2 h-7 group-hover:text-emerald-700 transition-colors leading-tight mb-1">
                            {p.name}
                          </p>
                          <p className="text-xs text-emerald-600 font-extrabold">
                            {formatPrice(p.basePrice)}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Grid Split: Trending & Categories */}
                {((popupData.trendingSearches && popupData.trendingSearches.length > 0) || 
                  (popupData.popularCategories && popupData.popularCategories.length > 0)) && (
                  <div className={`grid grid-cols-1 ${(popupData.trendingSearches && popupData.trendingSearches.length > 0) && 
                    (popupData.popularCategories && popupData.popularCategories.length > 0) ? 'md:grid-cols-2 gap-8' : 'gap-4'} pt-2`}>
                    
                    {/* Trending Searches */}
                    {popupData.trendingSearches && popupData.trendingSearches.length > 0 && (
                      <motion.div variants={itemVariants} className="space-y-3">
                        <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                          <TrendingUp size={12} className="text-amber-500" /> Xu hướng tìm kiếm
                        </h3>
                        <div className="space-y-1">
                          {popupData.trendingSearches.map((term, idx) => (
                            <div
                              key={idx}
                              onClick={() => onSelectKeyword(term)}
                              className="flex items-center gap-3.5 py-2 px-3 rounded-xl cursor-pointer group hover:bg-emerald-50/30 transition-all duration-200"
                            >
                              <span className={`text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                                idx === 0 ? 'bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-rose-100' : 
                                idx === 1 ? 'bg-gradient-to-br from-amber-500 to-orange-450 text-white shadow-amber-100' : 
                                idx === 2 ? 'bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-sky-100' : 'bg-gray-100 text-gray-550'
                              }`}>
                                {idx + 1}
                              </span>
                              <span className="text-xs font-bold text-gray-700 group-hover:text-emerald-700 transition-colors truncate flex-1">
                                {term}
                              </span>
                              <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 text-emerald-500 transition-all" />
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Popular Categories */}
                    {popupData.popularCategories && popupData.popularCategories.length > 0 && (
                      <motion.div variants={itemVariants} className="space-y-3">
                        <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                          <Compass size={12} className="text-emerald-500" /> Khám phá danh mục hot
                        </h3>
                        <div className="flex flex-wrap gap-2.5">
                          {popupData.popularCategories.map((c) => (
                            <Link
                              key={c.id}
                              to={`/products?category=${c.id}`}
                              onClick={onClose}
                              className="cursor-pointer text-xs font-bold px-4 py-2.5 bg-gray-50/80 hover:bg-emerald-600 text-gray-700 hover:text-white rounded-full transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
                            >
                              {c.name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </>
            )
          )}
        </div>
      )}
    </motion.div>
  );
};

export default SearchPopup;
