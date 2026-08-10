import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { categoryService } from '../services/categoryService';
import { categoryMainService } from '../services/categoryMainService';
import { buildCategoryTree } from '../utils/categoryHelper';

const CategoryContext = createContext(null);

const SESSION_CACHE_KEY_CATS = 'nivora_categories_cache_v1';
const SESSION_CACHE_KEY_MAINS = 'nivora_category_mains_cache_v1';
const SESSION_CACHE_TIME_KEY = 'nivora_category_cache_time_v1';
const CACHE_TTL_MS = 3600 * 1000; // 1 hour client cache

const getStoredCache = () => {
  try {
    const cacheTime = sessionStorage.getItem(SESSION_CACHE_TIME_KEY);
    if (!cacheTime || Date.now() - Number(cacheTime) > CACHE_TTL_MS) {
      return null;
    }
    const catsStr = sessionStorage.getItem(SESSION_CACHE_KEY_CATS);
    const mainsStr = sessionStorage.getItem(SESSION_CACHE_KEY_MAINS);
    if (catsStr && mainsStr) {
      const categories = JSON.parse(catsStr);
      const categoryMains = JSON.parse(mainsStr);
      if (!Array.isArray(categoryMains) || categoryMains.length === 0 || !Array.isArray(categories) || categories.length === 0) {
        return null;
      }
      return {
        categories,
        categoryMains,
      };
    }
  } catch {
    return null;
  }
  return null;
};

export const CategoryProvider = ({ children }) => {
  const cached = useMemo(() => getStoredCache(), []);

  const [categories, setCategories] = useState(cached?.categories || []);
  const [categoryMains, setCategoryMains] = useState(cached?.categoryMains || []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && cached && cached.categoryMains?.length > 0) {
      setCategories(cached.categories);
      setCategoryMains(cached.categoryMains);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [catsData, mainsData] = await Promise.all([
        categoryService.getAll(),
        categoryMainService.getAll(),
      ]);

      const validCats = catsData || [];
      const validMains = mainsData || [];

      setCategories(validCats);
      setCategoryMains(validMains);
      setError(null);

      // Save to sessionStorage if valid non-empty data
      if (validMains.length > 0 && validCats.length > 0) {
        try {
          sessionStorage.setItem(SESSION_CACHE_KEY_CATS, JSON.stringify(validCats));
          sessionStorage.setItem(SESSION_CACHE_KEY_MAINS, JSON.stringify(validMains));
          sessionStorage.setItem(SESSION_CACHE_TIME_KEY, String(Date.now()));
        } catch (e) {
          console.warn('Could not save category cache to sessionStorage:', e);
        }
      }
    } catch (err) {
      console.error('Error fetching categories in CategoryContext:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [cached]);

  useEffect(() => {
    if (!cached || categories.length === 0 || categoryMains.length === 0) {
      fetchCategories();
    }
  }, [fetchCategories, cached, categories.length, categoryMains.length]);

  const refreshCategories = useCallback(() => {
    sessionStorage.removeItem(SESSION_CACHE_KEY_CATS);
    sessionStorage.removeItem(SESSION_CACHE_KEY_MAINS);
    sessionStorage.removeItem(SESSION_CACHE_TIME_KEY);
    return fetchCategories(true);
  }, [fetchCategories]);

  // Compute general tree of all categories
  const categoryTree = useMemo(() => {
    return buildCategoryTree(categories);
  }, [categories]);

  // Group root categories under their corresponding categoryMainId
  const categoryTreeByMain = useMemo(() => {
    const grouped = {};
    categoryMains.forEach((main) => {
      const mainRoots = categoryTree.filter((cat) => {
        const catMainId = cat.categoryMainId !== undefined ? cat.categoryMainId : cat.category_main_id;
        return catMainId === main.id;
      });
      grouped[main.id] = mainRoots;
    });
    return grouped;
  }, [categoryMains, categoryTree]);

  return (
    <CategoryContext.Provider
      value={{
        categories,
        categoryMains,
        categoryTree,
        categoryTreeByMain,
        loading,
        error,
        refreshCategories,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategory = () => {
  const ctx = useContext(CategoryContext);
  if (!ctx) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return ctx;
};
