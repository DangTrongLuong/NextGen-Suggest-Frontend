import api from './api';

export const searchPopupService = {
  getSearchPopup: async () => {
    const response = await api.get('/search/popup');
    return response.data.data;
  },

  getSuggestions: async (query) => {
    const response = await api.get('/search/suggestions', {
      params: { q: query }
    });
    return response.data.data;
  },

  deleteHistory: async (keyword = null) => {
    const params = keyword ? { keyword } : {};
    const response = await api.delete('/search/history', { params });
    return response.data;
  }
};
