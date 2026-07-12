import api from './api';

export const recommendationService = {
  getHomepageRecommendations: async () => {
    try {
      let sessionId = localStorage.getItem('nivora_session_id');
      if (!sessionId) {
        sessionId = 'session_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
        localStorage.setItem('nivora_session_id', sessionId);
      }

      let guestViewedIds = [];
      try {
        const stored = localStorage.getItem('nivora_guest_viewed_ids');
        if (stored) {
          guestViewedIds = JSON.parse(stored);
        }
      } catch (e) {
        console.error('Failed to parse guest viewed IDs', e);
      }

      const params = {
        sessionId,
      };

      if (guestViewedIds.length > 0) {
        params.guestViewedIds = guestViewedIds.join(',');
      }

      const res = await api.get('/recommendations/homepage', { params });
      return res.data.data;
    } catch (error) {
      console.error('Failed to fetch homepage recommendations:', error);
      return null;
    }
  },

  getRecommendationsByLocation: async (location, limit = 8) => {
    try {
      const res = await api.get('/recommendations/location', {
        params: { location, limit }
      });
      return res.data.data;
    } catch (error) {
      console.error(`Failed to fetch recommendations for location ${location}:`, error);
      return [];
    }
  },

  getLocationBasedRecommendations: async (limit = 8) => {
    try {
      const res = await api.get('/recommendations/location-based', {
        params: { limit }
      });
      return res.data.data;
    } catch (error) {
      console.error('Failed to fetch personalized location-based recommendations:', error);
      return [];
    }
  },

  getQuerySuggestions: async (user) => {
    const todayStr = new Date().toISOString().split('T')[0]; // e.g. "2026-07-07"
    
    // 1. Chế độ User đã đăng nhập
    if (user) {
      const cachedDate = localStorage.getItem('suggestion_date_v3');
      const cachedList = localStorage.getItem('suggestions_v3');
      
      if (cachedDate === todayStr && cachedList) {
        try {
          return JSON.parse(cachedList);
        } catch (e) {
          console.error("Failed to parse cached user suggestions", e);
        }
      }
      
      // Thử gọi API lấy danh mục thực tế từ Database để sinh gợi ý động
      try {
        const catRes = await api.get('/categories');
        const categories = catRes.data?.data || [];
        if (categories.length > 0) {
          const mapped = categories.map(cat => ({
            title: cat.name,
            query: cat.name
          }));
          const count = Math.min(mapped.length, 6 + Math.floor(Math.random() * 3));
          const shuffled = [...mapped].sort(() => 0.5 - Math.random()).slice(0, count);
          if (shuffled.length > 0) {
            localStorage.setItem('suggestion_date_v3', todayStr);
            localStorage.setItem('suggestions_v3', JSON.stringify(shuffled));
            return shuffled;
          }
        }
      } catch (err) {
        console.error("Failed to load categories dynamically for user, falling back to static pool", err);
      }
      
      // Tập mẫu dữ liệu gợi ý cho người dùng đã đăng nhập dựa trên các sản phẩm có thực trong DB
      const userSuggestionsPool = [
        { title: "Áo giữ nhiệt", query: "Áo giữ nhiệt", thumbnail: "" },
        { title: "Thảm trải sàn", query: "Thảm trải sàn", thumbnail: "" },
        { title: "Quần Jeans", query: "Quần Jeans", thumbnail: "" },
        { title: "Vỏ gối trang trí", query: "Vỏ gối trang trí", thumbnail: "" },
        { title: "Chăn sofa", query: "Chăn sofa", thumbnail: "" },
        { title: "Giỏ đựng đồ", query: "Giỏ đựng đồ", thumbnail: "" },
        { title: "Áo sơ mi nam", query: "Áo sơ mi nam", thumbnail: "" },
        { title: "Áo nỉ trẻ em", query: "Áo nỉ trẻ em", thumbnail: "" },
        { title: "Chậu cây cảnh", query: "Chậu cây cảnh", thumbnail: "" },
        { title: "Thắt lưng da", query: "Thắt lưng da", thumbnail: "" }
      ];
      
      // Chọn ngẫu nhiên 6–8 query cho ngày hôm đó
      const count = 6 + Math.floor(Math.random() * 3); // 6, 7 hoặc 8
      const shuffled = [...userSuggestionsPool].sort(() => 0.5 - Math.random()).slice(0, count);
      
      localStorage.setItem('suggestion_date_v3', todayStr);
      localStorage.setItem('suggestions_v3', JSON.stringify(shuffled));
      
      return shuffled;
    }
    
    // 2. Chế độ Guest chưa đăng nhập
    else {
      const cachedDate = localStorage.getItem('aiSuggestionDate_v3');
      const cachedList = localStorage.getItem('aiSuggestionList_v3');
      
      if (cachedDate === todayStr && cachedList) {
        try {
          return JSON.parse(cachedList);
        } catch (e) {
          console.error("Failed to parse cached guest suggestions", e);
        }
      }
      
      // Thử gọi API lấy danh mục thực tế từ Database để sinh gợi ý động
      try {
        const catRes = await api.get('/categories');
        const categories = catRes.data?.data || [];
        if (categories.length > 0) {
          const mapped = categories.map(cat => ({
            title: cat.name,
            query: cat.name
          }));
          const count = Math.min(mapped.length, 6 + Math.floor(Math.random() * 3));
          const shuffled = [...mapped].sort(() => 0.5 - Math.random()).slice(0, count);
          if (shuffled.length > 0) {
            localStorage.setItem('aiSuggestionDate_v3', todayStr);
            localStorage.setItem('aiSuggestionList_v3', JSON.stringify(shuffled));
            return shuffled;
          }
        }
      } catch (err) {
        console.error("Failed to load categories dynamically for guest, falling back to static pool", err);
      }
      
      // Danh sách query phổ biến có thực trong cơ sở dữ liệu local
      const guestPool = [
        { title: "Áo giữ nhiệt", query: "Áo giữ nhiệt", thumbnail: "" },
        { title: "Thảm trải sàn", query: "Thảm trải sàn", thumbnail: "" },
        { title: "Quần Jeans", query: "Quần Jeans", thumbnail: "" },
        { title: "Vỏ gối trang trí", query: "Vỏ gối trang trí", thumbnail: "" },
        { title: "Chăn sofa", query: "Chăn sofa", thumbnail: "" },
        { title: "Giỏ đựng đồ", query: "Giỏ đựng đồ", thumbnail: "" },
        { title: "Áo sơ mi nam", query: "Áo sơ mi nam", thumbnail: "" },
        { title: "Áo nỉ trẻ em", query: "Áo nỉ trẻ em", thumbnail: "" },
        { title: "Chậu cây cảnh", query: "Chậu cây cảnh", thumbnail: "" },
        { title: "Thắt lưng da", query: "Thắt lưng da", thumbnail: "" },
        { title: "Móc treo tường", query: "Móc treo tường", thumbnail: "" },
        { title: "Bàn chải", query: "Bàn chải", thumbnail: "" },
        { title: "Khay gỗ", query: "Khay gỗ", thumbnail: "" },
        { title: "Quần shorts nam", query: "Quần shorts nam", thumbnail: "" },
        { title: "Áo phông nam", query: "Áo phông nam", thumbnail: "" }
      ];
      
      const count = 6 + Math.floor(Math.random() * 3); // 6, 7 hoặc 8
      const shuffled = [...guestPool].sort(() => 0.5 - Math.random()).slice(0, count);
      
      localStorage.setItem('aiSuggestionDate_v3', todayStr);
      localStorage.setItem('aiSuggestionList_v3', JSON.stringify(shuffled));
      
      return shuffled;
    }
  }
};
