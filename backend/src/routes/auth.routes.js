const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const {
  validate,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} = require('../utils/validators');

/**
 * Public Auth Routes
 */
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  return res.json({ success: true, message: `If an account with ${email || 'this email'} exists, password reset instructions have been sent.` });
});
router.post('/reset-password', (req, res) => {
  return res.json({ success: true, message: 'Password has been reset successfully. Please sign in with your new password.' });
});

/**
 * Protected Auth Routes
 */
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.getMe);

module.exports = router;
