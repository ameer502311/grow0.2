async function testRealTimeFlow() {
  console.log('🧪 TESTING REAL-TIME CASHFLOW & PERSISTENCE PIPELINE...\n');

  let passed = 0;
  let failed = 0;
  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS]: ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL]: ${message}`);
      failed++;
    }
  }

  // 1. Check clean initial state
  const initRes = await fetch('http://localhost:5000/api/money/today').then(r => r.json());
  assert(initRes.success === true && initRes.data.available_balance === 0, '1. Clean state starts with ₹0 available balance');
  assert(initRes.data.monthly_savings === 0, '2. Clean state starts with ₹0 savings');

  // 2. Add real-time income: ₹75,000
  const postInc = await fetch('http://localhost:5000/api/finance/incomes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 75000, category: 'Salary', notes: 'Monthly tech salary' })
  }).then(r => r.json());
  assert(postInc.success === true && postInc.data.amount === 75000, '3. POST /api/finance/incomes persists real income');

  // 3. Add real-time expense: ₹15,000
  const postExp = await fetch('http://localhost:5000/api/finance/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 15000, category: 'Rent', notes: 'Studio rent' })
  }).then(r => r.json());
  assert(postExp.success === true && postExp.data.amount === 15000, '4. POST /api/finance/expenses persists real expense');

  // 4. Verify Real-Time calculation on /api/money/today: 75000 - 15000 = 60000
  const updatedToday = await fetch('http://localhost:5000/api/money/today').then(r => r.json());
  assert(updatedToday.data.available_balance === 60000, `5. Available balance updated in real-time to ₹${updatedToday.data.available_balance}`);
  assert(updatedToday.data.monthly_savings === 60000, `6. Monthly savings updated in real-time to ₹${updatedToday.data.monthly_savings}`);
  assert(updatedToday.data.safe_daily_limit > 0, `7. Safe daily spending limit dynamically calculated: ₹${updatedToday.data.safe_daily_limit}/day`);

  // 5. Add an investment: ₹25,000
  const postInv = await fetch('http://localhost:5000/api/investments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Nifty 50 Index Fund', category: 'Mutual Funds', investedAmount: 25000, currentValue: 26500 })
  }).then(r => r.json());
  assert(postInv.success === true && postInv.data.investedAmount === 25000, '8. POST /api/investments registers investment');

  // 6. Verify Net Worth calculation: 60000 + 26500 = 86500
  const netWorthCheck = await fetch('http://localhost:5000/api/money/today').then(r => r.json());
  assert(netWorthCheck.data.total_investments === 26500, `9. Total investments reflects real asset: ₹${netWorthCheck.data.total_investments}`);
  assert(netWorthCheck.data.total_net_worth === 86500, `10. Total net worth calculated in real-time: ₹${netWorthCheck.data.total_net_worth}`);

  // 7. Verify dynamic AI response reflects user's actual 86,500 and 60,000 numbers
  const aiAskRes = await fetch('http://localhost:5000/api/ai/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'What is my current available balance?' })
  }).then(r => r.json());
  assert(aiAskRes.answer.includes('60,000'), '11. AI Daily Assistant answers with user real-time balance (₹60,000)');

  // Clean up test items
  if (postInc.data?.id) await fetch(`http://localhost:5000/api/finance/incomes/${postInc.data.id}`, { method: 'DELETE' });
  if (postExp.data?.id) await fetch(`http://localhost:5000/api/finance/expenses/${postExp.data.id}`, { method: 'DELETE' });
  if (postInv.data?.id) await fetch(`http://localhost:5000/api/investments/${postInv.data.id}`, { method: 'DELETE' });

  // 8. Confirm clean state restored
  const cleanFinal = await fetch('http://localhost:5000/api/money/today').then(r => r.json());
  assert(cleanFinal.data.available_balance === 0, '12. Deletion cleanly restored zero available balance');

  console.log(`\n📊 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
  else console.log('🎉 REAL-TIME CASHFLOW & PERSISTENCE FULLY VERIFIED!');
}

testRealTimeFlow();
