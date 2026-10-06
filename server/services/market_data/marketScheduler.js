import { universalApiManager } from '../api-manager/UniversalApiManager.js';
import { checkAndTriggerPriceAlerts } from './priceAlertsService.js';

let isSchedulerRunning = false;
let marketCache = [];
let lastFetchedAt = null;

export async function refreshMarketData(io = null) {
  try {
    const snapshots = await universalApiManager.refreshAllMarketFeeds();
    marketCache = snapshots;
    lastFetchedAt = new Date().toISOString();

    // Check for triggered user price alerts
    checkAndTriggerPriceAlerts(snapshots, io);

    return {
      success: true,
      count: snapshots.length,
      fetched_at: lastFetchedAt,
      data: snapshots
    };
  } catch (err) {
    console.error('⚠️ Market Data Refresh Scheduler Error:', err.message);
    return {
      success: false,
      error: err.message,
      fetched_at: new Date().toISOString()
    };
  }
}

export function startMarketScheduler(io = null) {
  if (isSchedulerRunning) {
    console.log('ℹ️ Universal Market scheduler is already active. Skipping duplicate startup.');
    return;
  }

  isSchedulerRunning = true;
  console.log('⏰ Universal Live Market Data Scheduler initialized (Automated REST Refresh every 60s).');

  // Initialize universal API manager
  universalApiManager.initialize(io);

  // Initial immediate refresh on boot
  refreshMarketData(io);

  // 60-Second Automated Refresh Loop
  setInterval(() => {
    refreshMarketData(io);
  }, 60 * 1000);
}

export function getCachedMarketPrices() {
  return marketCache;
}

export function getMarketSchedulerStatus() {
  return {
    isSchedulerRunning,
    cachedSymbolCount: marketCache.length,
    lastFetchedAt,
    refreshIntervalSeconds: 60
  };
}
