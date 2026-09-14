import { providerRegistry } from './providerRegistry.js';

// Global Storage for Platform Connections, Holdings & Audit Logs
const platformConnectionsStore = new Map();
const holdingsStore = new Map();
const auditLogsStore = [];

// Default 5 Registered Platforms
const registeredPlatforms = [
  {
    id: 'groww',
    name: 'Groww Mutual Funds & Equities',
    category: 'Mutual Funds & Equity',
    logo: '📈'
  },
  {
    id: 'zerodha',
    name: 'Zerodha Kite Connect',
    category: 'Brokerage / Stocks',
    logo: '💹'
  },
  {
    id: 'safegold',
    name: 'SafeGold 24K',
    category: 'Digital Gold Vault',
    logo: '🪙'
  },
  {
    id: 'augmont',
    name: 'Augmont Gold 24K',
    category: 'Digital Gold Vault',
    logo: '✨'
  },
  {
    id: 'aura_gold',
    name: 'Aura Gold 24K',
    category: 'Digital Gold Vault',
    logo: '👑'
  }
];

// Initialize platform connections store
function initializeStore() {
  registeredPlatforms.forEach(p => {
    const provider = providerRegistry.getProvider(p.id);
    const connStatus = provider ? provider.get_connection_status() : { status: 'PARTNER_API_REQUIRED', statusLabel: 'Partner API Required' };
    
    platformConnectionsStore.set(p.id, {
      ...p,
      ...connStatus,
      isConnected: false,
      connectedAt: null,
      lastSyncedAt: null,
      lastSyncStatus: 'IDLE',
      lastError: null,
      holdingsCount: 0,
      investedAmount: 0,
      currentValue: 0,
      profitLoss: 0,
      profitLossPercent: 0
    });
  });
}

initializeStore();

export class SyncManager {
  /**
   * Get all platform statuses with verified non-fake states
   */
  static getAllPlatforms() {
    return Array.from(platformConnectionsStore.values()).map(conn => {
      const provider = providerRegistry.getProvider(conn.id);
      const liveStatus = provider ? provider.get_connection_status() : {};
      
      // If not officially connected, strictly enforce ₹0 balances
      if (!conn.isConnected) {
        return {
          ...conn,
          ...liveStatus,
          isConnected: false,
          investedAmount: 0,
          currentValue: 0,
          profitLoss: 0,
          profitLossPercent: 0,
          holdingsCount: 0,
          message: conn.isConnected ? conn.message : (liveStatus.message || "No verified holdings available")
        };
      }

      return conn;
    });
  }

  /**
   * Get specific platform status
   */
  static getPlatform(platformId) {
    const conn = platformConnectionsStore.get(platformId);
    if (!conn) return null;
    const provider = providerRegistry.getProvider(platformId);
    const liveStatus = provider ? provider.get_connection_status() : {};
    
    if (!conn.isConnected) {
      return {
        ...conn,
        ...liveStatus,
        isConnected: false,
        investedAmount: 0,
        currentValue: 0,
        profitLoss: 0,
        holdingsCount: 0
      };
    }
    return conn;
  }

  /**
   * Connect platform using official credentials / OAuth
   */
  static async connectPlatform(platformId, config = {}) {
    const provider = providerRegistry.getProvider(platformId);
    if (!provider) throw new Error(`Provider ${platformId} not supported.`);

    const conn = platformConnectionsStore.get(platformId);
    
    try {
      const authResult = await provider.connect(config);
      
      conn.isConnected = true;
      conn.status = 'CONNECTED';
      conn.statusLabel = 'Connected & Authorized';
      conn.message = 'Official provider authorization active.';
      conn.connectedAt = new Date().toISOString();
      conn.lastError = null;

      platformConnectionsStore.set(platformId, conn);
      this.recordAuditLog(platformId, 'CONNECT_SUCCESS', 'Platform connected successfully');
      
      // Perform initial holdings sync
      await this.syncPlatform(platformId);

      return conn;
    } catch (err) {
      conn.isConnected = false;
      const statusObj = provider.get_connection_status();
      conn.status = statusObj.status;
      conn.statusLabel = statusObj.statusLabel;
      conn.message = err.message;
      conn.lastError = err.message;

      platformConnectionsStore.set(platformId, conn);
      this.recordAuditLog(platformId, 'CONNECT_FAILED', err.message);
      throw err;
    }
  }

  /**
   * Disconnect platform and purge tokens
   */
  static async disconnectPlatform(platformId) {
    const provider = providerRegistry.getProvider(platformId);
    const conn = platformConnectionsStore.get(platformId);

    if (provider && conn) {
      try {
        await provider.disconnect('u-101');
      } catch (e) {}

      const providerStatus = provider.get_connection_status();
      conn.isConnected = false;
      conn.status = providerStatus.status;
      conn.statusLabel = providerStatus.statusLabel;
      conn.message = providerStatus.message;
      conn.connectedAt = null;
      conn.lastSyncedAt = null;
      conn.investedAmount = 0;
      conn.currentValue = 0;
      conn.profitLoss = 0;
      conn.holdingsCount = 0;

      holdingsStore.delete(platformId);
      platformConnectionsStore.set(platformId, conn);

      this.recordAuditLog(platformId, 'DISCONNECT', 'Platform disconnected and local tokens purged');
    }

    return conn;
  }

