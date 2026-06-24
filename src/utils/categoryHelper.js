/**
 * Builds a hierarchical category tree from a flat list of categories.
 * Sorts all levels by sortOrder/displayOrder ascending.
 * Filters out inactive categories.
 *
 * Supports both camelCase and snake_case properties defensively.
 *
 * @param {Array} categories - The flat array of categories from the API.
 * @returns {Array} The constructed category tree.
 */
export const buildCategoryTree = (categories) => {
  if (!Array.isArray(categories)) return [];

  // Defensive helpers for key extraction
  const getSortOrder = (c) => {
    if (c.sortOrder !== undefined && c.sortOrder !== null) return Number(c.sortOrder);
    if (c.displayOrder !== undefined && c.displayOrder !== null) return Number(c.displayOrder);
    if (c.display_order !== undefined && c.display_order !== null) return Number(c.display_order);
    return 0;
  };

  const getParentId = (c) => c.parentId !== undefined ? c.parentId : c.parent_id;

  const getIsActive = (c) => {
    if (c.isActive !== undefined && c.isActive !== null) return !!c.isActive;
    if (c.is_active !== undefined && c.is_active !== null) return !!c.is_active;
    return true;
  };

  // Filter and sort active categories
  const activeSorted = categories
    .filter(c => getIsActive(c))
    .sort((a, b) => getSortOrder(a) - getSortOrder(b));

  const map = {};
  const tree = [];

  // Initialize tree nodes
  activeSorted.forEach(cat => {
    map[cat.id] = { ...cat, children: [] };
  });

  // Link children to parents or place at root level
  activeSorted.forEach(cat => {
    const node = map[cat.id];
    const parentId = getParentId(cat);
    
    if (parentId && map[parentId]) {
      map[parentId].children.push(node);
    } else {
      tree.push(node);
    }
  });

  return tree;
};
