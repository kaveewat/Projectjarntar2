const scanModel = require('../models/scan.model');
const valuationModel = require('../models/valuation.model');
const valuationService = require('../services/valuation.service');
const aiVisionService = require('../services/ai-vision.service');
const { sendSuccess, sendCreated, sendError, sendPaginated } = require('../utils/response');
const { AppError } = require('../middleware/errorHandler');

/**
 * Submit squad screenshot(s) for AI processing
 * POST /api/v1/scans
 */
const submitScan = async (req, res, next) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      throw new AppError('Please upload at least one squad screenshot.', 400, 'NO_FILES_UPLOADED');
    }

    const gameId = Number(req.body.game_id) || 1;
    const imageUrls = files.map((f) => `/uploads/${f.filename}`);

    // Create scan in PROCESSING state
    const scanId = await scanModel.createScan({
      user_id: req.user.id,
      game_id: gameId,
      image_urls: imageUrls,
      status: 'PROCESSING',
      ai_model: process.env.AI_VISION_MODEL || 'gemini-2.0-flash',
    });

    // Run AI processing asynchronously or await brief initial run
    aiVisionService.processSquadImages(scanId, files, gameId).catch((err) => {
      console.error(`[Background AI Error] Scan ID ${scanId}:`, err);
    });

    return sendCreated(
      res,
      {
        scan_id: scanId,
        status: 'PROCESSING',
        image_count: files.length,
      },
      'Squad scan submitted successfully and is being processed.'
    );
  } catch (err) {
    // If error occurred before processing started, clean up temp files
    if (req.files) {
      await aiVisionService.cleanupFiles(req.files);
    }
    return next(err);
  }
};

/**
 * Get scan details, detected players, and current status
 * GET /api/v1/scans/:id
 */
const getScanResult = async (req, res, next) => {
  try {
    const scanId = Number(req.params.id);
    const scan = await scanModel.getScanById(scanId);

    if (!scan) {
      throw new AppError(`Squad scan with ID ${scanId} not found.`, 404, 'SCAN_NOT_FOUND');
    }

    // Ownership check (only owner or ADMIN/MODERATOR can view)
    if (scan.user_id !== req.user.id && !['ADMIN', 'MODERATOR'].includes(req.user.role)) {
      throw new AppError('You do not have permission to view this scan.', 403, 'FORBIDDEN');
    }

    const players = await scanModel.getScanPlayers(scanId);
    const valuation = await valuationModel.getByScanId(scanId);

    return sendSuccess(
      res,
      {
        scan,
        players,
        valuation,
        team_strength: valuation?.factors_used?.team_strength || null,
      },
      'Squad scan retrieved successfully'
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * Confirm/correct detected players
 * PATCH /api/v1/scans/:id/confirm
 */
const confirmScan = async (req, res, next) => {
  try {
    const scanId = Number(req.params.id);
    const scan = await scanModel.getScanById(scanId);

    if (!scan) {
      throw new AppError(`Squad scan with ID ${scanId} not found.`, 404, 'SCAN_NOT_FOUND');
    }

    if (scan.user_id !== req.user.id && !['ADMIN', 'MODERATOR'].includes(req.user.role)) {
      throw new AppError('You do not have permission to modify this scan.', 403, 'FORBIDDEN');
    }

    const { confirmed_players = [], team_strength } = req.body;

    // Update confirmed players
    if (confirmed_players.length > 0) {
      await scanModel.confirmScanPlayers(scanId, confirmed_players);
    }

    // Fetch updated players
    const updatedPlayers = await scanModel.getScanPlayers(scanId);
    const effectiveStrength = team_strength || scan.ai_raw_response?.team_strength || 3050;

    // Recalculate valuation
    const valuation = valuationService.calculateFairPrice({
      teamStrength: effectiveStrength,
      playerCards: updatedPlayers.filter((p) => p.is_confirmed),
    });

    await valuationModel.createValuation({
      scan_id: scanId,
      fair_price_min: valuation.fair_price_min,
      fair_price_max: valuation.fair_price_max,
      algorithm_version: valuation.algorithm_version,
      factors_used: valuation.factors_used,
    });

    return sendSuccess(
      res,
      {
        scan_id: scanId,
        players: updatedPlayers,
        valuation,
      },
      'Scan results confirmed and valuation updated.'
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * Get Valuation result by scan ID
 * GET /api/v1/scans/:id/valuation
 */
const getValuation = async (req, res, next) => {
  try {
    const scanId = Number(req.params.id);
    const scan = await scanModel.getScanById(scanId);

    if (!scan) {
      throw new AppError(`Squad scan with ID ${scanId} not found.`, 404, 'SCAN_NOT_FOUND');
    }

    if (scan.user_id !== req.user.id && !['ADMIN', 'MODERATOR'].includes(req.user.role)) {
      throw new AppError('You do not have permission to view this valuation.', 403, 'FORBIDDEN');
    }

    const valuation = await valuationModel.getByScanId(scanId);
    if (!valuation) {
      throw new AppError('Valuation has not been generated for this scan yet.', 404, 'VALUATION_NOT_READY');
    }

    const askingPrice = Number(req.query.asking_price) || 0;
    const badge = askingPrice > 0
      ? valuationService.calculateValueBadge(askingPrice, valuation.fair_price_min, valuation.fair_price_max)
      : null;

    return sendSuccess(
      res,
      {
        valuation: {
          ...valuation,
          badge,
        },
      },
      'Valuation retrieved successfully'
    );
  } catch (err) {
    return next(err);
  }
};

/**
 * Get all scans for current authenticated user
 * GET /api/v1/scans/me
 */
const getMyScans = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { scans, total } = await scanModel.getScansByUserId(req.user.id, limit, offset);

    return sendPaginated(res, scans, page, limit, total, 'User squad scans retrieved');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  submitScan,
  getScanResult,
  confirmScan,
  getValuation,
  getMyScans,
};
