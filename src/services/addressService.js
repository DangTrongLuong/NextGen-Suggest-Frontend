import api from './api';

export const addressService = {
  getAddresses: async () => {
    const res = await api.get('/user-addresses');
    return res.data.data;
  },

  getDefaultAddress: async () => {
    const res = await api.get('/user-addresses/default');
    return res.data.data;
  },

  createAddress: async (addressData) => {
    const res = await api.post('/user-addresses', addressData);
    return res.data;
  },

  updateAddress: async (id, addressData) => {
    const res = await api.put(`/user-addresses/${id}`, addressData);
    return res.data;
  },

  deleteAddress: async (id) => {
    const res = await api.delete(`/user-addresses/${id}`);
    return res.data;
  },

  setDefaultAddress: async (id) => {
    const res = await api.put(`/user-addresses/${id}/default`);
    return res.data;
  }
};
