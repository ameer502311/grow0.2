// AI Advisor Service integrating Groq Cloud LPU (Llama 3.3 70B) & Google Gemini with Deterministic Fallbacks

export async function generateAiFinancialAdvice(analytics, ruleInsights = [], apiKey = '') {
  const groqKey = (apiKey && apiKey.startsWith('gsk_')) 
    ? apiKey 
    : (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here' ? process.env.GROQ_API_KEY : '');

  const geminiKey = (!groqKey && apiKey && !apiKey.startsWith('gsk_')) 
    ? apiKey 
    : (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here' ? process.env.GEMINI_API_KEY : process.env.AI_API_KEY || '');

  const summaryContext = {
    monthlyIncome: `₹${(analytics.totalIncome || 0).toLocaleString()}`,
    monthlyExpenses: `₹${(analytics.totalExpenses || 0).toLocaleString()}`,
    monthlySavings: `₹${(analytics.monthlySavings || 0).toLocaleString()}`,
    savingsRate: `${analytics.savingsRate || 0}%`,
    debtRatio: `${analytics.debtRatio || 0}%`,
    emergencyFundMonths: `${analytics.emergencyFundMonths || 0} months`,
    financialHealthScore: `${analytics.financialHealthScore || 50}/100 (${analytics.healthCategory || 'Stable'})`,
    topExpenses: analytics.categoryBreakdown || {},
    ruleEngineHighlights: ruleInsights.map(r => r.message)
  };

  // Default fallback object if AI API is missing or fails
  const fallbackAdvice = {
    summary: `Your calculated Financial Health Score is ${analytics.financialHealthScore || 50}/100 (${analytics.healthCategory || 'Stable'}). Monthly income is ${summaryContext.monthlyIncome} with total expenses of ${summaryContext.monthlyExpenses}, leaving a savings rate of ${analytics.savingsRate || 0}%.`,
    positiveHabits: ruleInsights.filter(r => r.priority === 'LOW').map(r => r.message),
    concerns: ruleInsights.filter(r => r.priority === 'HIGH' || r.priority === 'MEDIUM').map(r => r.message),
    savingTips: [
      `Maintain your monthly savings rate of ${analytics.savingsRate || 0}%.`,
      'Automate monthly transfers to index funds or high-yield savings on payday.'
    ],
    expenseTips: [
      'Track discretionary categories like Shopping & Food to avoid impulse spending.',
      'Review monthly subscription services and cancel unused memberships.'
    ],
    goalAdvice: [
      'Prioritize building a 3 to 6-month emergency liquid reserve.',
      'Align short-term target goals with low-risk gold or liquid instruments.'
    ],
    investmentEducation: [
      'Consider exploring low-cost NIFTY 50 index funds for long-term equity exposure.',
      'Learn about 24K Digital Gold as a hedge against inflation and market volatility.',
      'Maintain diversification across equity, debt, and liquid reserves based on your risk preference.'
    ],
    notificationTitle: `Financial Insight: Health Score ${analytics.financialHealthScore || 50}`,
    notificationMessage: `Your current savings rate is ${analytics.savingsRate || 0}%. Review personalized AI insights for recommendations.`,
    priority: (analytics.savingsRate || 0) < 10 || (analytics.debtRatio || 0) > 35 ? 'HIGH' : 'MEDIUM',
    source: 'HYBRID'
  };

  const promptText = `
Analyze the following user financial summary safely:
${JSON.stringify(summaryContext, null, 2)}

Respond strictly in valid JSON format with no extra markdown wrap or prose text outside the JSON object:
{
  "summary": "Clear 2-sentence summary of the user's financial health",
  "positiveHabits": ["Habit 1", "Habit 2"],
  "concerns": ["Concern 1"],
  "savingTips": ["Tip 1", "Tip 2"],
  "expenseTips": ["Tip 1"],
  "goalAdvice": ["Advice 1"],
  "investmentEducation": ["Educational concept 1", "Educational concept 2"],
  "notificationTitle": "Short title max 6 words",
  "notificationMessage": "Short notification under 20 words",
  "priority": "LOW" | "MEDIUM" | "HIGH"
}
`;

  // 1. Primary Choice: Groq LPU Ultra-Fast Inference
  if (groqKey) {
    try {
      const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: groqModel,
          messages: [
            { role: 'system', content: 'You are an expert AI Financial Advisor for Grow 0.2 Fintech platform. Respond strictly in valid JSON format.' },
            { role: 'user', content: promptText }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (groqRes.ok) {
        const groqData = await groqRes.json();
        const rawContent = groqData.choices?.[0]?.message?.content || '';
        const parsed = JSON.parse(rawContent);

        return {
          summary: parsed.summary || fallbackAdvice.summary,
          positiveHabits: parsed.positiveHabits || fallbackAdvice.positiveHabits,
          concerns: parsed.concerns || fallbackAdvice.concerns,
          savingTips: parsed.savingTips || fallbackAdvice.savingTips,
          expenseTips: parsed.expenseTips || fallbackAdvice.expenseTips,
          goalAdvice: parsed.goalAdvice || fallbackAdvice.goalAdvice,
          investmentEducation: parsed.investmentEducation || fallbackAdvice.investmentEducation,
          notificationTitle: parsed.notificationTitle || fallbackAdvice.notificationTitle,
          notificationMessage: parsed.notificationMessage || fallbackAdvice.notificationMessage,
          priority: parsed.priority || fallbackAdvice.priority,
          source: 'GROQ_AI'
        };
      } else {
        console.warn('⚠️ Groq API HTTP error:', groqRes.statusText);
      }
    } catch (err) {
      console.warn('⚠️ Groq API execution note:', err.message);
    }
  }

  // 2. Secondary Choice: Google Gemini 1.5 Flash
  if (geminiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        return {
          summary: parsed.summary || fallbackAdvice.summary,
          positiveHabits: parsed.positiveHabits || fallbackAdvice.positiveHabits,
          concerns: parsed.concerns || fallbackAdvice.concerns,
          savingTips: parsed.savingTips || fallbackAdvice.savingTips,
          expenseTips: parsed.expenseTips || fallbackAdvice.expenseTips,
          goalAdvice: parsed.goalAdvice || fallbackAdvice.goalAdvice,
          investmentEducation: parsed.investmentEducation || fallbackAdvice.investmentEducation,
          notificationTitle: parsed.notificationTitle || fallbackAdvice.notificationTitle,
          notificationMessage: parsed.notificationMessage || fallbackAdvice.notificationMessage,
          priority: parsed.priority || fallbackAdvice.priority,
          source: 'GEMINI_AI'
        };
      }
    } catch (err) {
      console.warn('⚠️ Gemini API execution note:', err.message);
    }
  }

  // 3. Deterministic Rule-Engine Fallback
  return fallbackAdvice;
}
