const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Sign JWT Access Token (default 7 days)
 * @param {object} payload
 * @returns {string}
 */
const signAccessToken = (payload) => {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn || '7d',
  });
};

/**
 * Sign JWT Refresh Token (default 30 days)
 * @param {object} payload
 * @returns {string}
 */
const signRefreshToken = (payload) => {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn || '30d',
  });
};

/**
 * Verify JWT Access Token
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, env.jwt.secret);
};

/**
 * Verify JWT Refresh Token
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.jwt.refreshSecret);
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
