import api from './api';

const payoutsApi = {
  // 1. Get current user's payouts
  getMyPayouts: (params = {}) => api.get('/payouts/me', { params }),
};

export default payoutsApi;
