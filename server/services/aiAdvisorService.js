// AI Advisor Service integrating Google Gemini 1.5 Flash with Fallback Logic

export async function generateAiFinancialAdvice(analytics, ruleInsights = [], apiKey = '') {
  const systemKey = apiKey || process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '';

  const summaryContext = {
    monthlyIncome: `₹${analytics.totalIncome.toLocaleString()}`,
    monthlyExpenses: `₹${analytics.totalExpenses.toLocaleString()}`,
    monthlySavings: `₹${analytics.monthlySavings.toLocaleString()}`,
    savingsRate: `${analytics.savingsRate}%`,
    debtRatio: `${analytics.debtRatio}%`,
    emergencyFundMonths: `${analytics.emergencyFundMonths} months`,
    financialHealthScore: `${analytics.financialHealthScore}/100 (${analytics.healthCategory})`,
    topExpenses: analytics.categoryBreakdown,
    ruleEngineHighlights: ruleInsights.map(r => r.message)
  };

  // Default fallback object if Gemini API is missing or fails
  const fallbackAdvice = {
    summary: `Your calculated Financial Health Score is ${analytics.financialHealthScore}/100 (${analytics.healthCategory}). Monthly income is ${summaryContext.monthlyIncome} with total expenses of ${summaryContext.monthlyExpenses}, leaving a savings rate of ${analytics.savingsRate}%.`,
    positiveHabits: ruleInsights.filter(r => r.priority === 'LOW').map(r => r.message),
    concerns: ruleInsights.filter(r => r.priority === 'HIGH' || r.priority === 'MEDIUM').map(r => r.message),
    savingTips: [
      `Maintain your monthly savings rate of ${analytics.savingsRate}%.`,
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
    notificationTitle: `Financial Insight: Health Score ${analytics.financialHealthScore}`,
    notificationMessage: `Your current savings rate is ${analytics.savingsRate}%. Review personalized AI insights for recommendations.`,
    priority: analytics.savingsRate < 10 || analytics.debtRatio > 35 ? 'HIGH' : 'MEDIUM',
    source: 'HYBRID'
  };

  if (!systemKey) {
    console.log('ℹ️ Gemini API key not configured, returning deterministic rule-engine advice.');
    return fallbackAdvice;
  }

  try {
    const promptText = `
You are an expert AI Financial Advisor for the Grow 0.2 Fintech platform. Analyze the following user financial summary safely:

${JSON.stringify(summaryContext, null, 2)}

Respond strictly in valid JSON format with no extra markdown wrap or prose text outside the JSON object:
{
  "summary": "Clear 2-sentence summary of the user's financial health",
  "positiveHabits": ["Habit 1", "Habit 2"],
  "concerns": ["Concern 1"],
  "savingTips": ["Tip 1", "Tip 2"],
  "expenseTips": ["Tip 1"],
  "goalAdvice": ["Advice 1"],
  "investmentEducation": ["Educational educational concept 1", "Educational concept 2"],
  "notificationTitle": "Short title max 6 words",
  "notificationMessage": "Short notification under 20 words",
  "priority": "LOW" | "MEDIUM" | "HIGH"
}
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${systemKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!response.ok) {
      console.warn('⚠️ Gemini API HTTP error:', response.statusText);
      return fallbackAdvice;
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean potential markdown fencing
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
      source: 'AI'
    };
  } catch (err) {
    console.error('⚠️ Error calling Gemini AI Advisor:', err.message);
    return fallbackAdvice;
  }
}
