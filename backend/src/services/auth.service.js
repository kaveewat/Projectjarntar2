const bcrypt = require('bcryptjs');
const userModel = require('../models/user.model');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { AppError } = require('../middleware/errorHandler');

const BCRYPT_SALT_ROUNDS = 10;

/**
 * Register a new user
 * @param {object} param0
 */
const register = async ({
  email,
  password,
  display_name,
  role = 'BUYER',
  phone = null,
  line_id = null,
}) => {
  // Check duplicate email
  const existingUser = await userModel.findByEmail(email);
  if (existingUser) {
    throw new AppError(
      'An account with this email address already exists.',
      409,
      'EMAIL_ALREADY_EXISTS',
      [{ field: 'email', message: 'Email is already in use' }]
    );
  }

  // Hash password (bcrypt >= 10 rounds)
  const password_hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // Insert to DB
  const newUserId = await userModel.create({
    email,
    password_hash,
    display_name,
    role,
    phone,
    line_id,
  });

  const user = await userModel.findById(newUserId);

  // Sign tokens
  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    display_name: user.display_name,
  };

  const access_token = signAccessToken(tokenPayload);
  const refresh_token = signRefreshToken(tokenPayload);

  return {
    user,
    access_token,
    refresh_token,
    token: access_token, // alias for backwards compatibility
  };
};

/**
 * User login
 * @param {object} param0
 */
const login = async ({ email, password }) => {
  const user = await userModel.findByEmail(email);
  if (!user) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  // Check account state
  if (user.is_banned) {
    throw new AppError('This account has been permanently banned.', 403, 'ACCOUNT_BANNED');
  }

  if (user.is_suspended) {
    throw new AppError('This account is temporarily suspended.', 403, 'ACCOUNT_SUSPENDED');
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  // Update last login
  await userModel.updateLastLogin(user.id);

  // Generate tokens
  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    display_name: user.display_name,
  };

  const access_token = signAccessToken(tokenPayload);
  const refresh_token = signRefreshToken(tokenPayload);

  // Strip sensitive password hash
  delete user.password_hash;

  return {
    user,
    access_token,
    refresh_token,
    token: access_token,
  };
};

/**
 * Refresh access token
 * @param {string} token
 */
const refreshToken = async (token) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    throw new AppError('Invalid or expired refresh token.', 401, 'INVALID_REFRESH_TOKEN');
  }

  const user = await userModel.findById(decoded.id);
  if (!user || user.is_banned || user.is_suspended) {
    throw new AppError('User account is invalid or suspended.', 401, 'INVALID_USER');
  }

  const newAccessToken = signAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    display_name: user.display_name,
  });

  return { access_token: newAccessToken };
};

/**
 * Get current user profile
 * @param {number} userId
 */
const getMe = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }
  return user;
};

module.exports = {
  register,
  login,
  refreshToken,
  getMe,
};
