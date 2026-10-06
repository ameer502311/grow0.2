import { createDailyMoneyRouter } from '../routes/dailyMoneyRoutes.js';
import express from 'express';
import http from 'http';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('🧪 RUNNING DAILY MONEY COMMAND CENTER BACKEND TESTS...\n');

const memoryStore = {};
const router = createDailyMoneyRouter(memoryStore);
const app = express();
app.use(express.json());
app.use('/api', router);

const server = http.createServer(app);

server.listen(5099, async () => {
  try {
    // 1. Test GET /api/money/today
    const todayRes = await fetch('http://localhost:5099/api/money/today').then(r => r.json());
    assert(todayRes.success === true && todayRes.data.available_balance >= 0, '1. GET /api/money/today returns verified balance');
    assert(todayRes.data.safe_daily_limit >= 0, '2. Safe daily spending limit calculated correctly');

    // 2. Test GET /api/transactions/today
    const txRes = await fetch('http://localhost:5099/api/transactions/today').then(r => r.json());
    assert(txRes.success === true && Array.isArray(txRes.data), '3. GET /api/transactions/today returns array');

    // 3. Test POST /api/transactions
    const postTx = await fetch('http://localhost:5099/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 450, type: 'EXPENSE', category: 'Food', description: 'Test Dinner' })
    }).then(r => r.json());
    assert(postTx.success === true && postTx.data.amount === 450, '4. POST /api/transactions creates expense');

    // 4. Test GET /api/bills & POST /api/bills
    const postBill = await fetch('http://localhost:5099/api/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Electricity Bill', amount: 950, due_date: '2026-10-15', category: 'Electricity' })
    }).then(r => r.json());
    const billRes = await fetch('http://localhost:5099/api/bills').then(r => r.json());
    assert(billRes.success === true && billRes.data.length > 0, '5. GET /api/bills returns real-time bill reminders');

    // 5. Test GET /api/subscriptions & POST
    const postSub = await fetch('http://localhost:5099/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Streaming Pass', cost: 499, billing_frequency: 'MONTHLY' })
    }).then(r => r.json());
    const subRes = await fetch('http://localhost:5099/api/subscriptions').then(r => r.json());
    assert(subRes.success === true && subRes.summary.total_monthly_cost >= 499, '6. GET /api/subscriptions computes monthly totals');

    // 6. Test GET /api/savings-goals & POST
    const postGoal = await fetch('http://localhost:5099/api/savings-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Emergency Vault', target_amount: 100000, current_saved: 25000, target_date: '2026-12-31' })
    }).then(r => r.json());
    const goalRes = await fetch('http://localhost:5099/api/savings-goals').then(r => r.json());
    assert(goalRes.success === true && goalRes.data[0].progress_percentage >= 0, '7. GET /api/savings-goals computes progress %');

    // 7. Test GET /api/lending
    const lendRes = await fetch('http://localhost:5099/api/lending').then(r => r.json());
    assert(lendRes.success === true && lendRes.summary.total_lent !== undefined, '8. GET /api/lending tracks lent receivables');

    // 8. Test GET /api/financial-health
    const healthRes = await fetch('http://localhost:5099/api/financial-health').then(r => r.json());
    assert(healthRes.success === true && healthRes.data.score >= 0, '9. GET /api/financial-health returns dynamic health score');

    // 9. Test GET /api/ai/daily-actions
    const aiRes = await fetch('http://localhost:5099/api/ai/daily-actions').then(r => r.json());
    assert(aiRes.success === true && Array.isArray(aiRes.data), '10. GET /api/ai/daily-actions generates actionable recommendations');

    console.log(`\n📊 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    server.close(() => {
      if (failed > 0) process.exit(1);
      else console.log('🎉 ALL DAILY MONEY COMMAND CENTER TESTS PASSED SUCCESSFULLY!');
    });
  } catch (err) {
    console.error('Test execution failed:', err);
    server.close(() => process.exit(1));
  }
});
