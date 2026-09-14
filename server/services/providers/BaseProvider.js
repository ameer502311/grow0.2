/**
 * Abstract Base Provider Adapter System
 * Standard interface for all investment platforms (Groww, Zerodha, SafeGold, Augmont, Aura Gold)
 */
export class BaseProvider {
  constructor(platformId, platformName, category) {
    if (this.constructor === BaseProvider) {
      throw new Error("Cannot instantiate abstract class BaseProvider directly.");
    }
    this.platformId = platformId;
    this.platformName = platformName;
    this.category = category;
  }

  get_connection_status() {
    return {
      platformId: this.platformId,
      platformName: this.platformName,
      status: 'NOT_CONNECTED',
      statusLabel: 'Not Connected',
      message: 'Platform connection is not configured.'
    };
  }

  async connect(config = {}) {
    throw new Error(`Method connect() must be implemented by ${this.constructor.name}`);
  }

  async disconnect(userId) {
    throw new Error(`Method disconnect() must be implemented by ${this.constructor.name}`);
  }

  async refresh_token(userId) {
    throw new Error(`Method refresh_token() must be implemented by ${this.constructor.name}`);
  }

  async get_account_profile(userId) {
    throw new Error(`Method get_account_profile() must be implemented by ${this.constructor.name}`);
  }

  async get_holdings(userId) {
    return [];
  }

  async get_positions(userId) {
    return [];
  }

  async get_transactions(userId) {
    return [];
  }

  async get_daily_updates(userId) {
    return { dailyChange: 0, dailyChangePercent: 0 };
  }

  async get_portfolio_value(userId) {
    const holdings = await this.get_holdings(userId);
    const investedAmount = holdings.reduce((sum, h) => sum + (h.invested_amount || 0), 0);
    const currentValue = holdings.reduce((sum, h) => sum + (h.current_value || 0), 0);
    const profitLoss = currentValue - investedAmount;
    const profitLossPercent = investedAmount > 0 ? Number(((profitLoss / investedAmount) * 100).toFixed(2)) : 0;

    return {
      invested_amount: investedAmount,
      current_value: currentValue,
      profit_loss: profitLoss,
      profit_loss_percentage: profitLossPercent,
      holdings_count: holdings.length
    };
  }

  async health_check() {
    return { status: 'OK', provider: this.platformId };
  }
}
