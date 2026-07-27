import { MarketTicker, NewsArticle } from '../types';

export const BACKEND_URL = '/api';

export async function checkBackendHealth(): Promise<{ status: string; connected: boolean }> {
  try {
    const res = await fetch(`${BACKEND_URL}/health`);
    if (res.ok) {
      const data = await res.json();
      return { status: data.status, connected: true };
    }
  } catch (err) {
    console.warn("Backend server connection attempt:", err);
  }
  return { status: 'OFFLINE_FALLBACK', connected: false };
}

// Incomes API
export async function fetchBackendIncomes() {
  try {
    const res = await fetch(`${BACKEND_URL}/finance/incomes`);
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (e) {
    console.warn("Using local fallback for incomes");
  }
  return null;
}

export async function postBackendIncome(income: any) {
  try {
    const res = await fetch(`${BACKEND_URL}/finance/incomes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(income)
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (e) {
    console.warn("Failed posting income to server");
  }
  return null;
}

// Expenses API
export async function fetchBackendExpenses() {
  try {
    const res = await fetch(`${BACKEND_URL}/finance/expenses`);
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (e) {
    console.warn("Using local fallback for expenses");
  }
  return null;
}

export async function postBackendExpense(expense: any) {
  try {
    const res = await fetch(`${BACKEND_URL}/finance/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense)
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (e) {
    console.warn("Failed posting expense to server");
  }
  return null;
}

// Investments API
export async function fetchBackendInvestments() {
  try {
    const res = await fetch(`${BACKEND_URL}/investments`);
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (e) {
    console.warn("Using local fallback for investments");
  }
  return null;
}

export async function postBackendInvestment(inv: any) {
  try {
    const res = await fetch(`${BACKEND_URL}/investments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inv)
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (e) {
    console.warn("Failed posting investment to server");
  }
  return null;
}

// Loans API
export async function fetchBackendLoans() {
  try {
    const res = await fetch(`${BACKEND_URL}/loans`);
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (e) {
    console.warn("Using local fallback for loans");
  }
  return null;
}

export async function payBackendEmi(id: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/loans/${id}/pay`, { method: 'POST' });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (e) {
    console.warn("Failed paying EMI on server");
  }
  return null;
}

// Payments API
export async function fetchBackendPayments() {
  try {
    const res = await fetch(`${BACKEND_URL}/payments/transactions`);
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (e) {
    console.warn("Using local fallback for payments");
  }
  return null;
}

export async function sendBackendPayment(provider: string, amount: number, purpose: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/payments/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, amount, purpose })
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (e) {
    console.warn("Processing fallback payment locally");
  }
  return null;
}

// Connected Platforms API
export async function fetchBackendPlatforms() {
  try {
    const res = await fetch(`${BACKEND_URL}/platforms`);
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (e) {
    console.warn("Using local fallback for platforms");
  }
  return null;
}

export async function toggleBackendPlatform(id: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/platforms/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (e) {
    console.warn("Failed toggling platform connection on server");
  }
  return null;
}

export const INITIAL_MARKET_TICKERS: MarketTicker[] = [
  {
    symbol: 'GOLD24K',
    name: '24K Gold (10g)',
    price: 74250,
    change24h: 380,
    changePercent24h: 0.51,
    category: 'Gold',
    history7d: [73100, 73400, 73250, 73800, 74000, 74150, 74250]
  },
  {
    symbol: 'GOLD22K',
    name: '22K Gold (10g)',
    price: 68060,
    change24h: 350,
    changePercent24h: 0.52,
    category: 'Gold',
    history7d: [67000, 67200, 67100, 67500, 67800, 67900, 68060]
  },
  {
    symbol: 'SILVER',
    name: 'Silver (1kg)',
    price: 88500,
    change24h: -420,
    changePercent24h: -0.47,
    category: 'Silver',
    history7d: [89200, 89000, 88800, 89100, 88700, 88900, 88500]
  },
  {
    symbol: 'NIFTY50',
    name: 'NIFTY 50',
    price: 24835.40,
    change24h: 142.30,
    changePercent24h: 0.58,
    category: 'Stock',
    history7d: [24400, 24550, 24620, 24590, 24710, 24780, 24835]
  },
  {
    symbol: 'SENSEX',
    name: 'BSE SENSEX',
    price: 81332.60,
    change24h: 462.10,
    changePercent24h: 0.57,
    category: 'Stock',
    history7d: [80100, 80450, 80700, 80620, 80950, 81100, 81332]
  },
  {
    symbol: 'NASDAQ',
    name: 'NASDAQ Composite',
    price: 17985.20,
    change24h: -88.50,
    changePercent24h: -0.49,
    category: 'Stock',
    history7d: [18100, 18050, 18120, 18000, 17920, 18010, 17985]
  },
  {
    symbol: 'BTCUSDT',
    name: 'Bitcoin (BTC)',
    price: 67450.00,
    change24h: 1850.00,
    changePercent24h: 2.82,
    category: 'Crypto',
    history7d: [63500, 64200, 65100, 64800, 66200, 66800, 67450]
  },
  {
    symbol: 'ETHUSDT',
    name: 'Ethereum (ETH)',
    price: 3480.50,
    change24h: 92.40,
    changePercent24h: 2.73,
    category: 'Crypto',
    history7d: [3200, 3280, 3310, 3350, 3400, 3420, 3480]
  },
  {
    symbol: 'USDINR',
    name: 'USD / INR',
    price: 83.72,
    change24h: 0.04,
    changePercent24h: 0.05,
    category: 'Forex',
    history7d: [83.60, 83.65, 83.62, 83.68, 83.70, 83.69, 83.72]
  }
];

export const INITIAL_NEWS: NewsArticle[] = [
  {
    id: 'n1',
    title: 'RBI Keeps Repo Rate Unchanged at 6.5%; Focuses on Inflation Moderation',
    summary: 'The Reserve Bank of India Monetary Policy Committee decided to hold the benchmark policy rate steady.',
    category: 'RBI Updates',
    source: 'Economic Times',
    url: '#',
    publishedAt: '2 Hours Ago'
  },
  {
    id: 'n2',
    title: 'Gold Prices Surge Near All-Time Highs Amid Global Central Bank Accumulation',
    summary: 'Gold prices spiked as geopolitical uncertainties and central bank buying boosted demand.',
    category: 'Gold',
    source: 'Moneycontrol',
    url: '#',
    publishedAt: '4 Hours Ago'
  },
  {
    id: 'n3',
    title: 'IT Sector Stocks Rally on Strong Q1 Order Inflow and Cloud AI Contracts',
    summary: 'Nifty IT index gained over 2.4% following robust quarterly earnings guidance.',
    category: 'Stock Market',
    source: 'LiveMint',
    url: '#',
    publishedAt: '5 Hours Ago'
  }
];

// Gemini API
export async function askGeminiAdvisor(prompt: string, apiKey?: string, userStatsContext?: any): Promise<string> {
  try {
    const backendRes = await fetch(`${BACKEND_URL}/ai/advisor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, userStatsContext, model: 'gemini' })
    });
    if (backendRes.ok) {
      const data = await backendRes.json();
      if (data.reply) return data.reply;
    }
  } catch (err) {
    console.warn("Backend AI route connection fallback:", err);
  }

  if (apiKey && apiKey.trim() !== '') {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an expert AI Wealth Advisor for Grow 0.2 Fintech. Context: ${JSON.stringify(userStatsContext)}. Prompt: ${prompt}`
            }]
          }]
        })
      });
      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
    } catch (err) {
      console.warn("Gemini API call fallback:", err);
    }
  }

  return `✨ **Grow 0.2 Gemini AI Insight**: Maintain an automated SIP step-up of 10% annually to reach your wealth targets 4 years early.`;
}

// ChatGPT API
export async function askChatGptAdvisor(prompt: string, apiKey?: string, userStatsContext?: any): Promise<string> {
  try {
    const backendRes = await fetch(`${BACKEND_URL}/ai/chatgpt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, userStatsContext })
    });
    if (backendRes.ok) {
      const data = await backendRes.json();
      if (data.reply) return data.reply;
    }
  } catch (err) {
    console.warn("Backend ChatGPT route connection fallback:", err);
  }

  if (apiKey && apiKey.trim() !== '') {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `You are ChatGPT, an expert AI Wealth Advisor for Grow 0.2 Fintech.` },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7
        })
      });
      const data = await response.json();
      if (data.choices && data.choices[0]?.message?.content) {
        return data.choices[0].message.content;
      }
    } catch (err) {
      console.warn("OpenAI API call fallback:", err);
    }
  }

  return "🤖 **ChatGPT Wealth Advisor**: Your savings rate is healthy. We recommend maintaining an emergency fund covering 6 months of expenses in an instant-access Liquid Fund or FD.";
}
