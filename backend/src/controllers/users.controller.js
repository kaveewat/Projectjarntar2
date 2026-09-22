const bcrypt = require('bcryptjs');
const userModel = require('../models/user.model');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../middleware/errorHandler');

const BCRYPT_SALT_ROUNDS = 10;

/**
 * Get current user profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.id);
    return sendSuccess(res, { user }, 'User profile retrieved successfully');
  } catch (err) {
    return next(err);
  }
};

/**
 * Update current user profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { display_name, phone, line_id } = req.body;
    await userModel.updateById(req.user.id, { display_name, phone, line_id });
    const updatedUser = await userModel.findById(req.user.id);
    return sendSuccess(res, { user: updatedUser }, 'User profile updated successfully');
  } catch (err) {
    return next(err);
  }
};

/**
 * Change current user password
 */
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    const userWithPassword = await userModel.findByIdWithPassword(req.user.id);
    if (!userWithPassword) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    const isMatch = await bcrypt.compare(current_password, userWithPassword.password_hash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect.', 400, 'INVALID_CURRENT_PASSWORD');
    }

    const newPasswordHash = await bcrypt.hash(new_password, BCRYPT_SALT_ROUNDS);
    await userModel.updatePassword(req.user.id, newPasswordHash);

    return sendSuccess(res, null, 'Password changed successfully');
  } catch (err) {
    return next(err);
  }
};

/**
 * Get current user KYC status
 */
const getKycStatus = async (req, res, next) => {
  try {
    const kycModel = require('../models/kyc.model');
    const kyc = await kycModel.findByUserId(req.user.id);
    return sendSuccess(res, { kyc }, 'KYC status retrieved successfully');
  } catch (err) {
    return next(err);
  }
};

/**
 * Submit KYC verification
 */
const submitKyc = async (req, res, next) => {
  try {
    const kycModel = require('../models/kyc.model');
    const { real_name, id_card_number } = req.body;

    if (!real_name || !id_card_number) {
      throw new AppError('Real name and ID card number are required.', 400, 'VALIDATION_ERROR');
    }

    // Determine image URLs from uploaded files or body fields
    let idCardUrl = req.body.id_card_image_url;
    let selfieUrl = req.body.selfie_image_url;

    if (req.files) {
      if (req.files['id_card_image'] && req.files['id_card_image'][0]) {
        idCardUrl = `/uploads/${req.files['id_card_image'][0].filename}`;
      }
      if (req.files['selfie_image'] && req.files['selfie_image'][0]) {
        selfieUrl = `/uploads/${req.files['selfie_image'][0].filename}`;
      }
    }

    if (!idCardUrl) {
      idCardUrl = req.body.id_card_image || '/uploads/sample_id_card.png';
    }
    if (!selfieUrl) {
      selfieUrl = req.body.selfie_image || '/uploads/sample_selfie.png';
    }

    await kycModel.submitKyc({
      userId: req.user.id,
      realName: real_name,
      idCardNumber: id_card_number,
      idCardImageUrl: idCardUrl,
      selfieImageUrl: selfieUrl,
    });

    const updatedKyc = await kycModel.findByUserId(req.user.id);
    return sendSuccess(res, { kyc: updatedKyc }, 'KYC documents submitted successfully for review');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getKycStatus,
  submitKyc,
};
