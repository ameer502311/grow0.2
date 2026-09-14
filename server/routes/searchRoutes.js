import express from 'express';
import { executeMarketSearch, getSearchHistory, clearSearchHistory } from '../services/market_search/marketSearchEngine.js';

export function createSearchRouter() {
  const router = express.Router();

  // GET /api/market-search?q=query - Execute natural language market search
  router.get('/market-search', async (req, res) => {
    try {
      const query = req.query.q || req.query.query || 'today gold price';
      const result = await executeMarketSearch(query, 'u-101');
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // POST /api/market-search - Execute search via JSON body
  router.post('/market-search', async (req, res) => {
    try {
      const { query } = req.body;
      const result = await executeMarketSearch(query || 'today gold price', 'u-101');
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // GET /api/search-history - Recent user searches
  router.get('/search-history', (req, res) => {
    const history = getSearchHistory('u-101');
    res.json({ success: true, data: history });
  });

  // DELETE /api/search-history - Clear user search history
  router.delete('/search-history', (req, res) => {
    clearSearchHistory('u-101');
    res.json({ success: true, message: 'Search history cleared' });
  });

  return router;
}
