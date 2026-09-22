const express = require('express');
const router = express.Router();

const scansController = require('../controllers/scans.controller');
const { requireAuth } = require('../middleware/auth');
const { uploadSquadImages } = require('../middleware/upload');

/**
 * Squad Scan Endpoints
 * Base path: /api/v1/scans
 */

// Submit screenshots for scanning (Multipart upload)
router.post('/', requireAuth, uploadSquadImages('images', 10), scansController.submitScan);

// Get current user's scan history
router.get('/me', requireAuth, scansController.getMyScans);

// Get scan results & detected players by scan ID
router.get('/:id', requireAuth, scansController.getScanResult);

// Seller confirms / corrects scan results
router.patch('/:id/confirm', requireAuth, scansController.confirmScan);

// Get Valuation calculations & badge by scan ID
router.get('/:id/valuation', requireAuth, scansController.getValuation);

module.exports = router;
