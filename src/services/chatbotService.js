import api from './api';

export const chatbotService = {
  sendChatMessage: async (messages) => {
    try {
      const res = await api.post('/chat', { messages });
      return res.data.data;
    } catch (error) {
      console.error('Failed to send chat message:', error);
      throw error;
    }
  }
};
