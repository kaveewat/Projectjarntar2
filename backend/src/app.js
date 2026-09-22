const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const corsOptions = require('./config/cors');
const requestLogger = require('./middleware/requestLogger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Route imports
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const scansRoutes = require('./routes/scans.routes');
const listingsRoutes = require('./routes/listings.routes');
const playersRoutes = require('./routes/players.routes');
const listingsAdminRoutes = require('./routes/admin/listings.admin.routes');
const ordersRoutes = require('./routes/orders.routes');
const ordersAdminRoutes = require('./routes/admin/orders.admin.routes');
const escrowAdminRoutes = require('./routes/admin/escrow.admin.routes');
const handoverRoutes = require('./routes/handover.routes');
const disputesRoutes = require('./routes/disputes.routes');
const disputesAdminRoutes = require('./routes/admin/disputes.admin.routes');
const kycAdminRoutes = require('./routes/admin/kyc.admin.routes');
const usersAdminRoutes = require('./routes/admin/users.admin.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const dashboardAdminRoutes = require('./routes/admin/dashboard.admin.routes');
const analyticsAdminRoutes = require('./routes/admin/analytics.admin.routes');
const auditAdminRoutes = require('./routes/admin/audit.admin.routes');
const settingsAdminRoutes = require('./routes/admin/settings.admin.routes');
const playersAdminRoutes = require('./routes/admin/players.admin.routes');
const payoutsRoutes = require('./routes/payouts.routes');
const payoutsAdminRoutes = require('./routes/admin/payouts.admin.routes');
const marketRoutes = require('./routes/market.routes');
const legacyPlayerRoutes = require('./routes/players');
const squadRoutes = require('./routes/squads');
const marketplaceRoutes = require('./routes/marketplace');

const createApp = () => {
  const app = express();

  // 1. Security Headers
  app.use(helmet());

  // 2. CORS
  app.use(cors(corsOptions));

  // 3. Body Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. Request Logging (Morgan + Winston)
  app.use(requestLogger);

  // Static files (uploads) with fallback for mock/pending images
  const defaultSquadSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="320" viewBox="0 0 600 320">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A0E14" />
      <stop offset="50%" stop-color="#161B22" />
      <stop offset="100%" stop-color="#0D1117" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1F6FEB" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#0D1117" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="600" height="320" fill="url(#bg)" />
  <circle cx="300" cy="160" r="130" fill="url(#glow)" />
  <rect x="40" y="24" width="520" height="272" rx="12" fill="none" stroke="#30363D" stroke-width="2" stroke-dasharray="6 4" />
  <line x1="300" y1="24" x2="300" y2="296" stroke="#30363D" stroke-width="2" />
  <circle cx="300" cy="160" r="46" fill="none" stroke="#30363D" stroke-width="2" />
  <circle cx="300" cy="160" r="4" fill="#58A6FF" />
  <text x="300" y="155" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" fill="#F0F6FC" text-anchor="middle" letter-spacing="1">eFootball Squad</text>
  <text x="300" y="180" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#58A6FF" text-anchor="middle">VERIFIED AI VALUATION</text>
</svg>`;

  app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')), (_req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(defaultSquadSvg);
  });

  // 5. API v1 Routes
  app.use('/api/v1/health', healthRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', usersRoutes);
  app.use('/api/v1/scans', scansRoutes);
  app.use('/api/v1/listings', listingsRoutes);
  app.use('/api/v1/players', playersRoutes);
  app.use('/api/v1/admin/listings', listingsAdminRoutes);
  app.use('/api/v1/orders', ordersRoutes);
  app.use('/api/v1/admin/orders', ordersAdminRoutes);
  app.use('/api/v1/admin/escrow', escrowAdminRoutes);
  app.use('/api/v1/handover', handoverRoutes);
  app.use('/api/v1/disputes', disputesRoutes);
  app.use('/api/v1/admin/disputes', disputesAdminRoutes);
  app.use('/api/v1/admin/kyc', kycAdminRoutes);
  app.use('/api/v1/admin/users', usersAdminRoutes);
  app.use('/api/v1/notifications', notificationsRoutes);
  app.use('/api/v1/dashboard', dashboardRoutes);
  app.use('/api/v1/admin/dashboard', dashboardAdminRoutes);
  app.use('/api/v1/admin/analytics', analyticsAdminRoutes);
  app.use('/api/v1/admin', auditAdminRoutes);
  app.use('/api/v1/admin/platform-settings', settingsAdminRoutes);
  app.use('/api/v1/admin/players', playersAdminRoutes);
  app.use('/api/v1/payouts', payoutsRoutes);
  app.use('/api/v1/admin/payouts', payoutsAdminRoutes);
  app.use('/api/v1/market', marketRoutes);

  // Health check shortcut
  app.use('/health', healthRoutes);

  // 6. Legacy/Compatibility Routes (will be migrated in subsequent phases)
  app.use('/api/auth', authRoutes);
  app.use('/api/players', legacyPlayerRoutes);
  app.use('/api/squads', squadRoutes);
  app.use('/api/marketplace', marketplaceRoutes);

  // 7. 404 Not Found Handler
  app.use(notFoundHandler);

  // 8. Global Error Handler
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
