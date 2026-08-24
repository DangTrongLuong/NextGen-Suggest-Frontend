import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { recommendationService } from '../../services/recommendationService';
import { useAuth } from '../../context/AuthContext';

const HeroAISuggestions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    recommendationService.getQuerySuggestions(user)
      .then((data) => {
        if (!active) return;
        if (data && data.length > 0) {
          setSuggestions(data);
        } else {
          setSuggestions([]);
        }
      })
      .catch((err) => {
        if (!active) return;
        console.error('Failed to load query suggestions:', err);
        setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const handleCardClick = (query) => {
    const searchInputs = document.querySelectorAll('input[placeholder*="Tìm kiếm"]');
    searchInputs.forEach(input => {
      input.value = query;
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
    });

    navigate(`/products?search=${encodeURIComponent(query)}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.2 } 
    }
  };

  if (loading) {
    return (
      <div className="mt-8 w-full text-left bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card animate-pulse">
        <div className="h-4 w-40 bg-slate-200 rounded mb-2" />
        <div className="h-3 w-56 bg-slate-100 rounded mb-4" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-28 rounded-lg bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 w-full text-left bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 shadow-card">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-slate-900 text-xs font-bold tracking-wider flex items-center gap-2 uppercase">
            <Sparkles size={14} className="text-emerald-600" />
            Gợi ý chọn đồ theo phong cách sống
          </h3>
          <p className="text-slate-500 text-xs font-normal mt-0.5">
            Nhấp vào gợi ý để khám phá các sản phẩm phù hợp tức thì
          </p>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-hide"
      >
        {suggestions.map((item, index) => (
          <motion.button
            key={index}
            variants={cardVariants}
            onClick={() => handleCardClick(item.title || item.query)}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-200 text-slate-800 text-xs font-semibold transition-all duration-150 shadow-xs outline-none"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            {item.title}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};

export default HeroAISuggestions;
