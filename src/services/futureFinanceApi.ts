import { 
  FutureFinanceBaseline, 
  FutureFinanceSimulationResult, 
  FutureFinanceScenarioType,
  ForecastPeriodData
} from '../types';

const API_BASE = '/api/financial-future';

export async function fetchFutureFinanceOverview(): Promise<FutureFinanceBaseline | null> {
  try {
    const res = await fetch(`${API_BASE}/overview`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('Error fetching future finance overview:', err);
    return null;
  }
}

export async function fetchFutureFinanceForecasts(): Promise<{ baseline: FutureFinanceBaseline; forecasts: ForecastPeriodData[] } | null> {
  try {
    const res = await fetch(`${API_BASE}/forecasts`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('Error fetching future finance forecasts:', err);
    return null;
  }
}

export async function runFutureFinanceSimulation(
  scenarioType: FutureFinanceScenarioType, 
  params: Record<string, any> = {}
): Promise<{ baseline: FutureFinanceBaseline; simulation: FutureFinanceSimulationResult } | null> {
  try {
    const res = await fetch(`${API_BASE}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioType, params })
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('Error running future finance simulation:', err);
    return null;
  }
}

export async function saveFutureFinanceScenario(data: {
  scenarioType: FutureFinanceScenarioType;
  scenarioInput?: Record<string, any>;
  simulationData?: FutureFinanceSimulationResult;
}): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch (err) {
    console.error('Error saving scenario:', err);
    return false;
  }
}

export async function fetchFutureFinanceRisk(): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/risk`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('Error fetching future risk prediction:', err);
    return null;
  }
}
