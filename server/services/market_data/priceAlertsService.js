/**
 * Price Alert & Event Notification Engine
 */

const userAlerts = [
  {
    id: 'alert-1',
    userId: 'u-101',
    symbol: 'GOLD24K',
    symbolName: '24K Gold (10g)',
    condition: 'ABOVE', // 'ABOVE' | 'BELOW'
    targetPrice: 74000,
    active: true,
    lastTriggeredAt: null,
    cooldownMinutes: 60
  },
  {
    id: 'alert-2',
    userId: 'u-101',
    symbol: 'NIFTY50',
    symbolName: 'NIFTY 50',
    condition: 'ABOVE',
    targetPrice: 24500,
    active: true,
    lastTriggeredAt: null,
    cooldownMinutes: 60
  }
];

const alertEventsHistory = [];

export function getPriceAlerts(userId = 'u-101') {
  return userAlerts.filter(a => a.userId === userId);
}

export function createPriceAlert(alertData) {
  const newAlert = {
    id: `alert-${Date.now()}`,
    userId: alertData.userId || 'u-101',
    symbol: alertData.symbol || 'GOLD24K',
    symbolName: alertData.symbolName || alertData.symbol,
    condition: alertData.condition || 'ABOVE',
    targetPrice: Number(alertData.targetPrice) || 75000,
    active: true,
    lastTriggeredAt: null,
    cooldownMinutes: alertData.cooldownMinutes || 60
  };
  userAlerts.push(newAlert);
  return newAlert;
}

export function deletePriceAlert(alertId) {
  const idx = userAlerts.findIndex(a => a.id === alertId);
  if (idx !== -1) {
    userAlerts.splice(idx, 1);
    return true;
  }
  return false;
}

export function checkAndTriggerPriceAlerts(snapshots, io = null) {
  const now = Date.now();

  userAlerts.forEach(alert => {
    if (!alert.active) return;

    // Check cooldown
    if (alert.lastTriggeredAt && (now - alert.lastTriggeredAt) < alert.cooldownMinutes * 60 * 1000) {
      return;
    }

    const matchingSnapshot = snapshots.find(s => s.symbol === alert.symbol);
    if (!matchingSnapshot) return;

    const currentPrice = matchingSnapshot.price;
    let isTriggered = false;

    if (alert.condition === 'ABOVE' && currentPrice >= alert.targetPrice) {
      isTriggered = true;
    } else if (alert.condition === 'BELOW' && currentPrice <= alert.targetPrice) {
      isTriggered = true;
    }

    if (isTriggered) {
      alert.lastTriggeredAt = now;
      const event = {
        id: `evt-${now}-${Math.random().toString(36).substr(2, 4)}`,
        alertId: alert.id,
        userId: alert.userId,
        symbol: alert.symbol,
        symbolName: alert.symbolName,
        condition: alert.condition,
        targetPrice: alert.targetPrice,
        actualPrice: currentPrice,
        message: `🚨 Market Alert: ${alert.symbolName} is now ${alert.condition} ₹${alert.targetPrice.toLocaleString()} (Current: ₹${currentPrice.toLocaleString()})`,
        timestamp: new Date().toISOString()
      };

      alertEventsHistory.unshift(event);

      if (io) {
        io.emit('price-alert-triggered', event);
      }
    }
  });
}

export function getAlertEventsHistory() {
  return alertEventsHistory;
}
