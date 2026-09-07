import { 
  FinancialAnalyticsData, 
  FinancialRecommendationItem, 
  NotificationItem, 
  NotificationPreferenceData 
} from '../types';

const API_BASE = '/api/financial';

export async function fetchFinancialAnalytics(): Promise<FinancialAnalyticsData | null> {
  try {
    const res = await fetch(`${API_BASE}/analytics`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('Error fetching financial analytics:', err);
    return null;
  }
}

export async function runFinancialAnalysis() {
  try {
    const res = await fetch(`${API_BASE}/analyze`, { method: 'POST' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('Error running financial analysis:', err);
    return null;
  }
}

export async function fetchRecommendations(): Promise<FinancialRecommendationItem[]> {
  try {
    const res = await fetch(`${API_BASE}/recommendations`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('Error fetching recommendations:', err);
    return [];
  }
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  try {
    const res = await fetch('/api/financial/notifications');
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return [];
  }
}

export async function markNotificationRead(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/financial/notifications/${id}/read`, { method: 'PUT' });
    return res.ok;
  } catch (err) {
    console.error('Error marking notification read:', err);
    return false;
  }
}

export async function deleteNotification(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/financial/notifications/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    console.error('Error deleting notification:', err);
    return false;
  }
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferenceData | null> {
  try {
    const res = await fetch('/api/financial/notification-preferences');
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('Error fetching notification preferences:', err);
    return null;
  }
}

export async function updateNotificationPreferences(data: Partial<NotificationPreferenceData>): Promise<boolean> {
  try {
    const res = await fetch('/api/financial/notification-preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch (err) {
    console.error('Error updating notification preferences:', err);
    return false;
  }
}
