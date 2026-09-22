import api from './api';

const ordersApi = {
  // 1. Create order (Buy listing with Escrow)
  createOrder: (data) => api.post('/orders', data),

  // 2. Get my orders (buyer, seller, or both) with status filter
  getMyOrders: (params = {}) => api.get('/orders/me', { params }),

  // 3. Get order detail with status logs
  getOrderDetail: (id) => api.get(`/orders/${id}`),

  // 4. Cancel order (before payment)
  cancelOrder: (id, reason) => api.post(`/orders/${id}/cancel`, { reason }),

  // 5. Submit payment proof (multipart/form-data)
  submitPayment: (id, formData) =>
    api.post(`/orders/${id}/payment`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // 6. Get payment details
  getPayment: (id) => api.get(`/orders/${id}/payment`),
};

export default ordersApi;
