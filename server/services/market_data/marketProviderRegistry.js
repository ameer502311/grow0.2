import { GoldSilverProvider } from './goldSilverProvider.js';
import { StockProvider } from './stockProvider.js';
import { ForexProvider } from './forexProvider.js';
import { CryptoProvider } from './cryptoProvider.js';

export class MarketProviderRegistry {
  constructor() {
    this.providers = new Map([
      ['commodity', new GoldSilverProvider()],
      ['stock', new StockProvider()],
      ['forex', new ForexProvider()],
      ['crypto', new CryptoProvider()]
    ]);
  }

  getProvider(category) {
    return this.providers.get(category) || null;
  }

  getAllProviders() {
    return Array.from(this.providers.values());
  }

  async getAllSnapshots() {
    let allSnapshots = [];
    for (const provider of this.providers.values()) {
      try {
        const snapshot = await provider.get_price_snapshot();
        allSnapshots.push(...snapshot);
      } catch (err) {
        console.warn(`Error fetching snapshot from provider ${provider.providerId}:`, err.message);
      }
    }
    return allSnapshots;
  }
}

export const marketProviderRegistry = new MarketProviderRegistry();
