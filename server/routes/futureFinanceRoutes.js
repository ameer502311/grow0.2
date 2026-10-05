import express from 'express';
import { 
  getUserFinancialBaseline, 
  simulateScenario, 
  generateForecastTimeline, 
  generateAiFutureExplanation 
} from '../services/futureFinanceEngine.js';
import FinancialForecast from '../models/FinancialForecast.js';

export function createFutureFinanceRouter(memoryStore = {}, io = null) {
  const router = express.Router();

  // Initialize in-memory storage for forecasts if not present
  if (!memoryStore.dbFinancialForecasts) {
    memoryStore.dbFinancialForecasts = [];
  }

  // 1. GET /overview - Retrieve User's Current Baseline Position & Safety Net
  router.get('/overview', (req, res) => {
    try {
      const userId = req.query.userId || (memoryStore.dbUser && memoryStore.dbUser.id) || 'u-101';
      const baseline = getUserFinancialBaseline(userId, memoryStore);
      res.json({
        success: true,
        data: baseline
      });
    } catch (err) {
      console.error('Error in future finance overview:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. GET /forecasts - Retrieve Baseline Multi-Period Forecasts (1M, 3M, 6M, 1Y, 3Y, 5Y)
  router.get('/forecasts', (req, res) => {
    try {
      const userId = req.query.userId || (memoryStore.dbUser && memoryStore.dbUser.id) || 'u-101';
      const baseline = getUserFinancialBaseline(userId, memoryStore);
      const forecasts = generateForecastTimeline(baseline);
      res.json({
        success: true,
        data: {
          baseline,
          forecasts
        }
      });
    } catch (err) {
      console.error('Error generating forecasts:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. POST /simulate - Execute Deterministic Simulation and Generate Scenario Insights
  router.post('/simulate', async (req, res) => {
    try {
      const { scenarioType = 'BASELINE', params = {}, userId = 'u-101' } = req.body;
      const baseline = getUserFinancialBaseline(userId, memoryStore);
      
      const simulation = simulateScenario(baseline, scenarioType, params);

      // Generate AI explanation (Gemini or deterministic rule engine)
      const apiKey = memoryStore.dbUser?.geminiApiKey || process.env.AI_API_KEY || '';
      const aiExplanation = await generateAiFutureExplanation(baseline, simulation, apiKey);

      simulation.aiExplanation = aiExplanation;

      // Broadcast simulation update via Socket.io if available
      if (io) {
        io.emit('future:simulation_updated', {
          scenarioType,
          riskLevel: simulation.risk.level,
          coverageMonths: simulation.metrics.emergencyCoverageMonths
        });
      }

      res.json({
        success: true,
        data: {
          baseline,
          simulation
        }
      });
    } catch (err) {
      console.error('Error running financial simulation:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. POST /scenario - Save Simulation to Database / MemoryStore
  router.post('/scenario', async (req, res) => {
    try {
      const { 
        userId = 'u-101', 
        scenarioType = 'BASELINE', 
        scenarioInput = {},
        simulationData = {} 
      } = req.body;

      const record = {
        id: `fc-${Date.now()}`,
        userId,
        scenarioType,
        scenarioInput,
        forecastPeriod: 'ALL',
        estimatedIncome: simulationData.metrics?.monthlyIncome || 0,
        estimatedExpenses: simulationData.metrics?.monthlyExpenses || 0,
        estimatedSavings: simulationData.metrics?.monthlySavings || 0,
        estimatedInvestmentValue: simulationData.forecasts?.find(f => f.periodKey === '1Y')?.estimatedInvestmentValue || 0,
        emergencyFundCoverage: simulationData.metrics?.emergencyCoverageMonths || 0,
        riskLevel: simulationData.risk?.level || 'LOW RISK',
        financialTrend: simulationData.trends || {},
        aiSummary: simulationData.aiExplanation || {},
        assumptions: [
          'Assumes 10% p.a. conservative annualized growth on diversified portfolio.',
          'Assumes constant essential obligations and steady loan amortizations.'
        ],
        createdAt: new Date().toISOString()
      };

      // Push to in-memory store
      memoryStore.dbFinancialForecasts.unshift(record);

      // Attempt MongoDB write if connected
      try {
        await FinancialForecast.create(record);
      } catch (dbErr) {
        // Fallback gracefully to memoryStore if MongoDB is offline
      }

      res.json({
        success: true,
        message: 'Scenario simulation saved successfully.',
        data: record
      });
    } catch (err) {
      console.error('Error saving scenario:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. GET /risk - Retrieve Financial Risk Prediction Breakdown
  router.get('/risk', (req, res) => {
    try {
      const userId = req.query.userId || (memoryStore.dbUser && memoryStore.dbUser.id) || 'u-101';
      const baseline = getUserFinancialBaseline(userId, memoryStore);
      res.json({
        success: true,
        data: {
          riskLevel: baseline.riskLevel,
          riskScore: baseline.riskScore,
          riskSummary: baseline.riskSummary,
          safetyNet: {
            availableEmergencySavings: baseline.savings.availableEmergencySavings,
            monthlyEssentialBurn: baseline.savings.monthlyEssentialBurn,
            emergencyFundCoverageMonths: baseline.savings.emergencyFundCoverageMonths,
            recommendedTargetMonths: baseline.savings.recommendedTargetMonths
          },
          trends: baseline.financialTrends
        }
      });
    } catch (err) {
      console.error('Error fetching risk analysis:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. POST /ai-explanation - Custom AI Explanation Generator
  router.post('/ai-explanation', async (req, res) => {
    try {
      const { baseline, simulation, userId = 'u-101' } = req.body;
      const userBaseline = baseline || getUserFinancialBaseline(userId, memoryStore);
      const userSimulation = simulation || simulateScenario(userBaseline, 'BASELINE', {});
      
      const apiKey = memoryStore.dbUser?.geminiApiKey || process.env.AI_API_KEY || '';
      const explanation = await generateAiFutureExplanation(userBaseline, userSimulation, apiKey);

      res.json({
        success: true,
        data: explanation
      });
    } catch (err) {
      console.error('Error generating AI future explanation:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
