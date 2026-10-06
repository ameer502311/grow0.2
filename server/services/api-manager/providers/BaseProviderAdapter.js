/**
 * GROW 0.2 Base Data Provider Adapter
 * Common architectural contract required for all external data providers.
 */

export class BaseProviderAdapter {
  constructor({
    providerId,
    providerName,
    dataType,
    authType = 'keyless',
    endpoint = '',
    sourceUrl = '',
    priority = 1
  }) {
    if (this.constructor === BaseProviderAdapter) {
      throw new Error("Cannot instantiate BaseProviderAdapter directly. Subclasses must implement concrete fetch methods.");
    }

    this.providerId = providerId;
    this.providerName = providerName;
    this.dataType = dataType;               // 'currency' | 'crypto' | 'metals' | 'stocks' | 'news' | 'ai'
    this.authType = authType;               // 'keyless' | 'api_key' | 'rss' | 'oauth'
    this.endpoint = endpoint;
    this.sourceUrl = sourceUrl || endpoint;
    this.priority = priority;               // 1 = Free keyless, 2 = Configured API key, 3 = Official public, etc.

    // Telemetry & Lifecycle state
    this.status = 'idle';                   // 'healthy' | 'degraded' | 'failed' | 'idle'
    this.lastSuccessfulUpdate = null;
    this.lastFailure = null;
    this.responseTimeMs = 0;
    this.timestamp = null;
    this.freshness = 'live';                // 'live' | 'cached' | 'delayed' | 'stale'
    this.retryCount = 0;
    this.consecutiveFailures = 0;
    this.errorDetails = null;
  }

  /**
   * Helper to perform HTTP request with timeout protection
   */
  async fetchWithTimeout(url, options = {}, timeoutMs = 9000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const startTime = Date.now();
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;
      return { response, elapsed };
    } catch (err) {
      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs}ms: ${url}`);
      }
      throw err;
    }
  }

  recordSuccess(responseTimeMs = 0, customStatus = 'healthy') {
    this.status = customStatus;
    this.responseTimeMs = Math.round(responseTimeMs);
    this.lastSuccessfulUpdate = new Date().toISOString();
    this.timestamp = this.lastSuccessfulUpdate;
    this.consecutiveFailures = 0;
    this.errorDetails = null;
  }

  recordFailure(error, customStatus = 'degraded') {
    this.consecutiveFailures++;
    this.retryCount++;
    this.status = this.consecutiveFailures > 2 ? 'failed' : customStatus;
    this.lastFailure = new Date().toISOString();
    this.errorDetails = error ? error.message : 'Unknown provider error';
    console.warn(`⚠️ [${this.providerName}] Failure recorded (${this.consecutiveFailures} consecutive):`, this.errorDetails);
  }

  /**
   * Return telemetry metrics (Safe for public/admin presentation - zero secrets)
   */
  getStatus() {
    return {
      providerId: this.providerId,
      providerName: this.providerName,
      dataType: this.dataType,
      authType: this.authType,
      endpoint: this.endpoint,
      sourceUrl: this.sourceUrl,
      priority: this.priority,
      status: this.status,
      freshness: this.freshness,
      responseTimeMs: this.responseTimeMs,
      lastSuccessfulUpdate: this.lastSuccessfulUpdate,
      lastFailure: this.lastFailure,
      consecutiveFailures: this.consecutiveFailures,
      retryCount: this.retryCount,
      errorDetails: this.errorDetails
    };
  }

  /**
   * Abstract fetch implementation
   */
  async fetchData() {
    throw new Error(`fetchData() not implemented in provider ${this.providerName}`);
  }
}

export default BaseProviderAdapter;
