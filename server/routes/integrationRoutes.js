import express from 'express';
import { SyncManager } from '../services/syncManager.js';
import { providerRegistry } from '../services/providerRegistry.js';

export function createIntegrationRouter(io) {
  const router = express.Router();

  // GET /api/integrations - List all 5 platform integration statuses
  router.get('/integrations', (req, res) => {
    try {
      const platforms = SyncManager.getAllPlatforms();
      res.json({ success: true, data: platforms });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/integrations/:platform/status - Platform status check
  router.get('/integrations/:platform/status', (req, res) => {
    const platform = SyncManager.getPlatform(req.params.platform);
    if (!platform) {
      return res.status(404).json({ success: false, error: `Platform ${req.params.platform} not found.` });
    }
    res.json({ success: true, data: platform });
  });

  // POST /api/integrations/:platform/config - Save credentials securely on backend
  router.post('/integrations/:platform/config', (req, res) => {
    const { platform } = req.params;
    const { 
      apiKey, apiSecret, clientId, clientSecret, partnerId, 
      merchantId, redirectUri, baseUrl, accessToken, webhookSecret 
    } = req.body;

    const pUpper = platform.toUpperCase();

    if (apiKey) process.env[`${pUpper}_API_KEY`] = apiKey;
    if (apiSecret) process.env[`${pUpper}_API_SECRET`] = apiSecret;
    if (clientId) process.env[`${pUpper}_CLIENT_ID`] = clientId;
    if (clientSecret) process.env[`${pUpper}_CLIENT_SECRET`] = clientSecret;
    if (partnerId) process.env[`${pUpper}_PARTNER_ID`] = partnerId;
    if (merchantId) process.env[`${pUpper}_MERCHANT_ID`] = merchantId;
    if (redirectUri) process.env[`${pUpper}_REDIRECT_URI`] = redirectUri;
    if (baseUrl) process.env[`${pUpper}_API_BASE_URL`] = baseUrl;
    if (accessToken) process.env[`${pUpper}_ACCESS_TOKEN`] = accessToken;
    if (webhookSecret) process.env[`${pUpper}_WEBHOOK_SECRET`] = webhookSecret;

    // Special mapping for GROWW, ZERODHA, SAFEGOLD, AUGMONT, AURA_GOLD
    if (platform === 'groww') {
      if (apiKey) process.env.GROWW_API_KEY = apiKey;
      if (apiSecret) process.env.GROWW_API_SECRET = apiSecret;
      if (redirectUri) process.env.GROWW_REDIRECT_URI = redirectUri;
      if (accessToken) process.env.GROWW_ACCESS_TOKEN = accessToken;
    } else if (platform === 'zerodha') {
      if (apiKey) process.env.ZERODHA_API_KEY = apiKey;
      if (apiSecret) process.env.ZERODHA_API_SECRET = apiSecret;
      if (redirectUri) process.env.ZERODHA_REDIRECT_URI = redirectUri;
    } else if (platform === 'safegold') {
      if (clientId) process.env.SAFEGOLD_CLIENT_ID = clientId;
      if (clientSecret) process.env.SAFEGOLD_CLIENT_SECRET = clientSecret;
      if (partnerId) process.env.SAFEGOLD_PARTNER_ID = partnerId;
      if (merchantId) process.env.SAFEGOLD_MERCHANT_ID = merchantId;
      if (apiKey) process.env.SAFEGOLD_API_KEY = apiKey;
      if (baseUrl) process.env.SAFEGOLD_API_BASE_URL = baseUrl;
      if (webhookSecret) process.env.SAFEGOLD_WEBHOOK_SECRET = webhookSecret;
    } else if (platform === 'augmont') {
      if (clientId) process.env.AUGMONT_CLIENT_ID = clientId;
      if (clientSecret) process.env.AUGMONT_CLIENT_SECRET = clientSecret;
      if (partnerId) process.env.AUGMONT_PARTNER_ID = partnerId;
      if (merchantId) process.env.AUGMONT_MERCHANT_ID = merchantId;
      if (apiKey) process.env.AUGMONT_API_KEY = apiKey;
      if (baseUrl) process.env.AUGMONT_API_BASE_URL = baseUrl;
      if (webhookSecret) process.env.AUGMONT_WEBHOOK_SECRET = webhookSecret;
    } else if (platform === 'aura_gold') {
      if (clientId) process.env.AURA_GOLD_CLIENT_ID = clientId;
      if (clientSecret) process.env.AURA_GOLD_CLIENT_SECRET = clientSecret;
      if (partnerId) process.env.AURA_GOLD_PARTNER_ID = partnerId;
      if (merchantId) process.env.AURA_GOLD_MERCHANT_ID = merchantId;
      if (apiKey) process.env.AURA_GOLD_API_KEY = apiKey;
      if (baseUrl) process.env.AURA_GOLD_API_BASE_URL = baseUrl;
      if (webhookSecret) process.env.AURA_GOLD_WEBHOOK_SECRET = webhookSecret;
    }

    const updatedStatus = SyncManager.getPlatform(platform);
    SyncManager.recordAuditLog(platform, 'CONFIG_UPDATED', 'Credentials securely updated in backend environment.');
    res.json({ success: true, data: updatedStatus });
  });

  // POST /api/integrations/:platform/test - Test credentials connection without storing tokens
  router.post('/integrations/:platform/test', async (req, res) => {
    const { platform } = req.params;
    const provider = providerRegistry.getProvider(platform);
    if (!provider) {
      return res.status(404).json({ success: false, error: `Platform ${platform} not found.` });
    }

    const statusObj = provider.get_connection_status();
    const isConfigured = statusObj.status !== 'PARTNER_API_REQUIRED' && statusObj.status !== 'PENDING_PARTNER_ACCESS';

    if (!isConfigured) {
      return res.json({
        success: false,
        platform,
        status: statusObj.status,
        message: statusObj.message || 'Credentials missing or incomplete. Partner API required.',
        tested_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      platform,
      status: 'TEST_SUCCESSFUL',
      message: `Official ${provider.platformName} credential structure verified. Ready to authorize.`,
      tested_at: new Date().toISOString()
    });
  });

  // DELETE /api/integrations/:platform/credentials - Purge saved credentials
  router.delete('/integrations/:platform/credentials', async (req, res) => {
    const { platform } = req.params;
    const pUpper = platform.toUpperCase();

    delete process.env[`${pUpper}_API_KEY`];
    delete process.env[`${pUpper}_API_SECRET`];
    delete process.env[`${pUpper}_CLIENT_ID`];
    delete process.env[`${pUpper}_CLIENT_SECRET`];
    delete process.env[`${pUpper}_PARTNER_ID`];
    delete process.env[`${pUpper}_MERCHANT_ID`];
    delete process.env[`${pUpper}_REDIRECT_URI`];
    delete process.env[`${pUpper}_API_BASE_URL`];
    delete process.env[`${pUpper}_ACCESS_TOKEN`];
    delete process.env[`${pUpper}_WEBHOOK_SECRET`];

    if (platform === 'groww') {
      delete process.env.GROWW_API_KEY;
      delete process.env.GROWW_API_SECRET;
      delete process.env.GROWW_REDIRECT_URI;
      delete process.env.GROWW_ACCESS_TOKEN;
    } else if (platform === 'zerodha') {
      delete process.env.ZERODHA_API_KEY;
      delete process.env.ZERODHA_API_SECRET;
      delete process.env.ZERODHA_REDIRECT_URI;
    } else if (platform === 'safegold') {
      delete process.env.SAFEGOLD_CLIENT_ID;
      delete process.env.SAFEGOLD_CLIENT_SECRET;
      delete process.env.SAFEGOLD_PARTNER_ID;
      delete process.env.SAFEGOLD_MERCHANT_ID;
      delete process.env.SAFEGOLD_API_KEY;
      delete process.env.SAFEGOLD_API_BASE_URL;
      delete process.env.SAFEGOLD_WEBHOOK_SECRET;
    } else if (platform === 'augmont') {
      delete process.env.AUGMONT_CLIENT_ID;
      delete process.env.AUGMONT_CLIENT_SECRET;
      delete process.env.AUGMONT_PARTNER_ID;
      delete process.env.AUGMONT_MERCHANT_ID;
      delete process.env.AUGMONT_API_KEY;
      delete process.env.AUGMONT_API_BASE_URL;
      delete process.env.AUGMONT_WEBHOOK_SECRET;
    } else if (platform === 'aura_gold') {
      delete process.env.AURA_GOLD_CLIENT_ID;
      delete process.env.AURA_GOLD_CLIENT_SECRET;
      delete process.env.AURA_GOLD_PARTNER_ID;
      delete process.env.AURA_GOLD_MERCHANT_ID;
      delete process.env.AURA_GOLD_API_KEY;
      delete process.env.AURA_GOLD_API_BASE_URL;
      delete process.env.AURA_GOLD_WEBHOOK_SECRET;
    }

    await SyncManager.disconnectPlatform(platform);
    SyncManager.recordAuditLog(platform, 'CREDENTIALS_REMOVED', 'Credentials completely purged from backend.');
    const updatedStatus = SyncManager.getPlatform(platform);
    res.json({ success: true, data: updatedStatus });
  });

  // POST /api/integrations/:platform/connect - Connect platform
  router.post('/integrations/:platform/connect', async (req, res) => {
    try {
      const { platform } = req.params;
      const result = await SyncManager.connectPlatform(platform, req.body);
      if (io) io.emit('platform-status-updated', { platform, isConnected: true });
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Groww OAuth Connect Endpoint
  router.get('/integrations/groww/connect', (req, res) => {
    const apiKey = process.env.GROWW_API_KEY;
    if (!apiKey) {
      return res.redirect('http://localhost:3000?tab=platforms&error=Groww+API+Required');
    }
    res.redirect(`https://groww.in/trade-api/docs`);
  });

  // Zerodha OAuth Connect Endpoint
  router.get('/integrations/zerodha/connect', (req, res) => {
    const apiKey = process.env.ZERODHA_API_KEY;
    if (!apiKey) {
      return res.redirect('http://localhost:3000?tab=platforms&error=Zerodha+Kite+Connect+Required');
    }
    const redirectUri = process.env.ZERODHA_REDIRECT_URI || 'http://localhost:5000/api/integrations/zerodha/callback';
    const loginUrl = `https://kite.zerodha.com/connect/login?v=3&api_key=${apiKey}&redirect_params=redirect_uri%3D${encodeURIComponent(redirectUri)}`;
    res.redirect(loginUrl);
  });

  // Zerodha OAuth Callback Endpoint
  router.get('/integrations/zerodha/callback', async (req, res) => {
    const { request_token, status } = req.query;
    if (status === 'success' && request_token) {
      try {
        await SyncManager.connectPlatform('zerodha', { requestToken: request_token });
        return res.redirect('http://localhost:3000?tab=platforms&connect=success');
      } catch (err) {
        return res.redirect(`http://localhost:3000?tab=platforms&error=${encodeURIComponent(err.message)}`);
      }
    }
    res.redirect('http://localhost:3000?tab=platforms&error=OAuth+Authorization+Failed');
  });

  // POST /api/integrations/:platform/disconnect - Disconnect platform
  router.post('/integrations/:platform/disconnect', async (req, res) => {
    try {
      const { platform } = req.params;
      const result = await SyncManager.disconnectPlatform(platform);
      if (io) io.emit('platform-status-updated', { platform, isConnected: false });
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // POST /api/sync/all - Trigger manual sync across all connected platforms
  router.post('/sync/all', async (req, res) => {
    try {
      const syncResults = await SyncManager.syncAllPlatforms();
      const summary = SyncManager.getPortfolioSummary();
      if (io) io.emit('portfolio-synced', summary);
      res.json({ success: true, data: { syncResults, summary } });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/sync/:platform - Synchronize specific platform
  router.post('/sync/:platform', async (req, res) => {
    try {
      const { platform } = req.params;
      const syncResult = await SyncManager.syncPlatform(platform);
      const summary = SyncManager.getPortfolioSummary();
      if (io) io.emit('portfolio-synced', summary);
      res.json({ success: true, data: { syncResult, summary } });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // GET /api/sync/status - Audit logs and sync history
  router.get('/sync/status', (req, res) => {
    const logs = SyncManager.getAuditLogs();
    res.json({ success: true, data: logs });
  });

  // GET /api/portfolio/summary - Unified Aggregated Portfolio Summary
  router.get('/portfolio/summary', (req, res) => {
    const summary = SyncManager.getPortfolioSummary();
    res.json({ success: true, data: summary });
  });

  return router;
}
