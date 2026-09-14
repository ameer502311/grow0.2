import express from 'express';
import OpenAI from 'openai';
import { MarketDataService } from '../services/marketDataService.js';
import { SyncManager } from '../services/syncManager.js';
import { getCachedMarketPrices, getMarketSchedulerStatus } from '../services/market_data/marketScheduler.js';
import { MarketNewsService } from '../services/market_data/marketNewsService.js';

// In-Memory Database Store for Conversations & Messages
const conversationsStore = new Map();

// Official OpenAI Tools Specification
const OPENAI_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_portfolio_summary',
      description: 'Get the user\'s real synchronized portfolio summary across Groww, SafeGold, Zerodha, and Aura Gold including total invested, current valuation, and profit/loss.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_gold_summary',
      description: 'Get the user\'s digital gold holdings quantity in grams, purity, and valuation across SafeGold, Augmont, and Aura Gold.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_latest_market_price',
      description: 'Get latest price, price change, data status, and timestamp for a specific symbol (e.g. GOLD24K, NIFTY50, USDINR, BTCUSDT).',
      parameters: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: 'Ticker symbol e.g. GOLD24K, NIFTY50, USDINR, BTCUSDT' }
        },
        required: ['symbol'],
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_market_snapshot',
      description: 'Get current aggregated snapshot of all live market prices across Gold, Silver, Stocks, Forex, and Crypto.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_market_status',
      description: 'Get official market trading session status, opening hours, and data provider status.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_market_news',
      description: 'Get current verified financial market news headlines and summaries.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_gold_price',
      description: 'Get the latest available gold market price from the configured market data service.',
      parameters: {
        type: 'object',
        properties: {
          purity: {
            type: 'string',
            enum: ['24K', '22K', '18K'],
            description: 'Purity level of gold'
          }
        },
        required: ['purity'],
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_silver_price',
      description: 'Get the latest available silver price per gram and per kg.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_budget_summary',
      description: 'Get the user\'s current authorized budget summary including monthly income, expenses, and savings rate.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'calculate_investment_growth',
      description: 'Calculate future wealth accumulation from SIP and lump sum investments.',
      parameters: {
        type: 'object',
        properties: {
          principal: { type: 'number', description: 'Initial lump sum investment' },
          monthlySip: { type: 'number', description: 'Monthly SIP contribution' },
          annualRatePercent: { type: 'number', description: 'Expected annual return percentage (e.g. 12)' },
          tenureYears: { type: 'number', description: 'Investment duration in years' }
        },
        required: ['tenureYears'],
        additionalProperties: false
      }
    }
  }
];

const SYSTEM_PROMPT = `You are Grow 0.2 AI Advisor, a helpful, professional, and responsible personal finance assistant.

Your responsibilities:
- Explain personal finance in simple English.
- Help users understand income, expenses, savings, budgets, investments, gold, silver, and financial planning.
- Answer portfolio questions (total invested, profit/loss, gold quantity, platform allocations) by invoking the secure tools: get_portfolio_summary, get_gold_summary, get_budget_summary.
- Every answer based on portfolio data must include the data source and last updated timestamp.
- Clearly mention risks. Never promise profits.
- Do not fabricate live market prices or investment balances.
- Never request passwords, PINs, OTPs, CVV numbers, or banking login credentials.
- Be concise, professional, and easy to understand.`;

