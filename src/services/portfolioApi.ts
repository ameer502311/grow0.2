import { ConnectedPlatform } from '../types';

const API_BASE = '/api/portfolio';

export async function fetchConnectedPlatforms(): Promise<ConnectedPlatform[]> {
  try {
    const res = await fetch(`${API_BASE}/platforms`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('Error fetching connected platforms:', err);
    return [];
  }
}

export async function connectPlatform(platformId: string, apiKey: string): Promise<ConnectedPlatform | null> {
  try {
    const res = await fetch(`${API_BASE}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platformId, apiKey })
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('Error connecting platform:', err);
    return null;
  }
}

export async function syncPlatformHoldings(platformId: string) {
  try {
    const res = await fetch(`${API_BASE}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platformId })
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('Error syncing holdings:', err);
    return null;
  }
}

export async function fetchConsolidatedHoldings() {
  try {
    const res = await fetch(`${API_BASE}/holdings`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('Error fetching consolidated holdings:', err);
    return null;
  }
}

export async function fetchAiRebalanceInsights() {
  try {
    const res = await fetch(`${API_BASE}/ai-rebalance`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('Error fetching AI rebalance insights:', err);
    return null;
  }
}
