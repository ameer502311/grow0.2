/**
 * GROW 0.2 Data Validation Service
 * Ensures all external and ingested financial data satisfies strict type, range, and authenticity constraints.
 * Rejects NaN, negative numbers, missing fields, or stale/corrupted payloads.
 */

export class DataValidator {
  /**
   * Validate that a value is a valid positive number
   */
  static isValidNumber(val, allowZero = false) {
    if (val === null || val === undefined || typeof val === 'boolean') return false;
    const num = Number(val);
    if (isNaN(num) || !isFinite(num)) return false;
    return allowZero ? num >= 0 : num > 0;
  }

  /**
   * Validate ISO timestamp or date
   */
  static isValidTimestamp(ts) {
    if (!ts) return false;
    const d = new Date(ts);
    return !isNaN(d.getTime());
  }

  /**
   * Validate standard ISO currency code (INR, USD, EUR, etc.)
   */
  static isValidCurrency(curr) {
    if (!curr || typeof curr !== 'string') return false;
    return /^[A-Z]{3}$/.test(curr.trim().toUpperCase());
  }

  /**
   * Validate market price item
   * Required: symbol, price (> 0), currency
   */
  static validateMarketItem(item) {
    if (!item || typeof item !== 'object') {
      return { valid: false, reason: 'Market item must be a non-null object' };
    }

    if (!item.symbol || typeof item.symbol !== 'string' || item.symbol.trim().length === 0) {
      return { valid: false, reason: 'Missing or invalid symbol' };
    }

    if (!this.isValidNumber(item.price)) {
      return { valid: false, reason: `Invalid price for ${item.symbol}: ${item.price}` };
    }

    if (item.currency && !this.isValidCurrency(item.currency)) {
      return { valid: false, reason: `Invalid currency for ${item.symbol}: ${item.currency}` };
    }

    return { valid: true };
  }

  /**
   * Validate currency conversion payload
   */
  static validateCurrencyRates(baseCurrency, rates) {
    if (!this.isValidCurrency(baseCurrency)) {
      return { valid: false, reason: `Invalid base currency: ${baseCurrency}` };
    }
    if (!rates || typeof rates !== 'object') {
      return { valid: false, reason: 'Rates must be a key-value object' };
    }
    const rateEntries = Object.entries(rates);
    if (rateEntries.length === 0) {
      return { valid: false, reason: 'Rates object is empty' };
    }
    for (const [curr, rate] of rateEntries) {
      if (!this.isValidCurrency(curr) || !this.isValidNumber(rate)) {
        return { valid: false, reason: `Invalid rate entry: ${curr} = ${rate}` };
      }
    }
    return { valid: true };
  }

  /**
   * Validate news item
   */
  static validateNewsItem(item) {
    if (!item || typeof item !== 'object') return false;
    if (!item.title || typeof item.title !== 'string' || item.title.trim().length < 5) return false;
    if (!item.url || typeof item.url !== 'string') return false;
    return true;
  }

  /**
   * Filter and sanitize a list of market items
   */
  static sanitizeMarketList(items) {
    if (!Array.isArray(items)) return [];
    return items.filter(item => {
      const { valid } = this.validateMarketItem(item);
      return valid;
    });
  }
}

export default DataValidator;
