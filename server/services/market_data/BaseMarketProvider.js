/**
 * Base Market Data Provider Interface
 */
export class BaseMarketProvider {
  constructor(providerId, providerName) {
    if (this.constructor === BaseMarketProvider) {
      throw new Error("Cannot instantiate abstract class BaseMarketProvider directly.");
    }
    this.providerId = providerId;
    this.providerName = providerName;
  }

  get_source_name() {
    return this.providerName;
  }

  get_data_status() {
    return 'live'; // 'live' | 'delayed' | 'end_of_day' | 'market_closed' | 'unavailable' | 'provider_error'
  }

  async get_latest_price(symbol) {
    throw new Error(`Method get_latest_price() must be implemented by ${this.constructor.name}`);
  }

  async get_price_snapshot() {
    throw new Error(`Method get_price_snapshot() must be implemented by ${this.constructor.name}`);
  }

  async get_historical_prices(symbol, range = '7d') {
    return [];
  }

  get_market_status() {
    return {
      isOpen: true,
      status: 'open', // 'open' | 'closed' | 'extended_hours'
      session: 'regular',
      timezone: 'Asia/Kolkata',
      message: 'Market is open for trading'
    };
  }

  validate_response(data) {
    if (!data || typeof data.price !== 'number' || isNaN(data.price) || data.price <= 0) {
      return false;
    }
    return true;
  }
}
