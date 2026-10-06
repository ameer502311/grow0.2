import http from 'http';

async function testAll() {
  console.log('====================================================');
  console.log('🔍 STARTING GROW 0.2 COMPREHENSIVE API & DATA AUDIT');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;
  const results = [];

  function record(name, isSuccess, details) {
    if (isSuccess) {
      console.log(`✅ [PASS] ${name}: ${details}`);
      passed++;
      results.push({ name, status: 'PASS', details });
    } else {
      console.error(`❌ [FAIL] ${name}: ${details}`);
      failed++;
      results.push({ name, status: 'FAIL', details });
    }
  }

  // 1. EXTERNAL SCRAPING / LIVE MARKET DATA APIS TEST
  console.log('--- 1. TESTING EXTERNAL SCRAPING & PROVIDER APIS ---');
  try {
    const goldApiStart = Date.now();
    const goldRes = await fetch('https://api.gold-api.com/price/XAU');
    const goldDuration = Date.now() - goldApiStart;
    if (goldRes.ok) {
      const goldData = await goldRes.json();
      record(
        'Gold Spot API (api.gold-api.com/price/XAU)',
        goldData.price > 0,
        `HTTP ${goldRes.status} in ${goldDuration}ms | Price: $${goldData.price} USD/oz`
      );
    } else {
      record('Gold Spot API', false, `Status ${goldRes.status}`);
    }
  } catch (err) {
    record('Gold Spot API', false, `Network error: ${err.message}`);
  }

  try {
    const silverApiStart = Date.now();
    const silverRes = await fetch('https://api.gold-api.com/price/XAG');
    const silverDuration = Date.now() - silverApiStart;
    if (silverRes.ok) {
      const silverData = await silverRes.json();
      record(
        'Silver Spot API (api.gold-api.com/price/XAG)',
        silverData.price > 0,
        `HTTP ${silverRes.status} in ${silverDuration}ms | Price: $${silverData.price} USD/oz`
      );
    } else {
      record('Silver Spot API', false, `Status ${silverRes.status}`);
    }
  } catch (err) {
    record('Silver Spot API', false, `Network error: ${err.message}`);
  }

  // 2. BACKEND API ENDPOINTS AUDIT
  console.log('\n--- 2. TESTING BACKEND REST ENDPOINTS ON PORT 5000 ---');
  const endpoints = [
    { url: 'http://localhost:5000/api/health', method: 'GET', check: d => d.status === 'OK' },
    { url: 'http://localhost:5000/api/markets/live-prices', method: 'GET', check: d => d.success && d.data.length > 0 },
    { url: 'http://localhost:5000/api/markets', method: 'GET', check: d => d.success && Array.isArray(d.data) && d.data.length > 0 },
    { url: 'http://localhost:5000/api/markets/status', method: 'GET', check: d => d.success && d.scheduler.isSchedulerRunning },
    { url: 'http://localhost:5000/api/markets/diagnostics', method: 'GET', check: d => d.success && d.diagnostics },
    { url: 'http://localhost:5000/api/markets/snapshot', method: 'GET', check: d => d.success && d.data.length > 0 },
    { url: 'http://localhost:5000/api/markets/news', method: 'GET', check: d => d.success && d.data.length > 0 },
    { url: 'http://localhost:5000/api/markets/alerts', method: 'GET', check: d => d.success && Array.isArray(d.alerts) },
    { url: 'http://localhost:5000/api/market-prices', method: 'GET', check: d => d.success && d.data.gold['24k'] > 0 },
    { url: 'http://localhost:5000/api/market-search?q=today+gold+price', method: 'GET', check: d => d.success && d.data.intent === 'gold_price' },
    { url: 'http://localhost:5000/api/market-search?q=nifty', method: 'GET', check: d => d.success && d.data.intent === 'stock_price' },
    { url: 'http://localhost:5000/api/search-history', method: 'GET', check: d => d.success && Array.isArray(d.data) },
    { url: 'http://localhost:5000/api/user/profile', method: 'GET', check: d => d.success && d.data.email },
    { url: 'http://localhost:5000/api/finance/incomes', method: 'GET', check: d => d.success && Array.isArray(d.data) },
    { url: 'http://localhost:5000/api/finance/expenses', method: 'GET', check: d => d.success && Array.isArray(d.data) },
    { url: 'http://localhost:5000/api/investments', method: 'GET', check: d => d.success && Array.isArray(d.data) },
    { url: 'http://localhost:5000/api/loans', method: 'GET', check: d => d.success && Array.isArray(d.data) },
    { url: 'http://localhost:5000/api/payments/transactions', method: 'GET', check: d => d.success && Array.isArray(d.data) },
    { url: 'http://localhost:5000/api/financial/analytics', method: 'GET', check: d => d.success && d.data.financialHealthScore > 0 },
    { url: 'http://localhost:5000/api/financial/health-score', method: 'GET', check: d => d.success && d.data.score > 0 },
    { url: 'http://localhost:5000/api/financial/recommendations', method: 'GET', check: d => d.success && Array.isArray(d.data) },
    { url: 'http://localhost:5000/api/financial/recommendations/history', method: 'GET', check: d => d.success && Array.isArray(d.data) },
    { url: 'http://localhost:5000/api/notifications', method: 'GET', check: d => d.success && Array.isArray(d.data) },
    { url: 'http://localhost:5000/api/notification-preferences', method: 'GET', check: d => d.success && d.data.userId === 'u-101' },
    { url: 'http://localhost:5000/api/bills/categories', method: 'GET', check: d => d.success && d.data.length > 0 },
    { url: 'http://localhost:5000/api/bills/billers?category=electricity', method: 'GET', check: d => d.success && d.data.length > 0 },
    { url: 'http://localhost:5000/api/integrations', method: 'GET', check: d => d.success && d.data.length >= 5 },
    { url: 'http://localhost:5000/api/portfolio/platforms', method: 'GET', check: d => d.success && d.data.length > 0 },
    { url: 'http://localhost:5000/api/money/today', method: 'GET', check: d => d.success && d.data.available_balance !== undefined },
    { url: 'http://localhost:5000/api/subscriptions', method: 'GET', check: d => d.success && d.summary.total_monthly_cost !== undefined },
    { url: 'http://localhost:5000/api/savings-goals', method: 'GET', check: d => d.success && Array.isArray(d.data) },
    { url: 'http://localhost:5000/api/lending', method: 'GET', check: d => d.success && d.summary !== undefined },
    { url: 'http://localhost:5000/api/financial-health', method: 'GET', check: d => d.success && d.data.score !== undefined },
    { url: 'http://localhost:5000/api/ai/daily-actions', method: 'GET', check: d => d.success && Array.isArray(d.data) }
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, { method: ep.method });
      if (!res.ok) {
        record(ep.url, false, `HTTP status ${res.status}`);
        continue;
      }
      const data = await res.json();
      const valid = ep.check(data);
      record(
        ep.url.replace('http://localhost:5000', ''),
        valid,
        valid ? `HTTP 200 OK | Valid payload structure` : `HTTP 200 OK | Unexpected schema: ${JSON.stringify(data).slice(0, 100)}`
      );
    } catch (err) {
      record(ep.url, false, `Fetch error: ${err.message}`);
    }
  }

  // 3. TESTING POST TRANSACTIONS & DATA WRITES
  console.log('\n--- 3. TESTING DATA WRITE & REAL-TIME EMISSION PIPELINE ---');
  try {
    const postRes = await fetch('http://localhost:5000/api/payments/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'GPay', amount: 550, purpose: 'Gold SIP Investment Test' })
    });
    const postData = await postRes.json();
    record(
      'POST /api/payments/process',
      postData.success && postData.data.amount === 550,
      `Transaction ID ${postData.data?.id} generated with Reference ${postData.data?.referenceNo}`
    );
  } catch (err) {
    record('POST /api/payments/process', false, err.message);
  }

  // 4. TESTING LIVE DATA COLLECTION & NORMALIZATION PIPELINE
  console.log('\n--- 4. TESTING MARKET DATA COLLECTION & NORMALIZATION ---');
  try {
    const marketSnapRes = await fetch('http://localhost:5000/api/markets/snapshot');
    const snapJson = await marketSnapRes.json();
    const gold24k = snapJson.data?.find(s => s.symbol === 'GOLD24K');
    const silver = snapJson.data?.find(s => s.symbol === 'SILVER');
    const nifty = snapJson.data?.find(s => s.symbol === 'NIFTY50');
    const btc = snapJson.data?.find(s => s.symbol === 'BTCUSDT');

    record(
      'Commodity Collection: GOLD24K',
      gold24k && gold24k.price > 50000,
      `Price: ₹${gold24k?.price} / ${gold24k?.unit} | Source: ${gold24k?.source} | Status: ${gold24k?.data_status}`
    );

    record(
      'Commodity Collection: SILVER',
      silver && silver.price > 50000,
      `Price: ₹${silver?.price} / ${silver?.unit} | Source: ${silver?.source}`
    );

    record(
      'Equities Collection: NIFTY 50',
      nifty && nifty.price > 20000,
      `Points: ${nifty?.price} | Source: ${nifty?.source}`
    );

    record(
      'Crypto Collection: BTCUSDT',
      btc && btc.price > 50000,
      `Price: $${btc?.price} USD | Source: ${btc?.source}`
    );
  } catch (err) {
    record('Market Data Collection Pipeline', false, err.message);
  }

  console.log('\n====================================================');
  console.log(`📊 AUDIT COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

testAll();
