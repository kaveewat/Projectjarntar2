const express = require('express');
const router = express.Router();

const usersController = require('../controllers/users.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { sendSuccess } = require('../utils/response');
const {
  validate,
  updateProfileSchema,
  changePasswordSchema,
} = require('../utils/validators');

/**
 * Protected User Profile Routes
 */
router.get('/me', requireAuth, usersController.getProfile);
router.patch('/me', requireAuth, validate(updateProfileSchema), usersController.updateProfile);
router.patch('/me/password', requireAuth, validate(changePasswordSchema), usersController.changePassword);
router.get('/kyc', requireAuth, usersController.getKycStatus);
router.post('/kyc', requireAuth, usersController.submitKyc);

/**
 * Role-Protected Check Route (Admin only)
 */
router.get('/admin/check', requireAuth, requireRole('ADMIN'), (req, res) => {
  return sendSuccess(res, { authorized: true, role: req.user.role }, 'Admin access confirmed');
});

module.exports = router;
