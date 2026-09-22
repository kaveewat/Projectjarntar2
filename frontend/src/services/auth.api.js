import api from './api';

export const authApi = {
  /**
   * Register a new user
   * @param {{ email: string, password: string, display_name: string, role?: string, phone?: string, line_id?: string }} data
   */
  register: async (data) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  /**
   * Authenticate user with email and password
   * @param {{ email: string, password: string }} data
   */
  login: async (data) => {
    const res = await api.post('/auth/login', data);
    return res.data;
  },

  /**
   * Log out the current user session
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Best-effort logout
    }
  },

  /**
   * Get current authenticated user details
   */
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  /**
   * Update profile fields (display_name, phone, line_id)
   * @param {{ display_name?: string, phone?: string, line_id?: string }} data
   */
  updateProfile: async (data) => {
    const res = await api.patch('/users/me', data);
    return res.data;
  },

  /**
   * Change current user's password
   * @param {{ current_password: string, new_password: string }} data
   */
  changePassword: async (data) => {
    const res = await api.patch('/users/me/password', data);
    return res.data;
  },

  /**
   * Request password reset instructions
   * @param {{ email: string }} data
   */
  forgotPassword: async (data) => {
    const res = await api.post('/auth/forgot-password', data);
    return res.data;
  },

  /**
   * Reset password with token
   * @param {{ token?: string, new_password: string }} data
   */
  resetPassword: async (data) => {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
  },

  /**
   * Get current user's KYC verification status
   */
  getKycStatus: async () => {
    const res = await api.get('/users/kyc');
    return res.data;
  },

  /**
   * Submit KYC verification details
   * @param {FormData|object} payload
   */
  submitKyc: async (payload) => {
    const isFormData = payload instanceof FormData;
    const config = isFormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const res = await api.post('/users/kyc', payload, config);
    return res.data;
  },
};

export default authApi;
