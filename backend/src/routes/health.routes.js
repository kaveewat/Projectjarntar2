const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Health check endpoint
 * GET /api/v1/health
 */
router.get('/', async (_req, res) => {
  try {
    const isDbConnected = await db.healthCheck();
    const uptime = Math.floor(process.uptime());

    if (isDbConnected) {
      return sendSuccess(
        res,
        {
          status: 'healthy',
          db: 'connected',
          uptime,
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version || '1.0.0',
        },
        'System is healthy'
      );
    } else {
      return res.status(503).json({
        success: false,
        data: {
          status: 'degraded',
          db: 'disconnected',
          uptime,
          timestamp: new Date().toISOString(),
        },
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Database service is currently unreachable',
          details: [],
        },
      });
    }
  } catch (err) {
    return sendError(
      res,
      'HEALTH_CHECK_FAILED',
      err.message || 'Health check encountered an error',
      [],
      503
    );
  }
});

module.exports = router;
