/**
 * GROW 0.2 Universal Cache Manager
 * Provides in-memory TTL caching with category-specific expirations,
 * hit/miss tracking, and Level 6 "Last Known Valid" stale fallback retention.
 */

export class CacheManager {
  constructor() {
    this.cache = new Map();
    this.lastKnownValid = new Map(); // Retained indefinitely for emergency fallback
    this.stats = {
      hits: 0,
      misses: 0,
      staleHits: 0,
      sets: 0
    };

    // Category default TTLs in seconds
    this.categoryTTLs = {
      currency: 3600,   // 1 hour
      crypto: 60,       // 1 minute
      metals: 60,       // 1 minute
      stocks: 60,       // 1 minute
      news: 900,        // 15 minutes
      predictions: 300, // 5 minutes
      default: 60
    };
  }

  /**
   * Set a cache entry with specified TTL
   */
  set(key, value, ttlSeconds = null, category = 'default') {
    const ttl = ttlSeconds || this.categoryTTLs[category] || this.categoryTTLs.default;
    const expiresAt = Date.now() + (ttl * 1000);

    const entry = {
      value,
      category,
      ttl,
      savedAt: new Date().toISOString(),
      expiresAt
    };

    this.cache.set(key, entry);
    // Also save in lastKnownValid
    this.lastKnownValid.set(key, {
      value,
      savedAt: entry.savedAt
    });

    this.stats.sets++;
  }

  /**
   * Retrieve valid unexpired cache entry
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Level 6 Fallback: Get last known valid data even if expired
   */
  getLastKnownValid(key) {
    const fallback = this.lastKnownValid.get(key);
    if (fallback) {
      this.stats.staleHits++;
      return {
        value: fallback.value,
        savedAt: fallback.savedAt,
        isStale: true
      };
    }
    return null;
  }

  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRatio = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      activeEntries: this.cache.size,
      retainedFallbackEntries: this.lastKnownValid.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      staleHits: this.stats.staleHits,
      sets: this.stats.sets,
      hitRatio: `${hitRatio.toFixed(1)}%`
    };
  }
}

export const globalCacheManager = new CacheManager();
export default globalCacheManager;
