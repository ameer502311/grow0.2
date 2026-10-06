/**
 * GROW 0.2 Currency Provider Adapter
 * Multi-tier Keyless Exchange Rates Provider (Frankfurter + Open ER-API Fallback)
 * Supporting INR, USD, EUR, GBP, JPY, AUD, CAD, SGD, AED, CHF, CNY, etc.
 */

import { BaseProviderAdapter } from './BaseProviderAdapter.js';
import { globalCacheManager } from '../cache/CacheManager.js';
import { DataValidator } from '../validation/DataValidator.js';

export class CurrencyProvider extends BaseProviderAdapter {
  constructor() {
    super({
      providerId: 'currency_frankfurter_erapi',
      providerName: 'Frankfurter / Open ER-API Foreign Exchange',
      dataType: 'currency',
      authType: 'keyless',
      endpoint: 'api.frankfurter.app/latest',
      sourceUrl: 'https://www.frankfurter.app',
      priority: 1
    });

    this.supportedCurrencies = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'AED', 'CHF', 'CNY', 'NZD', 'SAR'];
    this.conversionHistory = [];
  }

  /**
   * Fetch latest currency rates relative to base currency (default USD)
   */
  async getLatestRates(base = 'USD') {
    const baseCurr = base.toUpperCase();
    const cacheKey = `rates_${baseCurr}`;

    // Level 6: Cache check
    const cached = globalCacheManager.get(cacheKey);
    if (cached) {
      this.freshness = 'cached';
      return {
        success: true,
        base: baseCurr,
        rates: cached.rates,
        date: cached.date,
        source: this.providerName,
        freshness: 'cached',
        timestamp: cached.timestamp
      };
    }

    // Level 1: Primary Keyless Provider - Frankfurter
    try {
      const url = `https://api.frankfurter.app/latest?from=${baseCurr}`;
      const { response, elapsed } = await this.fetchWithTimeout(url, {}, 8000);

      if (response.ok) {
        const json = await response.json();
        if (json.rates && Object.keys(json.rates).length > 0) {
          const rates = { ...json.rates, [baseCurr]: 1.0 };
          const validation = DataValidator.validateCurrencyRates(baseCurr, rates);

          if (validation.valid) {
            this.recordSuccess(elapsed);
            this.freshness = 'live';

            const payload = {
              rates,
              date: json.date || new Date().toISOString().slice(0, 10),
              timestamp: new Date().toISOString()
            };

            // Cache for 1 hour
            globalCacheManager.set(cacheKey, payload, 3600, 'currency');

            return {
              success: true,
              base: baseCurr,
              rates,
              date: payload.date,
              source: 'Frankfurter ECB Official Rates',
              freshness: 'live',
              timestamp: payload.timestamp
            };
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ Primary Currency Provider (Frankfurter) failed, attempting Level 2 Fallback:', err.message);
      this.recordFailure(err, 'degraded');
    }

    // Level 2: Secondary Keyless Fallback Provider - Open Exchange Rate API
    try {
      const url = `https://open.er-api.com/v6/latest/${baseCurr}`;
      const { response, elapsed } = await this.fetchWithTimeout(url, {}, 8000);

      if (response.ok) {
        const json = await response.json();
        if (json.rates && Object.keys(json.rates).length > 0) {
          this.recordSuccess(elapsed);
          this.freshness = 'live';

          const payload = {
            rates: json.rates,
            date: json.time_last_update_utc ? new Date(json.time_last_update_utc).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            timestamp: new Date().toISOString()
          };

          globalCacheManager.set(cacheKey, payload, 3600, 'currency');

          return {
            success: true,
            base: baseCurr,
            rates: json.rates,
            date: payload.date,
            source: 'Open ER-API Realtime Rates',
            freshness: 'live',
            timestamp: payload.timestamp
          };
        }
      }
    } catch (err) {
      console.warn('⚠️ Secondary Currency Provider (Open ER-API) failed:', err.message);
      this.recordFailure(err, 'failed');
    }

    // Level 6: Last Known Valid Cache Fallback
    const fallback = globalCacheManager.getLastKnownValid(cacheKey);
    if (fallback && fallback.value) {
      this.freshness = 'stale';
      return {
        success: true,
        base: baseCurr,
        rates: fallback.value.rates,
        date: fallback.value.date,
        source: `${this.providerName} (Cached Backup)`,
        freshness: 'stale',
        timestamp: fallback.savedAt,
        warning: 'Live exchange server unreachable; showing last verified rates.'
      };
    }

    // Level 7: Data Temporarily Unavailable
    return {
      success: false,
      error: 'Currency data temporarily unavailable across all upstream providers.',
      base: baseCurr,
      rates: null
    };
  }

  /**
   * Convert amount from one currency to another
   */
  async convert(amount, from = 'USD', to = 'INR') {
    const amt = parseFloat(amount);
    if (!DataValidator.isValidNumber(amt, true)) {
      return { success: false, error: 'Amount must be a valid positive number.' };
    }

    const fromCurr = from.toUpperCase();
    const toCurr = to.toUpperCase();

    if (fromCurr === toCurr) {
      return {
        success: true,
        amount: amt,
        from: fromCurr,
        to: toCurr,
        result: amt,
        rate: 1.0,
        timestamp: new Date().toISOString()
      };
    }

    // Fetch base rates
    const ratesRes = await this.getLatestRates(fromCurr);
    if (!ratesRes.success || !ratesRes.rates) {
      // Try reverse with USD as base
      const usdRatesRes = await this.getLatestRates('USD');
      if (usdRatesRes.success && usdRatesRes.rates) {
        const fromRateUsd = usdRatesRes.rates[fromCurr];
        const toRateUsd = usdRatesRes.rates[toCurr];
        if (fromRateUsd && toRateUsd) {
          const crossRate = toRateUsd / fromRateUsd;
          const result = Number((amt * crossRate).toFixed(4));
          const conversionRecord = {
            id: `conv-${Date.now()}`,
            amount: amt,
            from: fromCurr,
            to: toCurr,
            rate: Number(crossRate.toFixed(4)),
            result,
            timestamp: new Date().toISOString()
          };
          this.conversionHistory.unshift(conversionRecord);
          if (this.conversionHistory.length > 20) this.conversionHistory.pop();

          return {
            success: true,
            amount: amt,
            from: fromCurr,
            to: toCurr,
            rate: crossRate,
            result,
            source: usdRatesRes.source,
            freshness: usdRatesRes.freshness,
            timestamp: conversionRecord.timestamp
          };
        }
      }
      return { success: false, error: 'Could not obtain exchange rate for selected pair.' };
    }

    const targetRate = ratesRes.rates[toCurr];
    if (!targetRate) {
      return { success: false, error: `Currency ${toCurr} not supported in rate table.` };
    }

    const result = Number((amt * targetRate).toFixed(4));
    const conversionRecord = {
      id: `conv-${Date.now()}`,
      amount: amt,
      from: fromCurr,
      to: toCurr,
      rate: Number(targetRate.toFixed(4)),
      result,
      timestamp: new Date().toISOString()
    };
    this.conversionHistory.unshift(conversionRecord);
    if (this.conversionHistory.length > 20) this.conversionHistory.pop();

    return {
      success: true,
      amount: amt,
      from: fromCurr,
      to: toCurr,
      rate: targetRate,
      result,
      source: ratesRes.source,
      freshness: ratesRes.freshness,
      timestamp: conversionRecord.timestamp
    };
  }

  /**
   * Historical currency rates (Frankfurter supports YYYY-MM-DD)
   */
  async getHistoricalRates(dateStr, base = 'USD') {
    const baseCurr = base.toUpperCase();
    const cacheKey = `historical_${baseCurr}_${dateStr}`;

    const cached = globalCacheManager.get(cacheKey);
    if (cached) return { success: true, base: baseCurr, date: dateStr, rates: cached, freshness: 'cached' };

    try {
      const url = `https://api.frankfurter.app/${dateStr}?from=${baseCurr}`;
      const { response, elapsed } = await this.fetchWithTimeout(url, {}, 5000);
      if (response.ok) {
        const json = await response.json();
        if (json.rates) {
          globalCacheManager.set(cacheKey, json.rates, 86400, 'currency'); // Cache 24h
          return {
            success: true,
            base: baseCurr,
            date: json.date || dateStr,
            rates: json.rates,
            freshness: 'live'
          };
        }
      }
    } catch (e) {
      console.warn(`Historical currency fetch failed for ${dateStr}:`, e.message);
    }

    return { success: false, error: `Historical rates not available for ${dateStr}` };
  }

  getConversionHistory() {
    return this.conversionHistory;
  }
}

export const currencyProvider = new CurrencyProvider();
export default currencyProvider;
