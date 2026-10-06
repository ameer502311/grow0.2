import express from 'express';
import { getCachedMarketPrices, refreshMarketData, getMarketSchedulerStatus } from '../services/market_data/marketScheduler.js';
import { getPriceAlerts, createPriceAlert, deletePriceAlert, getAlertEventsHistory } from '../services/market_data/priceAlertsService.js';
import { universalApiManager } from '../services/api-manager/UniversalApiManager.js';
import { currencyProvider } from '../services/api-manager/providers/CurrencyProvider.js';

export function createMarketRouter(io) {
  const router = express.Router();

  // GET /api/markets - All live market prices (Equities, Indices, Gold, Silver, Crypto)
  router.get('/markets', async (req, res) => {
    try {
      let prices = getCachedMarketPrices();
      if (!prices || prices.length === 0) {
        prices = await universalApiManager.getAllMarketSnapshots();
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

  // GET /api/providers/status - Universal API Manager Provider Health & Telemetry Dashboard
  router.get('/providers/status', (req, res) => {
    try {
      const statusMatrix = universalApiManager.getProviderStatusMatrix();
      res.json(statusMatrix);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/markets/status - Legacy & Unified Scheduler Status
  router.get('/markets/status', (req, res) => {
    const status = getMarketSchedulerStatus();
    const statusMatrix = universalApiManager.getProviderStatusMatrix();
    res.json({
      success: true,
      scheduler: status,
      providers: statusMatrix.providers,
      timestamp: new Date().toISOString()
    });
  });

  // GET /api/currency/latest - Live Keyless Exchange Rates (Frankfurter ECB)
  router.get('/currency/latest', async (req, res) => {
    try {
      const base = req.query.base || 'USD';
      const ratesData = await universalApiManager.getCurrencyRates(base);
      res.json(ratesData);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/currency/convert - Live Currency Converter
  router.get('/currency/convert', async (req, res) => {
    try {
      const { amount, from = 'USD', to = 'INR' } = req.query;
      if (!amount) {
        return res.status(400).json({ success: false, error: 'Query parameter "amount" is required.' });
      }
      const conversion = await universalApiManager.convertCurrency(amount, from, to);
      res.json(conversion);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/currency/history - Currency Conversion History
  router.get('/currency/history', (req, res) => {
    res.json({
      success: true,
      data: currencyProvider.getConversionHistory()
    });
  });

  // POST /api/predictions/future - Future Financial Projections (Deterministic + Groq LPU)
  router.post('/predictions/future', async (req, res) => {
    try {
      const userSnapshot = req.body || {};
      const withAi = req.query.ai !== 'false';
      const result = await universalApiManager.calculateFutureProjections(userSnapshot, withAi);
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/predictions/future - Default Future Financial Projections
  router.get('/predictions/future', async (req, res) => {
    try {
      const defaultSnapshot = {
        monthlyIncome: 85000,
        monthlyExpenses: 42000,
        currentInvestments: 250000,
        currentSavings: 120000,
        totalDebt: 150000,
        monthlyEmi: 12500,
        goals: [
          { name: 'Emergency Fund', targetAmount: 250000, currentAmount: 120000 },
          { name: 'Home Down Payment', targetAmount: 1500000, currentAmount: 250000 }
        ]
      };
      const withAi = req.query.ai !== 'false';
      const result = await universalApiManager.calculateFutureProjections(defaultSnapshot, withAi);
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/markets/news - Financial Market News (Public RSS + Groq Briefing)
  router.get('/markets/news', async (req, res) => {
    try {
      const withAi = req.query.ai === 'true';
      const newsResult = await universalApiManager.getFinancialNews(withAi);
      res.json(newsResult);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/markets/snapshot - Full aggregated market snapshot
  router.get('/markets/snapshot', async (req, res) => {
    try {
      const snapshots = await universalApiManager.getAllMarketSnapshots();
      res.json({
        success: true,
        data: snapshots,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
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
    const match = prices.find(p => p.symbol === symbol || p.symbol.toLowerCase() === symbol.toLowerCase() || (p.pair && p.pair.toUpperCase() === symbol));

    if (!match) {
      return res.status(404).json({ success: false, error: `Symbol ${symbol} not found in live market registry.` });
    }
    res.json({ success: true, data: match });
  });

  return router;
}

export default createMarketRouter;
