import express from 'express';
import { GrowwProvider } from '../services/providers/GrowwProvider.js';
import { ZerodhaProvider } from '../services/providers/ZerodhaProvider.js';
import { INDmoneyProvider } from '../services/providers/INDmoneyProvider.js';

export function createPortfolioRouter(memoryStore = {}, io = null) {
  const router = express.Router();
  
  const providers = {
    groww: new GrowwProvider(),
    zerodha: new ZerodhaProvider(),
    indmoney: new INDmoneyProvider()
  };

  let connectedPlatformsStore = [
    {
      id: 'p-1',
      platformId: 'safegold',
      name: 'SafeGold / Augmont 24K',
      category: 'Digital Gold',
      isConnected: false,
      lastSynced: null,
      holdingsValue: 0,
      apiKeyMasked: '',
      logo: 'https://cdn-icons-png.flaticon.com/512/2916/2916115.png'
    },
    {
      id: 'p-2',
      platformId: 'groww',
      name: 'Groww Mutual Funds & SIPs',
      category: 'Mutual Funds',
      isConnected: false,
      lastSynced: null,
      holdingsValue: 0,
      apiKeyMasked: '',
      logo: 'https://cdn-icons-png.flaticon.com/512/3408/3408545.png'
    },
    {
      id: 'p-3',
      platformId: 'zerodha',
      name: 'Zerodha Kite Equity',
      category: 'Brokerage / Stocks',
      isConnected: false,
      lastSynced: null,
      holdingsValue: 0,
      apiKeyMasked: '',
      logo: 'https://cdn-icons-png.flaticon.com/512/2422/2422796.png'
    },
    {
      id: 'p-4',
      platformId: 'indmoney',
      name: 'INDmoney US Equities',
      category: 'Wealth Manager',
      isConnected: false,
      lastSynced: null,
      holdingsValue: 0,
      apiKeyMasked: '',
      logo: 'https://cdn-icons-png.flaticon.com/512/2953/2953361.png'
    }
  ];

  // GET /api/portfolio/platforms
  router.get('/platforms', (req, res) => {
    res.json({ success: true, data: connectedPlatformsStore });
  });

  // POST /api/portfolio/connect
  router.post('/connect', async (req, res) => {
    const { platformId, apiKey } = req.body;
    const provider = providers[platformId];
    
    if (provider) {
      const conn = await provider.connectAccount({ apiKey });
      const target = connectedPlatformsStore.find(p => p.platformId === platformId);
      if (target) {
        target.isConnected = true;
        target.apiKeyMasked = conn.apiKeyMasked;
        target.lastSynced = new Date().toISOString();
      }
      return res.json({ success: true, data: target });
    }

    res.status(404).json({ success: false, error: 'Platform provider not supported' });
  });

  // POST /api/portfolio/sync
  router.post('/sync', async (req, res) => {
    const { platformId } = req.body;
    const provider = providers[platformId];

    if (provider) {
      const result = await provider.syncHoldings({ userId: 'u-101' });
      const target = connectedPlatformsStore.find(p => p.platformId === platformId);
      if (target) {
        target.lastSynced = result.lastSynced;
        target.holdingsValue = result.holdingsValue;
      }
      return res.json({ success: true, data: result });
    }

    res.status(404).json({ success: false, error: 'Platform provider not supported' });
  });

  // GET /api/portfolio/holdings
  router.get('/holdings', async (req, res) => {
    let allHoldings = [];
    for (const key of Object.keys(providers)) {
      const data = await providers[key].syncHoldings({ userId: 'u-101' });
      allHoldings = allHoldings.concat(data.holdings || []);
    }

    const totalPortfolioValue = connectedPlatformsStore.reduce((a, c) => a + (c.holdingsValue || 0), 0);

    res.json({
      success: true,
      data: {
        totalPortfolioValue,
        platformsCount: connectedPlatformsStore.filter(p => p.isConnected).length,
        holdings: allHoldings
      }
    });
  });

  // GET /api/portfolio/ai-rebalance
  router.get('/ai-rebalance', (req, res) => {
    const totalVal = connectedPlatformsStore.reduce((a, c) => a + (c.holdingsValue || 0), 0);
    const goldVal = connectedPlatformsStore.find(p => p.platformId === 'safegold')?.holdingsValue || 0;
    const mfVal = connectedPlatformsStore.find(p => p.platformId === 'groww')?.holdingsValue || 0;
    const stockVal = connectedPlatformsStore.find(p => p.platformId === 'zerodha')?.holdingsValue || 0;

    const goldPercent = totalVal > 0 ? Number(((goldVal / totalVal) * 100).toFixed(1)) : 0;
    const mfPercent = totalVal > 0 ? Number(((mfVal / totalVal) * 100).toFixed(1)) : 0;
    const stockPercent = totalVal > 0 ? Number(((stockVal / totalVal) * 100).toFixed(1)) : 0;

    const rebalancingTips = totalVal > 0 ? [
      `Your Mutual Fund allocation is ${mfPercent}% (Target: 50%). Step up equity SIPs by 5%.`,
      `Your 24K Gold allocation is ${goldPercent}% (Target: 20%). Maintain current SafeGold SIP holding.`,
      `Your Direct Stock portfolio is ${stockPercent}% (Target: 30%). Rebalance large-cap equity on market dips.`
    ] : [
      'Connect your Groww, SafeGold, or Zerodha accounts to see real-time AI rebalancing recommendations.'
    ];

    res.json({
      success: true,
      data: {
        currentAllocation: {
          mutualFundsPercent: mfPercent,
          stocksPercent: stockPercent,
          goldPercent: goldPercent
        },
        targetAllocation: {
          mutualFundsPercent: 50.0,
          stocksPercent: 30.0,
          goldPercent: 20.0
        },
        rebalancingTips,
        healthRating: totalVal > 0 ? 'Optimal Asset Allocation' : 'Pending Account Sync'
      }
    });
  });

  return router;
}
