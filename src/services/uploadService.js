import api from './api';

export const uploadService = {
  uploadImage: async (file, folder = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/upload/image?folder=${folder}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  deleteImage: async (publicId) => {
    await api.delete('/upload/image', { params: { publicId } });
  },
};
