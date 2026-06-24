import { useState, useEffect, useMemo } from 'react';
import { categoryService } from '../services/categoryService';
import { categoryMainService } from '../services/categoryMainService';
import { buildCategoryTree } from '../utils/categoryHelper';

/**
 * Custom hook to fetch all category mains and categories,
 * compile them into a memoized hierarchical tree structure,
 * and group the trees by categoryMainId.
 */
export const useCategoryTree = () => {
  const [categories, setCategories] = useState([]);
  const [categoryMains, setCategoryMains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all categories and category mains concurrently
        const [catsData, mainsData] = await Promise.all([
          categoryService.getAll(),
          categoryMainService.getAll(),
        ]);

        if (isMounted) {
          setCategories(catsData || []);
          setCategoryMains(mainsData || []);
        }
      } catch (err) {
        console.error('Error fetching categories in useCategoryTree:', err);
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute general tree of all categories
  const categoryTree = useMemo(() => {
    return buildCategoryTree(categories);
  }, [categories]);

  // Group root categories under their corresponding categoryMainId
  const categoryTreeByMain = useMemo(() => {
    const grouped = {};
    
    categoryMains.forEach((main) => {
      // Find all root categories that belong to this categoryMain
      const mainRoots = categoryTree.filter((cat) => {
        const catMainId = cat.categoryMainId !== undefined ? cat.categoryMainId : cat.category_main_id;
        return catMainId === main.id;
      });
      
      grouped[main.id] = mainRoots;
    });
    
    return grouped;
  }, [categoryMains, categoryTree]);

  return {
    categories,
    categoryMains,
    categoryTree,
    categoryTreeByMain,
    loading,
    error,
  };
};
