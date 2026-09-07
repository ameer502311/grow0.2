import express from 'express';
import { getFinancialSnapshot } from '../services/financialDataService.js';
import { calculateAnalytics } from '../services/analyticsEngine.js';
import { evaluateRules } from '../services/ruleEngine.js';
import { generateAiFinancialAdvice } from '../services/aiAdvisorService.js';
import { 
  runFinancialAnalysisPipeline, 
  getNotifications, 
  markNotificationRead, 
  deleteNotification,
  getRecommendationHistory 
} from '../services/scheduler.js';

export function createFinancialRouter(memoryStore = {}, io = null) {
  const router = express.Router();

  let userPreferences = {
    userId: 'u-101',
    frequency: 'DAILY',
    savingsAlerts: true,
    expenseAlerts: true,
    goalAlerts: true,
    healthAlerts: true,
    educationAlerts: true,
    positiveInsights: true
  };

  // GET /api/financial/analytics
  router.get('/analytics', (req, res) => {
    const snapshot = getFinancialSnapshot('u-101', memoryStore);
    const analytics = calculateAnalytics(snapshot);
    res.json({ success: true, data: analytics });
  });

  // GET /api/financial/health-score
  router.get('/health-score', (req, res) => {
    const snapshot = getFinancialSnapshot('u-101', memoryStore);
    const analytics = calculateAnalytics(snapshot);
    res.json({
      success: true,
      data: {
        score: analytics.financialHealthScore,
        category: analytics.healthCategory,
        savingsRate: analytics.savingsRate,
        expenseRatio: analytics.expenseRatio,
        debtRatio: analytics.debtRatio,
        emergencyFundMonths: analytics.emergencyFundMonths
      }
    });
  });

  // POST /api/financial/analyze
  router.post('/analyze', async (req, res) => {
    try {
      const result = await runFinancialAnalysisPipeline('u-101', memoryStore, io);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/financial/recommendations
  router.get('/recommendations', (req, res) => {
    const snapshot = getFinancialSnapshot('u-101', memoryStore);
    const analytics = calculateAnalytics(snapshot);
    const ruleInsights = evaluateRules(analytics, snapshot);
    res.json({ success: true, data: ruleInsights });
  });

  // GET /api/financial/recommendations/history
  router.get('/recommendations/history', (req, res) => {
    const history = getRecommendationHistory('u-101');
    res.json({ success: true, data: history });
  });

  // GET /api/notifications
  router.get('/notifications', (req, res) => {
    const list = getNotifications('u-101');
    res.json({ success: true, data: list });
  });

  // PUT /api/notifications/:id/read
  router.put('/notifications/:id/read', (req, res) => {
    const updated = markNotificationRead(req.params.id);
    res.json({ success: updated });
  });

  // DELETE /api/notifications/:id
  router.delete('/notifications/:id', (req, res) => {
    const deleted = deleteNotification(req.params.id);
    res.json({ success: deleted });
  });

  // GET /api/notification-preferences
  router.get('/notification-preferences', (req, res) => {
    res.json({ success: true, data: userPreferences });
  });

  // PUT /api/notification-preferences
  router.put('/notification-preferences', (req, res) => {
    userPreferences = { ...userPreferences, ...req.body };
    res.json({ success: true, data: userPreferences });
  });

  return router;
}
