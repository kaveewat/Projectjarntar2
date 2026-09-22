import api from './api';

const disputesApi = {
  // 1. Get dispute reasons catalog
  getReasons: () => api.get('/disputes/reasons'),

  // 2. Get my disputes
  getMyDisputes: (params = {}) => api.get('/disputes/me', { params }),

  // 3. Open a new dispute
  openDispute: (data) => api.post('/disputes', data),

  // 4. Get dispute detail with evidence and messages
  getDisputeDetail: (id) => api.get(`/disputes/${id}`),

  // 4.1 Get dispute detail by order ID
  getDisputeByOrderId: (orderId) => api.get(`/disputes/order/${orderId}`),

  // 5. Upload evidence screenshot (multipart/form-data)
  uploadEvidence: (id, formData) =>
    api.post(`/disputes/${id}/evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export default disputesApi;
