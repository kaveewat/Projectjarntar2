import api from './api';

const adminApi = {
  // 1. Dashboard Overview & Priority Queue
  getDashboard: () => api.get('/admin/dashboard'),
  getPendingActions: () => api.get('/admin/dashboard/pending-actions'),

  // 2. Orders & Slip Verification
  getOrders: (params = {}) => api.get('/admin/orders', { params }),
  getOrderDetail: (id) => api.get(`/admin/orders/${id}`),
  approvePayment: (id) => api.post(`/admin/orders/${id}/payment/approve`),
  rejectPayment: (id, reason) => api.post(`/admin/orders/${id}/payment/reject`, { reason }),

  // 3. Escrow Operations
  getEscrowOverview: () => api.get('/admin/escrow'),

  // 4. Dispute Resolution & Arbitration
  getDisputes: (params = {}) => api.get('/admin/disputes', { params }),
  getDisputeDetail: (id) => api.get(`/admin/disputes/${id}`),
  assignDispute: (id) => api.post(`/admin/disputes/${id}/assign`),
  addDisputeComment: (id, comment) => api.post(`/admin/disputes/${id}/comments`, { comment }),
  resolveForBuyer: (id, resolution_note) =>
    api.post(`/admin/disputes/${id}/resolve/buyer`, { resolution_note }),
  resolveForSeller: (id, resolution_note) =>
    api.post(`/admin/disputes/${id}/resolve/seller`, { resolution_note }),

  // 5. KYC Review & Verification
  getKycList: (params = {}) => api.get('/admin/kyc', { params }),
  getKycDetail: (id) => api.get(`/admin/kyc/${id}`),
  approveKyc: (id) => api.post(`/admin/kyc/${id}/approve`),
  rejectKyc: (id, reason) => api.post(`/admin/kyc/${id}/reject`, { reason }),

  // 6. User Management Directory
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  getUserDetail: (id) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id, data) => api.patch(`/admin/users/${id}/status`, data),

  // 7. Seller Payouts Management
  getPayouts: (params = {}) => api.get('/admin/payouts', { params }),
  updatePayoutStatus: (id, data) => api.patch(`/admin/payouts/${id}`, data),

  // 8. Platform Analytics & GMV
  getSalesAnalytics: () => api.get('/admin/analytics/sales'),
  getListingsAnalytics: () => api.get('/admin/analytics/listings'),
  getDisputesAnalytics: () => api.get('/admin/analytics/disputes'),
  getAiAccuracyAnalytics: () => api.get('/admin/analytics/ai-accuracy'),

  // 9. Audit Logs & Handover Trail
  getAuditLogs: (params = {}) => api.get('/admin/audit-logs', { params }),
  getAuditLogDetail: (id) => api.get(`/admin/audit-logs/${id}`),
  getHandoverAccessLogs: (params = {}) => api.get('/admin/handover-access-logs', { params }),

  // 10. Platform Settings & Configurations
  getPlatformSettings: () => api.get('/admin/platform-settings'),
  updatePlatformSetting: (key, value) =>
    api.patch(`/admin/platform-settings/${encodeURIComponent(key)}`, { value }),

  // 11. Listing Moderation
  getListings: (params = {}) => api.get('/admin/listings', { params }),
  suspendListing: (id, reason) => api.patch(`/admin/listings/${id}/suspend`, { reason }),
  restoreListing: (id) => api.patch(`/admin/listings/${id}/restore`),
  deleteListing: (id) => api.delete(`/admin/listings/${id}`),

  // 12. Player Cards Catalog Master
  getPlayers: (params = {}) => api.get('/admin/players', { params }),
  getPlayerMetadata: () => api.get('/admin/players/metadata'),
  getPlayerDetail: (id) => api.get(`/admin/players/${id}`),
  createPlayer: (data) => api.post('/admin/players', data),
  updatePlayer: (id, data) => api.patch(`/admin/players/${id}`, data),
  togglePlayerStatus: (id, is_active) => api.patch(`/admin/players/${id}/status`, { is_active }),
  bulkImportPlayers: (players) => api.post('/admin/players/import', { players }),
};

export default adminApi;
