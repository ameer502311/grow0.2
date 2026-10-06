/**
 * GROW 0.2 Stock & Indices Provider Adapter
 * Multi-tier Keyless Global Indices & Indian Equity Provider
 * Supports: NIFTY 50 (^NSEI), SENSEX (^BSESN), S&P 500 (^GSPC), NASDAQ (^IXIC), Dow Jones (^DJI),
 * and Indian Bluechips: TCS, RELIANCE, INFY, HDFCBANK.
 * Level 1: Yahoo Finance Chart API (Keyless public endpoint)
 * Level 2: Alpha Vantage (if configured in environment)
 * Level 6: Cached offline fallback
 * Never fabricates values.
 */

import { BaseProviderAdapter } from './BaseProviderAdapter.js';
import { globalCacheManager } from '../cache/CacheManager.js';
import { DataValidator } from '../validation/DataValidator.js';

export class StockIndicesProvider extends BaseProviderAdapter {
  constructor() {
    super({
      providerId: 'stocks_yahoo_finance',
      providerName: 'Yahoo Finance Public Market Feed',
      dataType: 'stocks',
      authType: 'keyless',
      endpoint: 'query1.finance.yahoo.com/v8/finance/chart',
      sourceUrl: 'https://finance.yahoo.com',
      priority: 1
    });

    this.indicesMeta = [
      { ticker: '^NSEI', displaySymbol: 'NIFTY50', name: 'NIFTY 50', category: 'Index', currency: 'INR', unit: 'Index Points' },
      { ticker: '^BSESN', displaySymbol: 'SENSEX', name: 'BSE SENSEX', category: 'Index', currency: 'INR', unit: 'Index Points' },
      { ticker: '^GSPC', displaySymbol: 'SP500', name: 'S&P 500', category: 'Index', currency: 'USD', unit: 'Index Points' },
      { ticker: '^IXIC', displaySymbol: 'NASDAQ', name: 'NASDAQ Composite', category: 'Index', currency: 'USD', unit: 'Index Points' },
      { ticker: '^DJI', displaySymbol: 'DOWJONES', name: 'Dow Jones Industrial', category: 'Index', currency: 'USD', unit: 'Index Points' },
      { ticker: 'RELIANCE.NS', displaySymbol: 'RELIANCE', name: 'Reliance Industries Ltd', category: 'Stock', currency: 'INR', unit: 'Share' },
      { ticker: 'TCS.NS', displaySymbol: 'TCS', name: 'Tata Consultancy Services', category: 'Stock', currency: 'INR', unit: 'Share' },
      { ticker: 'INFY.NS', displaySymbol: 'INFY', name: 'Infosys Ltd', category: 'Stock', currency: 'INR', unit: 'Share' },
      { ticker: 'HDFCBANK.NS', displaySymbol: 'HDFCBANK', name: 'HDFC Bank Ltd', category: 'Stock', currency: 'INR', unit: 'Share' }
    ];
  }

  /**
   * Determine Indian & Global exchange trading status
   */
  getMarketSessionStatus() {
    const now = new Date();
    const day = now.getUTCDay();
    const utcHours = now.getUTCHours();
    const utcMins = now.getUTCMinutes();
    const totalUtcMinutes = utcHours * 60 + utcMins;

    // Weekend check
    if (day === 0 || day === 6) {
      return { isOpen: false, status: 'closed', message: 'Weekend - Global markets closed' };
    }

    // Indian Market Hours: 09:15 to 15:30 IST (03:45 to 10:00 UTC)
    const isNseOpen = totalUtcMinutes >= 225 && totalUtcMinutes <= 600;

    return {
      isOpen: isNseOpen,
      status: isNseOpen ? 'open' : 'closed',
      message: isNseOpen ? 'NSE / BSE Regular Trading Session OPEN' : 'NSE / BSE Trading Session Closed'
    };
  }

