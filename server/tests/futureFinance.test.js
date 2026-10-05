import { createFutureFinanceRouter } from '../routes/futureFinanceRoutes.js';
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

console.log('🧪 RUNNING AI FINANCIAL FUTURE SIMULATOR & RISK PREDICTOR TESTS...\n');

const memoryStore = {};
const router = createFutureFinanceRouter(memoryStore);
const app = express();
app.use(express.json());
app.use('/api/financial-future', router);

const server = http.createServer(app);
const TEST_PORT = 5098;

server.listen(TEST_PORT, async () => {
  try {
    // 1. Test GET /overview
    const overviewRes = await fetch(`http://localhost:${TEST_PORT}/api/financial-future/overview`).then(r => r.json());
    assert(overviewRes.success === true, '1. GET /overview returns success: true');
    assert(overviewRes.data.income.totalMonthlyIncome > 0, '2. Total monthly income is calculated');
    assert(overviewRes.data.savings.emergencyFundCoverageMonths > 0, '3. Emergency fund coverage months is calculated');
    assert(typeof overviewRes.data.riskLevel === 'string', '4. Risk level evaluated');

    // 2. Test GET /forecasts
    const forecastRes = await fetch(`http://localhost:${TEST_PORT}/api/financial-future/forecasts`).then(r => r.json());
    assert(forecastRes.success === true, '5. GET /forecasts returns success');
    assert(Array.isArray(forecastRes.data.forecasts) && forecastRes.data.forecasts.length === 6, '6. Forecasts contain all 6 periods (1M, 3M, 6M, 1Y, 3Y, 5Y)');
    const period1Y = forecastRes.data.forecasts.find(f => f.periodKey === '1Y');
    assert(period1Y && period1Y.estimatedInvestmentValue > 0, '7. 1Y period has compound estimated investment value');

    // 3. Test POST /simulate - Salary Reduction
    const salRedRes = await fetch(`http://localhost:${TEST_PORT}/api/financial-future/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioType: 'SALARY_REDUCTION', params: { percentage: 20 } })
    }).then(r => r.json());
    assert(salRedRes.success === true, '8. Salary reduction simulation succeeds');
    assert(salRedRes.data.simulation.metrics.monthlyIncome < overviewRes.data.income.totalMonthlyIncome, '9. Monthly income dropped after salary reduction');

    // 4. Test POST /simulate - Job Loss
    const jobLossRes = await fetch(`http://localhost:${TEST_PORT}/api/financial-future/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioType: 'JOB_LOSS', params: {} })
    }).then(r => r.json());
    assert(jobLossRes.success === true, '10. Job loss simulation succeeds');
    assert(jobLossRes.data.simulation.keyMetric.label === 'Estimated Runway', '11. Runway correctly displayed for job loss');
    assert(jobLossRes.data.simulation.risk.level === 'CRITICAL ATTENTION', '12. Risk level escalates to CRITICAL ATTENTION under job loss');

    // 5. Test POST /simulate - Expense Increase
    const expIncRes = await fetch(`http://localhost:${TEST_PORT}/api/financial-future/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioType: 'EXPENSE_INCREASE', params: { percentage: 25 } })
    }).then(r => r.json());
    assert(expIncRes.success === true, '13. Expense increase simulation succeeds');
    assert(expIncRes.data.simulation.metrics.monthlyExpenses > overviewRes.data.expenses.totalMonthlyExpenses, '14. Expenses increased correctly');

    // 6. Test POST /simulate - Unexpected Expense
    const shockRes = await fetch(`http://localhost:${TEST_PORT}/api/financial-future/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioType: 'UNEXPECTED_EXPENSE', params: { amount: 50000 } })
    }).then(r => r.json());
    assert(shockRes.success === true, '15. Unexpected expense simulation succeeds');
    assert(shockRes.data.simulation.metrics.emergencySavings < overviewRes.data.savings.availableEmergencySavings, '16. Emergency fund drawn down by shock amount');

    // 7. Test POST /simulate - Salary Increase with Surplus Allocation
    const hikeRes = await fetch(`http://localhost:${TEST_PORT}/api/financial-future/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioType: 'SALARY_INCREASE', params: { percentage: 15 } })
    }).then(r => r.json());
    assert(hikeRes.success === true, '17. Salary increase simulation succeeds');
    assert(hikeRes.data.simulation.metrics.surplusAllocation !== null, '18. Smart surplus allocation calculated');
    assert(hikeRes.data.simulation.metrics.surplusAllocation.wealthInvestments > 0, '19. Wealth investment allocation recommended');

    // 8. Test POST /scenario (Save simulation)
    const saveRes = await fetch(`http://localhost:${TEST_PORT}/api/financial-future/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenarioType: 'JOB_LOSS',
        scenarioInput: {},
        simulationData: jobLossRes.data.simulation
      })
    }).then(r => r.json());
    assert(saveRes.success === true, '20. POST /scenario successfully saves simulation record');

    // 9. Test GET /risk
    const riskRes = await fetch(`http://localhost:${TEST_PORT}/api/financial-future/risk`).then(r => r.json());
    assert(riskRes.success === true && riskRes.data.riskLevel, '21. GET /risk returns verified risk structure');
    assert(riskRes.data.safetyNet.emergencyFundCoverageMonths > 0, '22. Safety net coverage months included in risk response');

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    server.close(() => {
      process.exit(failed > 0 ? 1 : 0);
    });
  } catch (err) {
    console.error('Fatal Test Exception:', err);
    server.close(() => process.exit(1));
  }
});
