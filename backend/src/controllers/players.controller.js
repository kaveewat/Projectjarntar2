const playerModel = require('../models/player.model');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../middleware/errorHandler');

/**
 * Browse player catalog with filters & pagination
 * GET /api/v1/players
 */
const browsePlayers = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { name, tier, position, game_id, sort } = req.query;

    const { players, total } = await playerModel.findAll({
      name,
      tier,
      position,
      game_id,
      sort,
      limit,
      offset,
    });

    return sendPaginated(res, players, page, limit, total, 'Players catalog retrieved');
  } catch (err) {
    return next(err);
  }
};

/**
 * Get player card detail by ID
 * GET /api/v1/players/:id
 */
const getPlayerDetail = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const player = await playerModel.findById(id);

    if (!player) {
      throw new AppError(`Player card with ID ${id} not found.`, 404, 'PLAYER_NOT_FOUND');
    }

    return sendSuccess(res, { player }, 'Player card retrieved successfully');
  } catch (err) {
    return next(err);
  }
};

/**
 * List card tiers
 * GET /api/v1/players/tiers
 */
const getTiers = async (_req, res, next) => {
  try {
    const tiers = await playerModel.getTiers();
    return sendSuccess(res, { tiers }, 'Card tiers retrieved');
  } catch (err) {
    return next(err);
  }
};

/**
 * List positions
 * GET /api/v1/players/positions
 */
const getPositions = async (_req, res, next) => {
  try {
    const positions = await playerModel.getPositions();
    return sendSuccess(res, { positions }, 'Positions retrieved');
  } catch (err) {
    return next(err);
  }
};

/**
 * List games
 * GET /api/v1/players/games
 */
const getGames = async (_req, res, next) => {
  try {
    const games = await playerModel.getGames();
    return sendSuccess(res, { games }, 'Games retrieved');
  } catch (err) {
    return next(err);
  }
};

/**
 * Trigger manual sync for latest player cards
 * POST /api/v1/players/sync-latest
 */
const syncLatestCards = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 100;
    const { syncLatestPlayers } = require('../services/player-sync.service');
    const result = await syncLatestPlayers({ limit });
    return sendSuccess(res, result, 'Player cards sync completed');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  browsePlayers,
  getPlayerDetail,
  getTiers,
  getPositions,
  getGames,
  syncLatestCards,
};