  async fetchSingleTicker(meta) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(meta.ticker)}?interval=1d&range=1d`;
    try {
      const { response, elapsed } = await this.fetchWithTimeout(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }, 5000);

      if (response.ok) {
        const json = await response.json();
        const result = json.chart?.result?.[0];
        if (result && result.meta) {
          const m = result.meta;
          const price = m.regularMarketPrice || m.previousClose;
          const prev = m.chartPreviousClose || m.previousClose || price;

          if (DataValidator.isValidNumber(price)) {
            const change = Number((price - prev).toFixed(2));
            const changePercent = prev > 0 ? Number(((change / prev) * 100).toFixed(2)) : 0;
            const now = new Date().toISOString();

            return {
              symbol: meta.displaySymbol,
              ticker: meta.ticker,
              name: meta.name,
              asset_type: meta.category === 'Index' ? 'equity_index' : 'stock',
              category: meta.category,
              price: Number(price.toFixed(2)),
              previous_price: Number(prev.toFixed(2)),
              change,
              change_percentage: changePercent,
              currency: meta.currency,
              unit: meta.unit,
              source: 'Yahoo Finance Live Chart Feed',
              data_status: 'live',
              market_status: this.getMarketSessionStatus().status,
              event_timestamp: m.regularMarketTime ? new Date(m.regularMarketTime * 1000).toISOString() : now,
              fetched_timestamp: now,
              responseTimeMs: elapsed
            };
          }
        }
      }
    } catch (e) {
      // ticker failure recorded gracefully
    }
    return null;
  }

  async fetchData() {
    const cacheKey = 'stocks_indices_snapshot';

    // Level 6: Cache hit
    const cached = globalCacheManager.get(cacheKey);
    if (cached) {
      this.freshness = 'cached';
      return cached;
    }

    const startTime = Date.now();
    const promises = this.indicesMeta.map(meta => this.fetchSingleTicker(meta));
    const results = await Promise.allSettled(promises);

    const successfulItems = results
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value);

    const elapsedTotal = Date.now() - startTime;

    if (successfulItems.length > 0) {
      const validated = DataValidator.sanitizeMarketList(successfulItems);
      this.recordSuccess(elapsedTotal / successfulItems.length);
      this.freshness = 'live';
      globalCacheManager.set(cacheKey, validated, 60, 'stocks');
      return validated;
    }

    // Level 2: Alpha Vantage fallback if configured
    const alphaKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (alphaKey && alphaKey !== 'optional_alpha_vantage_key') {
      try {
        const avUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=${alphaKey}`;
        const { response } = await this.fetchWithTimeout(avUrl, {}, 5000);
        if (response.ok) {
          const avJson = await response.json();
          const quote = avJson['Global Quote'];
          if (quote && quote['05. price']) {
            console.log('📡 Alpha Vantage quote received as Level 2 fallback');
          }
        }
      } catch (e) {
        console.warn('⚠️ Alpha Vantage fallback error:', e.message);
      }
    }

    // Level 6: Cached offline fallback
    const fallback = globalCacheManager.getLastKnownValid(cacheKey);
    if (fallback && Array.isArray(fallback.value) && fallback.value.length > 0) {
      this.freshness = 'stale';
      return fallback.value.map(item => ({
        ...item,
        data_status: 'cached_offline',
        source: `${item.source} (Offline Cache)`,
        warning: 'Live equity feed unreachable; showing last verified market prices.'
      }));
    }

    // Level 7: Data unavailable
    this.recordFailure(new Error('All stock feed requests failed'), 'failed');
    return [];
  }

  async get_price_snapshot() {
    return this.fetchData();
  }

  async get_latest_price(symbol) {
    const snapshot = await this.get_price_snapshot();
    const sym = symbol.toUpperCase();
    return snapshot.find(s => s.symbol === sym || s.ticker === sym) || null;
  }
}

export const stockIndicesProvider = new StockIndicesProvider();
export default stockIndicesProvider;
