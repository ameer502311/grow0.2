// Automated Scheduler & Smart Notification Engine

import { getFinancialSnapshot } from './financialDataService.js';
import { calculateAnalytics } from './analyticsEngine.js';
import { evaluateRules } from './ruleEngine.js';
import { generateAiFinancialAdvice } from './aiAdvisorService.js';

let notificationsStore = [
  {
    id: 'notif-1',
    userId: 'u-101',
    title: 'Financial Health Score Ready',
    message: 'Your overall Financial Health Score is calculated at 88/100 (Excellent).',
    category: 'FINANCIAL_HEALTH',
    priority: 'LOW',
    read: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'notif-2',
    userId: 'u-101',
    title: 'Savings Progress',
    message: 'Your savings rate of 62.3% is well above the recommended 20% benchmark.',
    category: 'SAVINGS',
    priority: 'LOW',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

let recommendationHistoryStore = [];
let recentNotificationTimestamps = new Map();

export function getNotifications(userId) {
  return notificationsStore.filter(n => !userId || n.userId === userId);
}

export function markNotificationRead(notifId) {
  const item = notificationsStore.find(n => n.id === notifId);
  if (item) {
    item.read = true;
    return true;
  }
  return false;
}

export function deleteNotification(notifId) {
  const index = notificationsStore.findIndex(n => n.id === notifId);
  if (index !== -1) {
    notificationsStore.splice(index, 1);
    return true;
  }
  return false;
}

export function getRecommendationHistory(userId) {
  return recommendationHistoryStore.filter(r => !userId || r.userId === userId);
}

export async function runFinancialAnalysisPipeline(userId = 'u-101', memoryStore = {}, io = null) {
  const snapshot = getFinancialSnapshot(userId, memoryStore);
  const analytics = calculateAnalytics(snapshot);
  const ruleInsights = evaluateRules(analytics, snapshot);

  // Generate hybrid AI advice
  const aiAdvice = await generateAiFinancialAdvice(analytics, ruleInsights);

  // Combine recommendations
  const allRecommendations = [...ruleInsights];
  if (aiAdvice) {
    recommendationHistoryStore.unshift({
      id: `rec-${Date.now()}`,
      userId,
      title: aiAdvice.notificationTitle || 'AI Advisor Summary',
      message: aiAdvice.summary,
      category: 'FINANCIAL_HEALTH',
      priority: aiAdvice.priority || 'MEDIUM',
      source: aiAdvice.source || 'HYBRID',
      details: aiAdvice,
      createdAt: new Date().toISOString()
    });
  }

  // Smart Anti-Spam Notification Check (Cooldown: 12 hours per category)
  const categoryKey = `${userId}_${aiAdvice.priority}_FINANCIAL_HEALTH`;
  const lastSent = recentNotificationTimestamps.get(categoryKey);
  const now = Date.now();

  if (!lastSent || (now - lastSent) > 12 * 3600 * 1000) {
    const newNotif = {
      id: `notif-${Date.now()}`,
      userId,
      title: aiAdvice.notificationTitle || 'Financial Insight Update',
      message: aiAdvice.notificationMessage || aiAdvice.summary,
      category: 'FINANCIAL_HEALTH',
      priority: aiAdvice.priority || 'MEDIUM',
      read: false,
      createdAt: new Date().toISOString()
    };
    
    notificationsStore.unshift(newNotif);
    recentNotificationTimestamps.set(categoryKey, now);

    if (io) {
      io.emit('new-financial-notification', newNotif);
    }
  }

  return {
    analytics,
    ruleInsights,
    aiAdvice,
    recommendations: allRecommendations
  };
}

export function startScheduler(memoryStore = {}, io = null) {
  console.log('⏰ Smart Financial Automated Scheduler active (Runs every 15 minutes).');
  
  // Initial run on server start
  runFinancialAnalysisPipeline('u-101', memoryStore, io).catch(err => {
    console.error('⚠️ Error running initial financial analysis pipeline:', err.message);
  });

  // Automated interval (every 15 mins for real-time monitoring)
  setInterval(() => {
    runFinancialAnalysisPipeline('u-101', memoryStore, io).catch(err => {
      console.error('⚠️ Scheduler error:', err.message);
    });
  }, 15 * 60 * 1000);
}
