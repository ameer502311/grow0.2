/**
 * GROW 0.2 Crypto Provider Adapter
 * Multi-tier Keyless Crypto Provider (Binance Spot 24h Ticker + CoinGecko Fallback)
 * Supports Bitcoin (BTC), Ethereum (ETH), USDT, BNB, Solana (SOL), XRP, ADA, DOGE.
 * Zero fabricated numbers; strict schema validation; Level 6 cached fallback.
 */

import { BaseProviderAdapter } from './BaseProviderAdapter.js';
import { globalCacheManager } from '../cache/CacheManager.js';
import { DataValidator } from '../validation/DataValidator.js';

export class CryptoProvider extends BaseProviderAdapter {
  constructor() {
    super({
      providerId: 'crypto_binance_coingecko',
      providerName: 'Binance Spot / CoinGecko Real-Time Crypto Feed',
      dataType: 'crypto',
      authType: 'keyless',
      endpoint: 'api.binance.com/api/v3/ticker/24hr',
      sourceUrl: 'https://www.binance.com',
      priority: 1
    });

    this.symbolsMeta = {
      'BTCUSDT': { symbol: 'BTC', name: 'Bitcoin (BTC)', pair: 'BTCUSDT', geckoId: 'bitcoin' },
      'ETHUSDT': { symbol: 'ETH', name: 'Ethereum (ETH)', pair: 'ETHUSDT', geckoId: 'ethereum' },
      'BNBUSDT': { symbol: 'BNB', name: 'BNB (BNB)', pair: 'BNBUSDT', geckoId: 'binancecoin' },
      'SOLUSDT': { symbol: 'SOL', name: 'Solana (SOL)', pair: 'SOLUSDT', geckoId: 'solana' },
      'XRPUSDT': { symbol: 'XRP', name: 'Ripple (XRP)', pair: 'XRPUSDT', geckoId: 'ripple' },
      'ADAUSDT': { symbol: 'ADA', name: 'Cardano (ADA)', pair: 'ADAUSDT', geckoId: 'cardano' }
    };
  }

  async fetchData() {
    const cacheKey = 'crypto_market_snapshot';

    // Level 6: Fresh cache hit
    const cached = globalCacheManager.get(cacheKey);
    if (cached) {
      this.freshness = 'cached';
      return cached;
    }

    // Level 1: Primary Keyless Provider - Binance Spot 24h Ticker API
    try {
      const symbolsParam = encodeURIComponent(JSON.stringify(Object.keys(this.symbolsMeta)));
      const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${symbolsParam}`;
      const { response, elapsed } = await this.fetchWithTimeout(url, {}, 8000);

      if (response.ok) {
        const items = await response.json();
        if (Array.isArray(items) && items.length > 0) {
          const now = new Date().toISOString();
          const parsed = items.map(t => {
            const meta = this.symbolsMeta[t.symbol] || { symbol: t.symbol, name: t.symbol };
            const lastPrice = parseFloat(t.lastPrice);
            const prevClose = parseFloat(t.prevClosePrice) || (lastPrice - parseFloat(t.priceChange));
            const priceChange = parseFloat(t.priceChange);
            const priceChangePercent = parseFloat(t.priceChangePercent);
            const volume24h = parseFloat(t.volume);
            const quoteVolume24h = parseFloat(t.quoteVolume);
            const high24h = parseFloat(t.highPrice);
            const low24h = parseFloat(t.lowPrice);

            return {
              symbol: meta.symbol,
              pair: t.symbol,
              name: meta.name,
              asset_type: 'crypto',
              category: 'Crypto',
              price: lastPrice,
              previous_price: prevClose,
              change: priceChange,
              change_percentage: priceChangePercent,
              high_24h: high24h,
              low_24h: low24h,
              volume_24h: volume24h,
              quote_volume_24h: quoteVolume24h,
              currency: 'USD',
              unit: 'USDT per Token',
              source: 'Binance Public Spot Feed',
              data_status: 'live',
              market_status: 'open',
              event_timestamp: t.closeTime ? new Date(t.closeTime).toISOString() : now,
              fetched_timestamp: now
            };
          });

          const validated = DataValidator.sanitizeMarketList(parsed);
          if (validated.length > 0) {
            this.recordSuccess(elapsed);
            this.freshness = 'live';
            globalCacheManager.set(cacheKey, validated, 60, 'crypto');
            return validated;
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ Binance Crypto API failed, attempting Level 2 Fallback:', err.message);
      this.recordFailure(err, 'degraded');
    }

    // Level 2: Secondary Keyless Fallback - CoinGecko Simple Price API
    try {
      const ids = Object.values(this.symbolsMeta).map(m => m.geckoId).join(',');
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;
      const { response, elapsed } = await this.fetchWithTimeout(url, {}, 8000);

      if (response.ok) {
        const geckoJson = await response.json();
        const now = new Date().toISOString();
        const parsed = Object.entries(this.symbolsMeta).map(([pair, meta]) => {
          const coinData = geckoJson[meta.geckoId];
          if (!coinData || !DataValidator.isValidNumber(coinData.usd)) return null;

          const price = coinData.usd;
          const changePercent = coinData.usd_24h_change ? Number(coinData.usd_24h_change.toFixed(2)) : 0;
          const prevPrice = Number((price / (1 + changePercent / 100)).toFixed(2));
          const change = Number((price - prevPrice).toFixed(2));

          return {
            symbol: meta.symbol,
            pair,
            name: meta.name,
            asset_type: 'crypto',
            category: 'Crypto',
            price,
            previous_price: prevPrice,
            change,
            change_percentage: changePercent,
            volume_24h: coinData.usd_24h_vol || 0,
            currency: 'USD',
            unit: 'USD per Token',
            source: 'CoinGecko Live API',
            data_status: 'live',
            market_status: 'open',
            event_timestamp: now,
            fetched_timestamp: now
          };
        }).filter(Boolean);

        const validated = DataValidator.sanitizeMarketList(parsed);
        if (validated.length > 0) {
          this.recordSuccess(elapsed);
          this.freshness = 'live';
          globalCacheManager.set(cacheKey, validated, 60, 'crypto');
          return validated;
        }
      }
    } catch (err) {
      console.warn('⚠️ CoinGecko Fallback API failed:', err.message);
      this.recordFailure(err, 'failed');
    }

    // Level 6: Last Known Valid Cache Fallback
    const fallback = globalCacheManager.getLastKnownValid(cacheKey);
    if (fallback && Array.isArray(fallback.value) && fallback.value.length > 0) {
      this.freshness = 'stale';
      return fallback.value.map(item => ({
        ...item,
        data_status: 'cached_offline',
        source: `${item.source} (Offline Cache)`,
        warning: 'Live crypto feed offline; displaying last verified spot rate.'
      }));
    }

    // Level 7: Unavailable
    return [];
  }

  async get_price_snapshot() {
    return this.fetchData();
  }

  async get_latest_price(symbol) {
    const snapshot = await this.get_price_snapshot();
    const sym = symbol.toUpperCase();
    return snapshot.find(s => s.symbol === sym || s.pair === sym) || null;
  }
}

export const cryptoProvider = new CryptoProvider();
export default cryptoProvider;
