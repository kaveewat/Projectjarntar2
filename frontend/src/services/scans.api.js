import api from './api';

/**
 * Squad Scans API Service
 * Handles AI squad screenshot uploads, scan polling, confirmations, and valuation
 */
const scansApi = {
  /**
   * Submit squad screenshots for AI Gemini Vision OCR processing
   * @param {FormData} formData - Multipart form data containing 'images' and optional 'game_id'
   */
  submitScan: async (formData) => {
    const response = await api.post('/scans', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get scan status and detected players by scan ID (Used for polling)
   * @param {number|string} id - Scan ID
   */
  getScanResult: async (id) => {
    const response = await api.get(`/scans/${id}`);
    return response.data;
  },

  /**
   * Seller confirms and/or edits detected players
   * @param {number|string} id - Scan ID
   * @param {Object} data - { confirmed_players: Array<{ id, player_name, overall_rating, position_code }>, team_strength }
   */
  confirmScan: async (id, data) => {
    const response = await api.patch(`/scans/${id}/confirm`, data);
    return response.data;
  },

  /**
   * Get Valuation calculation & Fair Price range by scan ID
   * @param {number|string} id - Scan ID
   */
  getValuation: async (id) => {
    const response = await api.get(`/scans/${id}/valuation`);
    return response.data;
  },

  /**
   * Get current seller's squad scan history
   */
  getMyScans: async () => {
    const response = await api.get('/scans/me');
    return response.data;
  },
};

export default scansApi;
