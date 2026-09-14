import express from 'express';
import { getCachedMarketPrices, refreshMarketData, getMarketSchedulerStatus } from '../services/market_data/marketScheduler.js';
import { marketProviderRegistry } from '../services/market_data/marketProviderRegistry.js';
import { MarketNewsService } from '../services/market_data/marketNewsService.js';
import { getPriceAlerts, createPriceAlert, deletePriceAlert, getAlertEventsHistory } from '../services/market_data/priceAlertsService.js';

export function createMarketRouter(io) {
  const router = express.Router();

  // GET /api/markets - All live market prices
  router.get('/markets', async (req, res) => {
    try {
      let prices = getCachedMarketPrices();
      if (!prices || prices.length === 0) {
        const refreshRes = await refreshMarketData(io);
        prices = refreshRes.data || [];
      }
      res.json({
        success: true,
        count: prices.length,
        data: prices,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/markets/status - Market status & scheduler details
  router.get('/markets/status', (req, res) => {
    const status = getMarketSchedulerStatus();
    const providers = marketProviderRegistry.getAllProviders().map(p => ({
      providerId: p.providerId,
      providerName: p.get_source_name(),
      dataStatus: p.get_data_status(),
      marketStatus: p.get_market_status()
    }));
    res.json({
      success: true,
      scheduler: status,
      providers,
      timestamp: new Date().toISOString()
    });
  });

  // GET /api/markets/diagnostics - Admin Market Diagnostics (Secrets redacted)
  router.get('/markets/diagnostics', (req, res) => {
    const goldProvider = marketProviderRegistry.getProvider('commodity');
    const diagnosticsData = goldProvider ? goldProvider.getDiagnostics() : null;
    const status = getMarketSchedulerStatus();

    res.json({
      success: true,
      diagnostics: {
        gold_provider: {
          name: goldProvider ? goldProvider.get_source_name() : 'Unknown',
          last_debug_log: diagnosticsData || { note: 'No live HTTP request recorded yet' },
          data_status: goldProvider ? goldProvider.get_data_status() : 'unavailable'
        },
        scheduler: status,
        cached_prices_sample: getCachedMarketPrices().slice(0, 4)
      },
      timestamp: new Date().toISOString()
    });
  });

  // GET /api/markets/snapshot - Full aggregated market snapshot
  router.get('/markets/snapshot', async (req, res) => {
    try {
      const snapshots = await marketProviderRegistry.getAllSnapshots();
      res.json({
        success: true,
        data: snapshots,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/markets/news - Financial Market News
  router.get('/markets/news', (req, res) => {
    const news = MarketNewsService.getNews();
    res.json({ success: true, count: news.length, data: news });
  });

  // GET /api/markets/alerts - Price Target Alerts
  router.get('/markets/alerts', (req, res) => {
    const alerts = getPriceAlerts('u-101');
    const events = getAlertEventsHistory();
    res.json({ success: true, alerts, history: events });
  });

  // POST /api/markets/alerts - Create Price Target Alert
  router.post('/markets/alerts', (req, res) => {
    try {
      const newAlert = createPriceAlert(req.body);
      res.json({ success: true, data: newAlert });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // DELETE /api/markets/alerts/:id - Delete Price Alert
  router.delete('/markets/alerts/:id', (req, res) => {
    const deleted = deletePriceAlert(req.params.id);
    res.json({ success: deleted });
  });

  // POST /api/markets/refresh - Manual refresh trigger
  router.post('/markets/refresh', async (req, res) => {
    try {
      const refreshRes = await refreshMarketData(io);
      res.json({ success: true, data: refreshRes });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/markets/:symbol - Single market ticker lookup
  router.get('/markets/:symbol', async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const prices = getCachedMarketPrices();
    const match = prices.find(p => p.symbol === symbol || p.symbol.toLowerCase() === symbol.toLowerCase());

    if (!match) {
      return res.status(404).json({ success: false, error: `Symbol ${symbol} not found in market registry.` });
    }
    res.json({ success: true, data: match });
  });

  return router;
}