export function createChatRouter(memoryStore) {
  const router = express.Router();

  // GET /api/market-prices - Fetch Real-time Market Prices
  router.get('/market-prices', (req, res) => {
    try {
      const data = MarketDataService.getMarketPrices();
      res.json({
        success: true,
        data
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/chat - Real-Time Streaming Chat Endpoint (SSE)
  router.post('/chat', async (req, res) => {
    const { message, conversation_id, messages = [], apiKey } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message field is required and must be a non-empty string.' });
    }

    const activeKey = apiKey || process.env.OPENAI_API_KEY || process.env.AI_API_KEY || '';
    const selectedModel = process.env.OPENAI_MODEL || 'gpt-4o';
    const convId = conversation_id || `conv-${Date.now()}`;

    // Setup SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const sendSse = (event, payload) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
    };

    // Store user message
    const userMsgObj = { role: 'user', content: message, timestamp: new Date().toISOString() };
    if (!conversationsStore.has(convId)) {
      conversationsStore.set(convId, { id: convId, createdAt: new Date().toISOString(), messages: [] });
    }
    const conv = conversationsStore.get(convId);
    conv.messages.push(userMsgObj);

    // Build chat history for OpenAI
    const formattedMessages = [{ role: 'system', content: SYSTEM_PROMPT }];
    messages.forEach(m => {
      if (m.role && m.content) formattedMessages.push({ role: m.role, content: m.content });
    });
    formattedMessages.push({ role: 'user', content: message });

    let fullAssistantResponse = '';

    // Stream directly via official OpenAI API if valid API key is available
    if (activeKey && activeKey.startsWith('sk-')) {
      try {
        const openai = new OpenAI({ apiKey: activeKey });
        
        // Initial completion call with tools enabled
        const responseStream = await openai.chat.completions.create({
          model: selectedModel,
          messages: formattedMessages,
          tools: OPENAI_TOOLS,
          stream: true,
          max_tokens: Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 1200)
        });

        let toolCallsToExecute = [];

        for await (const chunk of responseStream) {
          const delta = chunk.choices[0]?.delta;

          if (delta?.content) {
            fullAssistantResponse += delta.content;
            sendSse('token', { delta: delta.content });
          }

          if (delta?.tool_calls) {
            delta.tool_calls.forEach(tc => {
              const idx = tc.index;
              if (!toolCallsToExecute[idx]) {
                toolCallsToExecute[idx] = { id: tc.id, name: tc.function?.name, argsStr: '' };
              }
              if (tc.function?.name) toolCallsToExecute[idx].name = tc.function.name;
              if (tc.function?.arguments) toolCallsToExecute[idx].argsStr += tc.function.arguments;
            });
          }
        }

        // Execute Tool Calls if requested by GPT
        if (toolCallsToExecute.length > 0) {
          for (const tc of toolCallsToExecute) {
            let result = null;
            let args = {};
            try {
              if (tc.argsStr) args = JSON.parse(tc.argsStr);
            } catch (e) {}

            sendSse('tool_call', { name: tc.name, args });

            if (tc.name === 'get_portfolio_summary') {
              result = SyncManager.getPortfolioSummary();
            } else if (tc.name === 'get_gold_summary') {
              const summary = SyncManager.getPortfolioSummary();
              const goldHoldings = summary.holdings.filter(h => h.asset_type === 'digital_gold');
              const totalGrams = goldHoldings.reduce((sum, g) => sum + (g.gold_quantity_grams || 0), 0);
              result = {
                goldHoldingsCount: goldHoldings.length,
                totalGoldGrams: totalGrams,
                goldHoldings,
                as_of: summary.as_of
              };
            } else if (tc.name === 'get_latest_market_price') {
              const prices = getCachedMarketPrices();
              const sym = (args.symbol || 'GOLD24K').toUpperCase();
              result = prices.find(p => p.symbol === sym) || prices[0] || { symbol: sym, status: 'unavailable', message: 'Price unavailable' };
            } else if (tc.name === 'get_market_snapshot') {
              result = getCachedMarketPrices();
            } else if (tc.name === 'get_market_status') {
              result = getMarketSchedulerStatus();
            } else if (tc.name === 'get_market_news') {
              result = MarketNewsService.getNews();
            } else if (tc.name === 'get_gold_price') {
              result = MarketDataService.getGoldPrice(args.purity || '24K');
            } else if (tc.name === 'get_silver_price') {
              result = MarketDataService.getSilverPrice();
            } else if (tc.name === 'get_budget_summary') {
              result = MarketDataService.getBudgetSummary(memoryStore);
            } else if (tc.name === 'calculate_investment_growth') {
              result = MarketDataService.calculateInvestmentGrowth(args);
            }

            // Feed tool output back to OpenAI
            formattedMessages.push({
              role: 'assistant',
              content: null,
              tool_calls: [{ id: tc.id, type: 'function', function: { name: tc.name, arguments: tc.argsStr } }]
            });
            formattedMessages.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: JSON.stringify(result)
            });
          }

          // Follow-up stream after tool response
          const secondStream = await openai.chat.completions.create({
            model: selectedModel,
            messages: formattedMessages,
            stream: true
          });

          for await (const chunk of secondStream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              fullAssistantResponse += content;
              sendSse('token', { delta: content });
            }
          }
        }

      } catch (err) {
        console.warn('⚠️ OpenAI Streaming API Fallback:', err.message);
        sendSse('warning', { message: `OpenAI Stream note: ${err.message}. Using financial engine.` });
        fullAssistantResponse = await simulateStreamingResponse(message, sendSse, memoryStore);
      }
    } else {
      // High-Availability Real-Time Financial Streaming Engine Fallback
      fullAssistantResponse = await simulateStreamingResponse(message, sendSse, memoryStore);
    }

    // Save assistant message to conversation history
    conv.messages.push({ role: 'assistant', content: fullAssistantResponse, timestamp: new Date().toISOString() });
    sendSse('done', { conversation_id: convId, full_text: fullAssistantResponse });
    res.end();
  });

  return router;
}

/**
 * High-Availability Streaming Engine Simulation
 */
