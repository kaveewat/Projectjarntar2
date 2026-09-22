import api from './api';

const handoverApi = {
  // 1. Get handover room status
  getRoomStatus: (orderId) => api.get(`/handover/${orderId}`),

  // 2. Seller submits confidential Konami credentials
  submitAccountInfo: (orderId, data) => api.post(`/handover/${orderId}/submit`, data),

  // 3. Buyer decrypts and views Konami credentials
  getAccountInfo: (orderId) => api.get(`/handover/${orderId}/info`),

  // 4. Buyer confirms successful account receipt (releases escrow)
  confirmReceipt: (orderId) => api.post(`/handover/${orderId}/confirm`),

  // 5. Buyer reports problem / requests dispute
  reportProblem: (orderId, data) => api.post(`/handover/${orderId}/problem`, data),
};

export default handoverApi;
