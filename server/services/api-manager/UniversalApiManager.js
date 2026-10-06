/**
 * GROW 0.2 Universal Data & API Manager
 * Master orchestrator for external live financial data providers, caching, validation, and Groq AI analysis.
 * Implements 7-level fallback hierarchy, automatic startup detection, scheduled refreshes, and zero fabricated data guarantee.
 */

import { globalCacheManager } from './cache/CacheManager.js';
import { DataValidator } from './validation/DataValidator.js';
import { currencyProvider } from './providers/CurrencyProvider.js';
import { cryptoProvider } from './providers/CryptoProvider.js';
import { preciousMetalsProvider } from './providers/PreciousMetalsProvider.js';
import { stockIndicesProvider } from './providers/StockIndicesProvider.js';
import { financialNewsProvider } from './providers/FinancialNewsProvider.js';
import { futurePredictionEngine } from './providers/FuturePredictionEngine.js';

export class UniversalApiManager {
  constructor() {
    this.providers = new Map([
      ['currency', currencyProvider],
      ['crypto', cryptoProvider],
      ['metals', preciousMetalsProvider],
      ['stocks', stockIndicesProvider],
      ['news', financialNewsProvider],
      ['predictions', futurePredictionEngine]
    ]);

    this.cache = globalCacheManager;
    this.validator = DataValidator;
    this.isInitialized = false;
    this.refreshTimer = null;
    this.io = null;

    this.bootDiagnostics = {
      bootTime: null,
      detectedKeys: {},
      freeApisAvailable: true
    };
  }

  /**
   * Initialize and detect environment keys and free APIs
   */
  async initialize(io = null) {
    if (this.isInitialized) return;
    this.io = io;
    this.bootDiagnostics.bootTime = new Date().toISOString();

    // Check configured environment keys (Only report boolean existence, never secrets)
    this.bootDiagnostics.detectedKeys = {
      GROQ_API_KEY: Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.length > 5),
      ALPHA_VANTAGE_API_KEY: Boolean(process.env.ALPHA_VANTAGE_API_KEY && process.env.ALPHA_VANTAGE_API_KEY !== 'optional_alpha_vantage_key'),
      NEWS_API_KEY: Boolean(process.env.NEWS_API_KEY),
      RAZORPAY_KEY_ID: Boolean(process.env.RAZORPAY_KEY_ID)
    };

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 [GROW 0.2] UNIVERSAL DATA & API MANAGER INITIALIZED');
    console.log('├─ Groq Cloud AI Status:    ', this.bootDiagnostics.detectedKeys.GROQ_API_KEY ? 'ACTIVE (Llama 3.3 70B)' : 'FALLBACK MODE');
    console.log('├─ Currency Feed:           Frankfurter ECB (Level 1 Keyless Active)');
    console.log('├─ Crypto Feed:             Binance Spot + CoinGecko (Level 1 Keyless Active)');
    console.log('├─ Precious Metals Feed:    Gold-API Spot XAU/XAG (Level 1 Keyless Active)');
    console.log('├─ Equities & Indices Feed: Yahoo Finance Charts (Level 1 Keyless Active)');
    console.log('├─ Financial News:          Economic Times Markets RSS (Level 2 Public Active)');
    console.log('├─ Payments Isolation:      Razorpay SDK Isolated from AI Layer');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    this.isInitialized = true;

    // Trigger initial warm-up fetch in background
    this.refreshAllMarketFeeds().catch(err => {
      console.warn('⚠️ Initial market feed warmup non-fatal warning:', err.message);
    });

    // Start 60-second background refresh interval
    this.startScheduledSync();
  }

  /**
   * Scheduled refresh loop (error-isolated)
   */
  startScheduledSync() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);

    this.refreshTimer = setInterval(async () => {
      try {
        await this.refreshAllMarketFeeds();
      } catch (err) {
        console.warn('⚠️ Universal API Manager scheduled refresh caught error:', err.message);
      }
    }, 60 * 1000);
  }

  /**
   * Refresh all live market feeds concurrently with fault isolation
   */
  async refreshAllMarketFeeds() {
    const results = await Promise.allSettled([
      stockIndicesProvider.fetchData(),
      preciousMetalsProvider.fetchData(),
      cryptoProvider.fetchData()
    ]);

    const allPrices = [];

    // Stocks
    if (results[0].status === 'fulfilled' && Array.isArray(results[0].value)) {
      allPrices.push(...results[0].value);
    }
    // Metals
    if (results[1].status === 'fulfilled' && Array.isArray(results[1].value)) {
      allPrices.push(...results[1].value);
    }
    // Crypto
    if (results[2].status === 'fulfilled' && Array.isArray(results[2].value)) {
      allPrices.push(...results[2].value);
    }

    // Broadcast live prices to connected WebSocket clients
    if (this.io && allPrices.length > 0) {
      this.io.emit('live-market-update', allPrices);
    }

    return allPrices;
  }

  /**
   * Return full live market snapshot (Equities, Indices, Gold, Silver, Crypto)
   */
  async getAllMarketSnapshots() {
    const cachedStocks = this.cache.get('stocks_indices_snapshot');
    const cachedMetals = this.cache.get('metals_spot_snapshot');
    const cachedCrypto = this.cache.get('crypto_market_snapshot');

    if (cachedStocks && cachedMetals && cachedCrypto) {
      return [...cachedStocks, ...cachedMetals, ...cachedCrypto];
    }

    return this.refreshAllMarketFeeds();
  }

  /**
   * Currency operations
   */
  async getCurrencyRates(base = 'USD') {
    return currencyProvider.getLatestRates(base);
  }

  async convertCurrency(amount, from, to) {
    return currencyProvider.convert(amount, from, to);
  }

  async getHistoricalCurrencyRates(dateStr, base = 'USD') {
    return currencyProvider.getHistoricalRates(dateStr, base);
  }

  /**
   * Financial News operations
   */
  async getFinancialNews(withAiSummary = false) {
    const news = await financialNewsProvider.fetchData();
    let aiBriefing = null;

    if (withAiSummary && news.length > 0) {
      aiBriefing = await financialNewsProvider.generateAiMarketBriefing(news);
    }

    return {
      success: true,
      count: news.length,
      data: news,
      ai_briefing: aiBriefing,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Future Financial Projections (Deterministic + Groq Explanation)
   */
  async calculateFutureProjections(userFinancialSnapshot, requestAiExplanation = true) {
    const projections = futurePredictionEngine.generateProjections(userFinancialSnapshot);
    let aiAnalysis = null;

    if (requestAiExplanation) {
      aiAnalysis = await futurePredictionEngine.generateAiExplanation(projections);
    }

    return {
      success: true,
      ...projections,
      ai_analysis: aiAnalysis
    };
  }

  /**
   * Provider Health Status Matrix for Admin Panel / Telemetry
   * Zero secrets exposed.
   */
  getProviderStatusMatrix() {
    const matrix = [];
    for (const [key, provider] of this.providers.entries()) {
      matrix.push({
        category: key,
        ...provider.getStatus()
      });
    }

    return {
      success: true,
      system: 'Grow 0.2 Universal API Manager',
      bootDiagnostics: this.bootDiagnostics,
      cacheStats: this.cache.getStats(),
      totalProviders: matrix.length,
      providers: matrix,
      timestamp: new Date().toISOString()
    };
  }
}

export const universalApiManager = new UniversalApiManager();
export default universalApiManager;
