import api from './api';

/**
 * Dashboard API Service
 * Handles user dashboard summary and financial metrics
 */
const dashboardApi = {
  /**
   * Get Seller Dashboard metrics, pending handovers, active listings & earnings
   */
  getSellerDashboard: async () => {
    const response = await api.get('/dashboard/seller');
    return response.data;
  },

  /**
   * Get Buyer Dashboard metrics, active orders & completed purchases
   */
  getBuyerDashboard: async () => {
    const response = await api.get('/dashboard/buyer');
    return response.data;
  },
};

export default dashboardApi;
