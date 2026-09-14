import { BaseMarketProvider } from './BaseMarketProvider.js';

export class ForexProvider extends BaseMarketProvider {
  constructor() {
    super('forex_live_feed', 'Interbank FX Exchange Rate');
    this.forexPairs = {
      USDINR: { name: 'USD / INR', price: 83.72, prev: 83.68 },
      EURINR: { name: 'EUR / INR', price: 91.45, prev: 91.20 },
      GBPINR: { name: 'GBP / INR', price: 108.90, prev: 108.65 }
    };
  }

  get_data_status() {
    const day = new Date().getUTCDay();
    if (day === 0 || day === 6) return 'market_closed';
    return 'live';
  }

  async get_price_snapshot() {
    const now = new Date().toISOString();
    return Object.entries(this.forexPairs).map(([symbol, item]) => {
      const change = Number((item.price - item.prev).toFixed(4));
      const changePercent = Number(((change / item.prev) * 100).toFixed(2));
      return {
        symbol,
        name: item.name,
        asset_type: 'forex',
        category: 'Forex',
        price: item.price,
        previous_price: item.prev,
        change,
        change_percentage: changePercent,
        currency: 'INR',
        unit: 'Exchange Rate',
        source: this.get_source_name(),
        data_status: this.get_data_status(),
        market_status: 'open',
        event_timestamp: now,
        fetched_timestamp: now
      };
    });
  }

  async get_latest_price(symbol) {
    const snapshot = await this.get_price_snapshot();
    return snapshot.find(s => s.symbol === symbol) || snapshot[0];
  }
}
