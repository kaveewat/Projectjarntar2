const authService = require('../services/auth.service');
const { sendSuccess, sendCreated } = require('../utils/response');

/**
 * Handle user registration
 */
const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return sendCreated(res, result, 'User registered successfully');
  } catch (err) {
    return next(err);
  }
};

/**
 * Handle user login
 */
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return sendSuccess(res, result, 'Login successful');
  } catch (err) {
    return next(err);
  }
};

/**
 * Handle user logout
 */
const logout = async (req, res, next) => {
  try {
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    return next(err);
  }
};

/**
 * Handle refresh token
 */
const refreshToken = async (req, res, next) => {
  try {
    const result = await authService.refreshToken(req.body.refresh_token);
    return sendSuccess(res, result, 'Token refreshed successfully');
  } catch (err) {
    return next(err);
  }
};

/**
 * Get current authenticated user profile
 */
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    return sendSuccess(res, { user }, 'Current user profile retrieved successfully');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getMe,
};
