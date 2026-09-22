const settingModel = require('../../models/setting.model');
const auditModel = require('../../models/audit.model');
const { sendSuccess } = require('../../utils/response');
const { AppError } = require('../../middleware/errorHandler');

/**
 * Admin Platform Settings Controller
 */

/**
 * Get all platform settings
 * GET /api/v1/admin/platform-settings
 */
const getPlatformSettings = async (req, res, next) => {
  try {
    const settings = await settingModel.getAll();
    return sendSuccess(res, { settings }, 'Platform settings retrieved successfully');
  } catch (err) {
    return next(err);
  }
};

/**
 * Update a platform setting by key
 * PATCH /api/v1/admin/platform-settings/:key
 */
const updatePlatformSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined || value === null) {
      throw new AppError('Setting value is required', 400, 'VALIDATION_ERROR');
    }

    const currentSetting = await settingModel.getByKey(key);
    if (!currentSetting) {
      throw new AppError(`Platform setting '${key}' not found`, 404, 'NOT_FOUND');
    }

    const beforeValue = currentSetting.setting_value;
    await settingModel.updateByKey(key, value, req.user.id);
    const updatedSetting = await settingModel.getByKey(key);

    // Record audit log
    await auditModel.createLog({
      actorId: req.user.id,
      action: 'UPDATE_PLATFORM_SETTING',
      targetType: 'PLATFORM_SETTING',
      targetId: currentSetting.id,
      beforeData: {
        setting_key: key,
        setting_value: beforeValue,
      },
      afterData: {
        setting_key: key,
        setting_value: String(value),
      },
      ipAddress: req.ip,
    });

    return sendSuccess(
      res,
      { setting: updatedSetting },
      `Platform setting '${key}' updated successfully`
    );
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getPlatformSettings,
  updatePlatformSetting,
};
