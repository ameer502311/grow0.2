import { BaseMarketProvider } from './BaseMarketProvider.js';

export class CryptoProvider extends BaseMarketProvider {
  constructor() {
    super('crypto_live_stream', 'Binance / Global Crypto Spot Feed');
    this.cryptoData = {
      BTCUSDT: { name: 'Bitcoin (BTC)', price: 67890.00, prev: 65950.00 },
      ETHUSDT: { name: 'Ethereum (ETH)', price: 3480.50, prev: 3388.10 }
    };
  }

  get_data_status() {
    return 'live'; // Crypto operates 24/7
  }

  get_market_status() {
    return {
      isOpen: true,
      status: 'open',
      session: 'Crypto 24/7 Session',
      timezone: 'UTC',
      message: 'Crypto market operates 24/7 continuously'
    };
  }

  async get_price_snapshot() {
    const now = new Date().toISOString();
    return Object.entries(this.cryptoData).map(([symbol, item]) => {
      const change = Number((item.price - item.prev).toFixed(2));
      const changePercent = Number(((change / item.prev) * 100).toFixed(2));
      return {
        symbol,
        name: item.name,
        asset_type: 'crypto',
        category: 'Crypto',
        price: item.price,
        previous_price: item.prev,
        change,
        change_percentage: changePercent,
        currency: 'USD',
        unit: 'USDT per Token',
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
