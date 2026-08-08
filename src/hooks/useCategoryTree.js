import { useCategory } from '../context/CategoryContext';

/**
 * Custom hook to access category tree & category mains from global CategoryContext.
 * Avoids redundant HTTP requests on component mounts / page transitions.
 */
export const useCategoryTree = () => {
  return useCategory();
};
