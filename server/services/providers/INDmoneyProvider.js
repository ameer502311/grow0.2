import { ExternalBrokerProvider } from './ExternalBrokerProvider.js';

export class INDmoneyProvider extends ExternalBrokerProvider {
  constructor() {
    super();
    this.platformId = 'indmoney';
    this.platformName = 'INDmoney Wealth & US Stocks';
  }

  async connectAccount({ apiKey }) {
    const maskedKey = apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : 'IND_MOCK_AUTH_TOKEN';
    return {
      success: true,
      platformId: this.platformId,
      apiKeyMasked: maskedKey,
      connectedAt: new Date().toISOString()
    };
  }

  async syncHoldings({ userId }) {
    const holdings = [
      { id: 'ind-us-1', name: 'Apple Inc (AAPL)', category: 'US Stocks', units: 5, buyPriceUsd: 175, currentPriceUsd: 224, investedAmount: 72600, currentValue: 93000, pnlPercent: 28.0 },
      { id: 'ind-us-2', name: 'Microsoft Corp (MSFT)', category: 'US Stocks', units: 3, buyPriceUsd: 380, currentPriceUsd: 448, investedAmount: 94600, currentValue: 111500, pnlPercent: 17.8 }
    ];

    const totalValue = holdings.reduce((a, c) => a + c.currentValue, 0);

    return {
      platformId: this.platformId,
      holdingsValue: totalValue,
      lastSynced: new Date().toISOString(),
      holdings
    };
  }

  async disconnectAccount({ userId }) {
    return { success: true, platformId: this.platformId };
  }
}