  /**
   * Synchronize holdings for a single platform in Common Normalized Format
   */
  static async syncPlatform(platformId) {
    const provider = providerRegistry.getProvider(platformId);
    const conn = platformConnectionsStore.get(platformId);
    if (!provider || !conn) throw new Error(`Platform ${platformId} not found.`);

    if (!conn.isConnected) {
      throw new Error(`Cannot sync ${conn.name}: ${conn.message || 'Partner API Required'}`);
    }

    conn.lastSyncStatus = 'SYNCING';
    platformConnectionsStore.set(platformId, conn);

    try {
      const holdings = await provider.get_holdings('u-101');
      holdingsStore.set(platformId, holdings);

      const val = await provider.get_portfolio_value('u-101');
      conn.investedAmount = val.invested_amount;
      conn.currentValue = val.current_value;
      conn.profitLoss = val.profit_loss;
      conn.profitLossPercent = val.profit_loss_percentage;
      conn.holdingsCount = val.holdings_count;
      conn.lastSyncedAt = new Date().toISOString();
      conn.lastSyncStatus = 'SUCCESS';
      conn.lastError = null;

      platformConnectionsStore.set(platformId, conn);
      this.recordAuditLog(platformId, 'SYNC_SUCCESS', `Synced ${holdings.length} holdings. Total value: ₹${val.current_value}`);

      // Common Normalized Response Structure
      return {
        platform: platformId,
        account_id: holdings[0]?.account_id || `ext-${platformId}-101`,
        connection_status: 'connected',
        holdings,
        transactions: [],
        invested_amount: val.invested_amount,
        current_value: val.current_value,
        profit_loss: val.profit_loss,
        currency: 'INR',
        source: holdings[0]?.source || 'Official Provider API',
        synced_at: conn.lastSyncedAt,
        data_status: 'live'
      };
    } catch (err) {
      conn.lastSyncStatus = 'FAILED';
      conn.lastError = err.message;
      platformConnectionsStore.set(platformId, conn);
      this.recordAuditLog(platformId, 'SYNC_FAILED', err.message);
      throw err;
    }
  }

  /**
   * Synchronize all connected platforms
   */
  static async syncAllPlatforms() {
    const results = [];
    for (const [platformId, conn] of platformConnectionsStore.entries()) {
      if (conn.isConnected) {
        try {
          const res = await this.syncPlatform(platformId);
          results.push(res);
        } catch (err) {
          results.push({ platform: platformId, status: 'FAILED', error: err.message });
        }
      }
    }
    return results;
  }

  /**
   * Get Aggregated Portfolio Summary across all verified connected holdings
   */
  static getPortfolioSummary() {
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let allHoldings = [];
    const platformBreakdown = [];

    for (const [platformId, conn] of platformConnectionsStore.entries()) {
      const platformHoldings = holdingsStore.get(platformId) || [];
      if (conn.isConnected && platformHoldings.length > 0) {
        totalInvested += conn.investedAmount;
        totalCurrentValue += conn.currentValue;
        allHoldings.push(...platformHoldings);

        platformBreakdown.push({
          platform: conn.name,
          platformId: conn.id,
          investedAmount: conn.investedAmount,
          currentValue: conn.currentValue,
          profitLoss: conn.profitLoss,
          holdingsCount: conn.holdingsCount,
          lastSyncedAt: conn.lastSyncedAt,
          source: platformHoldings[0]?.source || 'Official Provider API'
        });
      }
    }

    const totalProfitLoss = totalCurrentValue - totalInvested;
    const totalProfitLossPercent = totalInvested > 0 ? Number(((totalProfitLoss / totalInvested) * 100).toFixed(2)) : 0;

    return {
      totalInvested,
      totalCurrentValue,
      totalProfitLoss,
      totalProfitLossPercent,
      totalHoldingsCount: allHoldings.length,
      connectedPlatformsCount: platformBreakdown.length,
      platformBreakdown,
      holdings: allHoldings,
      as_of: new Date().toISOString(),
      disclaimer: "Data reflects verified synchronized balances from official provider APIs."
    };
  }

  /**
   * Record Audit Log Event
   */
  static recordAuditLog(platformId, eventType, message) {
    auditLogsStore.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      platformId,
      eventType,
      message
    });
    if (auditLogsStore.length > 100) auditLogsStore.pop();
  }

  /**
   * Get Sync History Audit Logs
   */
  static getAuditLogs() {
    return auditLogsStore;
  }
}
