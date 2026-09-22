const userModel = require('../../models/user.model');
const { sendSuccess, sendPaginated } = require('../../utils/response');
const { AppError } = require('../../middleware/errorHandler');

/**
 * Admin Users Management Controller
 */

// GET /api/v1/admin/users
const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const role = req.query.role || null;
    const search = req.query.search || null;

    const { users, total } = await userModel.findAll({ role, search, limit, offset });
    return sendPaginated(res, users, page, limit, total, 'User directory retrieved');
  } catch (err) {
    return next(err);
  }
};

// GET /api/v1/admin/users/:id
const getUserDetail = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const user = await userModel.findById(id);
    if (!user) {
      throw new AppError(`User with ID ${id} not found`, 404, 'NOT_FOUND');
    }
    return sendSuccess(res, { user }, 'User details retrieved');
  } catch (err) {
    return next(err);
  }
};

// PATCH /api/v1/admin/users/:id/status
const updateUserStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { is_suspended, is_banned, role, is_verified } = req.body;
    await userModel.updateStatus(id, { is_suspended, is_banned, role, is_verified });
    const updated = await userModel.findById(id);
    return sendSuccess(res, { user: updated }, 'User status updated successfully');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getAllUsers,
  getUserDetail,
  updateUserStatus,
};
