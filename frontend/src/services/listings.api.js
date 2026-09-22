import api from './api';

/**
 * Listings API Service
 * Handles marketplace browse, listing details, and seller listings
 */
const listingsApi = {
  /**
   * Browse active marketplace listings with search, filters, and pagination
   * @param {Object} params
   * @param {string} [params.player_name]
   * @param {number} [params.min_price]
   * @param {number} [params.max_price]
   * @param {number} [params.min_strength]
   * @param {number} [params.max_strength]
   * @param {string} [params.badge] - 'GREAT_VALUE' | 'FAIR_PRICE' | 'OVERPRICED'
   * @param {number} [params.platform_id]
   * @param {string} [params.sort] - 'newest' | 'price_asc' | 'price_desc' | 'strength_desc'
   * @param {number} [params.page]
   * @param {number} [params.limit]
   */
  getListings: async (params = {}) => {
    // Clean up undefined or empty string parameters
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        cleanParams[key] = params[key];
      }
    });

    const response = await api.get('/listings', { params: cleanParams });
    return response.data;
  },

  /**
   * Get single listing details with full squad player list and valuation info
   * @param {number|string} id
   */
  getListingById: async (id) => {
    const response = await api.get(`/listings/${id}`);
    return response.data;
  },

  /**
   * Get listings created by current seller
   */
  getMyListings: async (params = {}) => {
    const response = await api.get('/listings/me', { params });
    return response.data;
  },

  /**
   * Create a new account listing from a completed squad scan
   * @param {Object} listingData
   * @param {number} listingData.squad_scan_id
   * @param {number} listingData.platform_id
   * @param {string} listingData.title
   * @param {number} listingData.asking_price
   * @param {string} [listingData.description]
   */
  createListing: async (listingData) => {
    const config = listingData instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const response = await api.post('/listings', listingData, config);
    return response.data;
  },

  /**
   * Cancel an active listing by seller
   * @param {number|string} id
   */
  cancelListing: async (id) => {
    const response = await api.delete(`/listings/${id}`);
    return response.data;
  },

  /**
   * Update listing details (e.g. asking_price, description)
   * @param {number|string} id
   * @param {Object} data
   */
  updateListing: async (id, data) => {
    const response = await api.patch(`/listings/${id}`, data);
    return response.data;
  },

  /**
   * Get platform list
   */
  getPlatforms: async () => {
    try {
      const response = await api.get('/players/meta/platforms');
      return response.data?.data || [];
    } catch {
      return [
        { id: 1, name: 'iOS', slug: 'ios' },
        { id: 2, name: 'Android', slug: 'android' },
        { id: 3, name: 'PlayStation', slug: 'playstation' },
        { id: 4, name: 'PC', slug: 'pc' },
      ];
    }
  },
};

export default listingsApi;