async function simulateStreamingResponse(userMessage, sendSse, memoryStore) {
  const lower = userMessage.toLowerCase();
  let text = '';

  if (lower.includes('invested') || lower.includes('portfolio') || lower.includes('total') || lower.includes('profit') || lower.includes('loss')) {
    const summary = SyncManager.getPortfolioSummary();
    sendSse('tool_call', { name: 'get_portfolio_summary', args: {} });

    if (summary.connectedPlatformsCount === 0) {
      text = `📊 **Portfolio Summary**:
Currently, no investment platforms have authorized connections.

- **Total Invested**: ₹0
- **Current Portfolio Value**: ₹0
- **Profit / Loss**: ₹0 (0%)

💡 *To view your real aggregated portfolio balance, please visit the **Platforms** tab to connect your Groww, SafeGold, Zerodha, or Aura Gold accounts.*`;
    } else {
      text = `📊 **Aggregated Portfolio Summary**:
- **Total Invested**: ₹${summary.totalInvested.toLocaleString('en-IN')}
- **Current Portfolio Value**: ₹${summary.totalCurrentValue.toLocaleString('en-IN')}
- **Net Profit / Loss**: +₹${summary.totalProfitLoss.toLocaleString('en-IN')} (${summary.totalProfitLossPercent}%)
- **Connected Platforms**: ${summary.connectedPlatformsCount} platforms (${summary.platformBreakdown.map(p => p.platform).join(', ')})

*Data Source*: Official Provider APIs (${summary.disclaimer})
*Last Synchronized*: ${new Date(summary.as_of).toLocaleTimeString()}`;
    }
  } else if (lower.includes('gold') && (lower.includes('quantity') || lower.includes('gram') || lower.includes('holding') || lower.includes('my gold'))) {
    const summary = SyncManager.getPortfolioSummary();
    sendSse('tool_call', { name: 'get_gold_summary', args: {} });
    const goldHoldings = summary.holdings.filter(h => h.asset_type === 'digital_gold');

    if (goldHoldings.length === 0) {
      text = `🪙 **Digital Gold Vault Holdings**:
No active digital gold platform connections found.

- **Total Gold Quantity**: 0.00 grams
- **Current Value**: ₹0

💡 *Connect your **SafeGold** or **Aura Gold** account under the **Platforms** tab to view your verified gold vault holdings.*`;
    } else {
      const totalGrams = goldHoldings.reduce((s, g) => s + (g.gold_quantity_grams || 0), 0);
      const totalVal = goldHoldings.reduce((s, g) => s + (g.current_value || 0), 0);
      text = `🪙 **Verified Digital Gold Vault Holdings**:
- **Total Gold Quantity**: ${totalGrams.toFixed(3)} grams (24K 99.9% Pure)
- **Current Gold Valuation**: ₹${totalVal.toLocaleString('en-IN')}
- **Vault Location**: Brinks Vault Security & IDBI Trustee

*Data Source*: Official SafeGold & Aura Gold Partner APIs
*Last Updated*: ${new Date(summary.as_of).toLocaleTimeString()}`;
    }
  } else if (lower.includes('gold') || lower.includes('gold price')) {
    const gold = await MarketDataService.getGoldPrice('24K');
    const gold22 = await MarketDataService.getGoldPrice('22K');
    sendSse('tool_call', { name: 'get_gold_price', args: { purity: '24K' } });
    text = `🪙 **Live Gold Market Rates** (${gold.source}):
- **24K Pure Gold**: ₹${gold.pricePer10g.toLocaleString()}/10g
- **22K Standard Gold**: ₹${gold22.pricePer10g.toLocaleString()}/10g

*Last Updated*: ${new Date(gold.timestamp).toLocaleTimeString()}
*Disclaimer*: ${gold.disclaimer || 'National reference price shown. Local jewellery rates & GST may differ.'}`;
  } else if (lower.includes('silver')) {
    const silver = await MarketDataService.getSilverPrice();
    sendSse('tool_call', { name: 'get_silver_price', args: {} });
    text = `🥈 **Live Silver Market Rates** (${silver.source}):
- **Per Gram**: ₹${silver.pricePerGram}
- **Per Kilogram**: ₹${silver.pricePerKg.toLocaleString()}

*Last Updated*: ${new Date(silver.timestamp).toLocaleTimeString()}`;
  } else {
    text = `Hello Alex! I am **Grow 0.2 AI Advisor**, your personal financial assistant.

I can help you with:
- 📊 **Real Portfolio Queries** ("How much have I invested in total?", "Show my profit and loss")
- 🪙 **Gold Vault Balances** ("What is my gold quantity in grams?")
- 📈 **Commodity Prices** ("What is today's 24K gold rate?")
- 💡 **Budgeting & Savings** ("How to save 20% of income?")

How can I assist your financial planning today?`;
  }

  // Stream tokens word by word
  const words = text.split(' ');
  for (const word of words) {
    sendSse('token', { delta: word + ' ' });
    await new Promise(r => setTimeout(r, 20));
  }

  return text;
}
