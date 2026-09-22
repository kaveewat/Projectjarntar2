const playerModel = require('../../models/player.model');
const auditModel = require('../../models/audit.model');
const { sendSuccess, sendPaginated } = require('../../utils/response');
const { AppError } = require('../../middleware/errorHandler');

/**
  * Admin Player Card Management Controller
  */

// GET /api/v1/admin/players
const getAllPlayers = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { name, tier, position, is_active, game_id } = req.query;

    const { players, total, stats } = await playerModel.findAllAdmin({
      name,
      tier,
      position,
      is_active,
      game_id,
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      message: 'Player cards catalog retrieved for admin',
      data: players,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats,
    });
  } catch (err) {
    return next(err);
  }
};

// GET /api/v1/admin/players/metadata
const getMetadata = async (_req, res, next) => {
  try {
    const [tiers, positions, games] = await Promise.all([
      playerModel.getTiers(),
      playerModel.getPositions(),
      playerModel.getGames(),
    ]);

    return sendSuccess(res, { tiers, positions, games }, 'Card metadata retrieved');
  } catch (err) {
    return next(err);
  }
};

// GET /api/v1/admin/players/:id
const getPlayerDetail = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const player = await playerModel.findById(id, true);

    if (!player) {
      throw new AppError(`Player card with ID ${id} not found`, 404, 'PLAYER_NOT_FOUND');
    }

    return sendSuccess(res, { player }, 'Player card detail retrieved');
  } catch (err) {
    return next(err);
  }
};

// POST /api/v1/admin/players
const createPlayer = async (req, res, next) => {
  try {
    const {
      player_name,
      card_tier_id,
      position_id,
      overall_rating,
      base_value,
      nationality,
      club,
      season,
      game_id,
      is_active,
    } = req.body;

    if (!player_name || !card_tier_id || !position_id || overall_rating === undefined) {
      throw new AppError('Player name, tier, position, and overall rating are required', 400, 'VALIDATION_ERROR');
    }

    const player = await playerModel.createPlayer({
      player_name,
      card_tier_id,
      position_id,
      overall_rating,
      base_value,
      nationality,
      club,
      season,
      game_id,
      is_active: is_active !== undefined ? is_active : 1,
    });

    // Record audit log
    await auditModel.createLog({
      userId: req.user?.id || 1,
      action: 'ADMIN_PLAYER_CREATE',
      resourceType: 'PLAYER_CARD',
      resourceId: player.id,
      details: {
        player_name: player.player_name,
        tier: player.tier_name,
        ovr: player.overall_rating,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return sendSuccess(res, { player }, 'Player card created successfully', 201);
  } catch (err) {
    return next(err);
  }
};

// PATCH /api/v1/admin/players/:id
const updatePlayer = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await playerModel.findById(id, true);

    if (!existing) {
      throw new AppError(`Player card with ID ${id} not found`, 404, 'PLAYER_NOT_FOUND');
    }

    const updated = await playerModel.updatePlayer(id, req.body);

    // Record audit log
    await auditModel.createLog({
      userId: req.user?.id || 1,
      action: 'ADMIN_PLAYER_UPDATE',
      resourceType: 'PLAYER_CARD',
      resourceId: id,
      details: {
        changes: req.body,
        previous_name: existing.player_name,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return sendSuccess(res, { player: updated }, 'Player card updated successfully');
  } catch (err) {
    return next(err);
  }
};

// PATCH /api/v1/admin/players/:id/status
const togglePlayerStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { is_active } = req.body;

    const existing = await playerModel.findById(id, true);
    if (!existing) {
      throw new AppError(`Player card with ID ${id} not found`, 404, 'PLAYER_NOT_FOUND');
    }

    const targetStatus = is_active !== undefined ? Boolean(is_active) : !existing.is_active;
    const updated = await playerModel.togglePlayerStatus(id, targetStatus);

    await auditModel.createLog({
      userId: req.user?.id || 1,
      action: 'ADMIN_PLAYER_STATUS_TOGGLE',
      resourceType: 'PLAYER_CARD',
      resourceId: id,
      details: {
        player_name: existing.player_name,
        is_active: targetStatus ? 1 : 0,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return sendSuccess(
      res,
      { player: updated },
      `Player card ${targetStatus ? 'activated' : 'deactivated'} successfully`
    );
  } catch (err) {
    return next(err);
  }
};

// POST /api/v1/admin/players/import
const bulkImportPlayers = async (req, res, next) => {
  try {
    const { players } = req.body;

    if (!Array.isArray(players) || players.length === 0) {
      throw new AppError('Players list must be a non-empty array', 400, 'VALIDATION_ERROR');
    }

    const result = await playerModel.bulkCreatePlayers(players);

    await auditModel.createLog({
      userId: req.user?.id || 1,
      action: 'ADMIN_PLAYER_BULK_IMPORT',
      resourceType: 'PLAYER_CARD',
      resourceId: null,
      details: {
        importedCount: result.insertedCount,
        errorsCount: result.errors.length,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return sendSuccess(
      res,
      result,
      `Successfully imported ${result.insertedCount} player cards`
    );
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getAllPlayers,
  getMetadata,
  getPlayerDetail,
  createPlayer,
  updatePlayer,
  togglePlayerStatus,
  bulkImportPlayers,
};
