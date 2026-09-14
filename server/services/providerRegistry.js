import { GrowwProvider } from './providers/GrowwProvider.js';
import { ZerodhaProvider } from './providers/ZerodhaProvider.js';
import { SafeGoldProvider } from './providers/SafeGoldProvider.js';
import { AugmontProvider } from './providers/AugmontProvider.js';
import { AuraGoldProvider } from './providers/AuraGoldProvider.js';

export class ProviderRegistry {
  constructor() {
    this.providers = new Map([
      ['groww', new GrowwProvider()],
      ['zerodha', new ZerodhaProvider()],
      ['safegold', new SafeGoldProvider()],
      ['augmont', new AugmontProvider()],
      ['aura_gold', new AuraGoldProvider()]
    ]);
  }

  getProvider(platformId) {
    return this.providers.get(platformId) || null;
  }

  getAllProviders() {
    return Array.from(this.providers.values());
  }

  getAllStatuses() {
    return Array.from(this.providers.values()).map(p => p.get_connection_status());
  }
}

export const providerRegistry = new ProviderRegistry();
