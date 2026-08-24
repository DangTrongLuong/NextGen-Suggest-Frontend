import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Trash2, TrendingUp, Grid, Search, X, Sparkles, Flame, Eye, Compass, ArrowRight
} from 'lucide-react';
import { searchPopupService } from '../../services/searchPopupService';
import { searchAnalyticsService } from '../../services/searchAnalyticsService';
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

const SearchPopup = ({ isOpen, searchQuery, onSelectKeyword, onClose, isMobileModal = false }) => {
  const [popupData, setPopupData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const navigate = useNavigate();

  const debouncedQuery = useDebounce(searchQuery, 350);

  useEffect(() => {
    if (!isOpen) return;
    
    if (searchQuery.trim().length < 2) {
      const fetchPopupData = async () => {
        setLoading(true);
        try {
          const data = await searchPopupService.getSearchPopup();
          if (data) {
            data.searchHistory = (data.searchHistory || []).filter(h => !isMaliciousQuery(h)).slice(0, 5);
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

  const containerVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.99 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.2,
        ease: 'easeOut',
        when: "beforeChildren",
        staggerChildren: 0.03
      }
    },
    exit: { 
      opacity: 0, 
      y: 6, 
      scale: 0.99,
      transition: { duration: 0.12 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -6 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.15 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={isMobileModal 
        ? "w-full bg-transparent flex flex-col h-full overflow-hidden" 
        : "absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-dropdown overflow-hidden z-50 flex flex-col max-h-[75vh] md:max-h-[540px] border border-slate-200/80"
      }
    >
      {showSuggestions ? (
        <div className="overflow-y-auto py-2 scrollbar-hide">
          {suggestionsLoading ? (
            <div className="px-6 py-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium text-slate-500">Đang tìm kiếm gợi ý...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="px-6 py-10 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
              <Search className="w-6 h-6 text-slate-300" />
              <span className="font-medium text-slate-500">Không tìm thấy gợi ý cho "{searchQuery}"</span>
            </div>
          ) : (
            suggestions.map((item, idx) => (
              <motion.div
                variants={itemVariants}
                key={idx}
                onClick={() => onSelectKeyword(item.keyword)}
                className="flex items-center justify-between px-5 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors duration-150 border-b border-slate-50 last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-1.5 rounded-md bg-slate-100 text-slate-500">
                    {item.type === 'HISTORY' ? (
                      <Clock size={14} />
                    ) : item.type === 'TRENDING' ? (
                      <Flame size={14} className="text-amber-500" />
                    ) : (
                      <Sparkles size={14} className="text-emerald-500" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-800 truncate">
                    {item.keyword}
                  </span>
                </div>
                {item.categoryId && item.type === 'AI_SUGGESTION' && (
                  <span className="flex-shrink-0 text-[10px] font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">
                    Danh mục
                  </span>
                )}
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <div className="overflow-y-auto p-5 space-y-5 scrollbar-hide">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-3 bg-slate-100 rounded w-28"></div>
              <div className="flex gap-2">
                <div className="h-7 bg-slate-100 rounded-full w-20"></div>
                <div className="h-7 bg-slate-100 rounded-full w-28"></div>
              </div>
            </div>
          ) : (
            popupData && (
              <>
                {popupData.relatedSearches && popupData.relatedSearches.length > 0 && (
                  <motion.div variants={itemVariants}>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-2 flex items-center gap-1">
                      <Sparkles size={11} className="text-emerald-500" /> Gợi ý tìm kiếm nhanh
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {popupData.relatedSearches.map((term, idx) => (
                        <button
                          key={idx}
                          onClick={() => onSelectKeyword(term)}
                          className="cursor-pointer text-xs font-medium px-3 py-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 transition-colors rounded-lg"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {popupData.searchHistory && popupData.searchHistory.length > 0 && (
                  <motion.div variants={itemVariants}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Clock size={11} /> Lịch sử tìm kiếm
                      </h3>
                      <button
                        onClick={handleClearAllHistory}
                        className="cursor-pointer text-[11px] font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1"
                      >
                        <Trash2 size={11} /> Xóa tất cả
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {popupData.searchHistory.slice(0, 5).map((h, idx) => (
                        <span
                          key={idx}
                          onClick={() => onSelectKeyword(h)}
                          className="cursor-pointer flex items-center gap-1.5 px-3 py-1 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 rounded-lg border border-slate-200/60"
                        >
                          {h}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteHistoryItem(e, h)}
                            className="cursor-pointer hover:text-rose-500 p-0.5 text-slate-400"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {popupData.recentlyViewed && popupData.recentlyViewed.length > 0 && (
                  <motion.div variants={itemVariants} className="space-y-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Eye size={11} /> Đã xem gần đây
                    </h3>
                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                      {popupData.recentlyViewed.map((p) => (
                        <Link
                          key={p.id}
                          to={`/products/${p.id}`}
                          onClick={() => {
                            searchAnalyticsService.trackClick({
                              productId: p.id || '',
                              productName: p.name || '',
                            });
                            if (onClose) onClose();
                          }}
                          className="flex-shrink-0 w-32 border border-slate-200/80 rounded-xl p-2 bg-white hover:border-slate-400 transition-all duration-200 group"
                        >
                          <div className="overflow-hidden rounded-lg bg-slate-50 mb-1.5 aspect-square">
                            <img
                              src={p.imageUrl || (p.images?.find(img => img.isPrimary)?.url ?? p.images?.[0]?.url ?? '')}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <p className="text-[11px] font-semibold text-slate-800 line-clamp-2 h-7 leading-tight mb-1">
                            {p.name}
                          </p>
                          <p className="text-xs text-slate-900 font-bold">
                            {formatPrice(p.basePrice)}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}

                {popupData.trendingSearches && popupData.trendingSearches.length > 0 && (
                  <motion.div variants={itemVariants} className="space-y-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <TrendingUp size={11} className="text-amber-500" /> Xu hướng tìm kiếm
                    </h3>
                    <div className="grid grid-cols-2 gap-1">
                      {popupData.trendingSearches.map((term, idx) => (
                        <div
                          key={idx}
                          onClick={() => onSelectKeyword(term)}
                          className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg cursor-pointer hover:bg-slate-50 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
                        >
                          <span className="text-[10px] font-bold text-slate-400 w-4">#{idx + 1}</span>
                          <span className="truncate">{term}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
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
