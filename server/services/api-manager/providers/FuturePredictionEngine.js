/**
 * GROW 0.2 Future Financial Prediction Engine
 * Deterministic Mathematical Wealth, Debt, and Savings Projector.
 * All projections are strictly calculated with compound interest formulas in the backend.
 * Groq AI provides natural-language narrative explanation without fabricating figures.
 */

import { BaseProviderAdapter } from './BaseProviderAdapter.js';
import { globalCacheManager } from '../cache/CacheManager.js';
import { DataValidator } from '../validation/DataValidator.js';

export class FuturePredictionEngine extends BaseProviderAdapter {
  constructor() {
    super({
      providerId: 'future_prediction_engine',
      providerName: 'Deterministic Financial Forecast & Groq AI Synthesizer',
      dataType: 'ai',
      authType: 'api_key',
      endpoint: 'api.groq.com/openai/v1/chat/completions',
      sourceUrl: 'https://groq.com',
      priority: 2
    });
  }

  /**
   * Deterministic Compound Growth Calculation:
   * FV = PV * (1 + r/12)^n + PMT * (((1 + r/12)^n - 1) / (r/12))
   */
  calculateFutureValue(pv, pmt, annualRate, months) {
    const monthlyRate = annualRate / 12;
    if (monthlyRate === 0) {
      return Math.round(pv + pmt * months);
    }
    const compoundedPv = pv * Math.pow(1 + monthlyRate, months);
    const compoundedPmt = pmt * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    return Math.round(compoundedPv + compoundedPmt);
  }

  /**
   * Generate comprehensive projections from user financial snapshot
   */
  generateProjections(snapshot) {
    const {
      monthlyIncome = 0,
      monthlyExpenses = 0,
      currentInvestments = 0,
      currentSavings = 0,
      totalDebt = 0,
      monthlyEmi = 0,
      goals = []
    } = snapshot;

    const currentLiquid = Math.max(0, currentInvestments + currentSavings);
    const monthlySurplus = Math.max(0, monthlyIncome - monthlyExpenses);
    const savingsRate = monthlyIncome > 0 ? Number(((monthlySurplus / monthlyIncome) * 100).toFixed(1)) : 0;

    // Safe investment allocation from surplus (assuming 75% surplus invested, 25% buffer)
    const monthlyInvestmentContribution = Math.round(monthlySurplus * 0.75);

    // 1-Year, 3-Year, 5-Year Scenarios
    // Conservative: 6.5% p.a. | Moderate: 10% p.a. | Aggressive: 13% p.a.
    const scenarios = {
      oneYear: {
        months: 12,
        label: '1 Year Horizon (Estimated)',
        conservative: this.calculateFutureValue(currentLiquid, monthlyInvestmentContribution, 0.065, 12),
        moderate: this.calculateFutureValue(currentLiquid, monthlyInvestmentContribution, 0.10, 12),
        aggressive: this.calculateFutureValue(currentLiquid, monthlyInvestmentContribution, 0.13, 12),
        totalContributed: Math.round(currentLiquid + monthlyInvestmentContribution * 12)
      },
      threeYear: {
        months: 36,
        label: '3 Year Horizon (Estimated)',
        conservative: this.calculateFutureValue(currentLiquid, monthlyInvestmentContribution, 0.065, 36),
        moderate: this.calculateFutureValue(currentLiquid, monthlyInvestmentContribution, 0.10, 36),
        aggressive: this.calculateFutureValue(currentLiquid, monthlyInvestmentContribution, 0.13, 36),
        totalContributed: Math.round(currentLiquid + monthlyInvestmentContribution * 36)
      },
      fiveYear: {
        months: 60,
        label: '5 Year Horizon (Estimated)',
        conservative: this.calculateFutureValue(currentLiquid, monthlyInvestmentContribution, 0.065, 60),
        moderate: this.calculateFutureValue(currentLiquid, monthlyInvestmentContribution, 0.10, 60),
        aggressive: this.calculateFutureValue(currentLiquid, monthlyInvestmentContribution, 0.13, 60),
        totalContributed: Math.round(currentLiquid + monthlyInvestmentContribution * 60)
      }
    };

    // Debt Elimination Trajectory
    let monthsToDebtFree = 0;
    if (totalDebt > 0 && monthlyEmi > 0) {
      monthsToDebtFree = Math.ceil(totalDebt / monthlyEmi);
    }

    // Goal Completion Projections
    const projectedGoals = goals.map(g => {
      const remaining = Math.max(0, (g.targetAmount || 0) - (g.currentAmount || 0));
      let estimatedMonths = 0;
      if (remaining > 0 && monthlySurplus > 0) {
        // Assume 50% surplus allocated across goals
        const goalMonthlyAlloc = (monthlySurplus * 0.5) / Math.max(1, goals.length);
        estimatedMonths = Math.ceil(remaining / Math.max(100, goalMonthlyAlloc));
      }
      return {
        id: g.id || g.name,
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        remainingAmount: remaining,
        estimatedMonthsToAchieve: estimatedMonths,
        isAchievableWithinYear: estimatedMonths > 0 && estimatedMonths <= 12
      };
    });

    return {
      timestamp: new Date().toISOString(),
      disclaimer: "Estimated Projection Only. Returns are indicative and do not guarantee future investment performance.",
      metrics: {
        monthlyIncome,
        monthlyExpenses,
        monthlySurplus,
        savingsRate,
        monthlyInvestmentContribution,
        currentLiquidAssets: currentLiquid,
        totalOutstandingDebt: totalDebt,
        monthlyEmi,
        monthsToDebtFree
      },
      projections: scenarios,
      goals: projectedGoals
    };
  }

  /**
   * Send validated deterministic projection numbers to Groq for concise explanation
   */
  async generateAiExplanation(projectionsData) {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return {
        explanation: `Based on your deterministic savings rate of ${projectionsData.metrics.savingsRate}%, you are saving ₹${projectionsData.metrics.monthlySurplus.toLocaleString()} monthly. In 3 years, your balanced portfolio projection is estimated at ₹${projectionsData.projections.threeYear.moderate.toLocaleString()}. Maintain low discretionary expenses to accelerate your wealth targets.`,
        model: 'Rule-Based Deterministic Engine',
        generatedAt: new Date().toISOString()
      };
    }

    try {
      const summaryMetrics = `
- Monthly Income: ₹${projectionsData.metrics.monthlyIncome}
- Monthly Expenses: ₹${projectionsData.metrics.monthlyExpenses}
- Monthly Surplus: ₹${projectionsData.metrics.monthlySurplus}
- Savings Rate: ${projectionsData.metrics.savingsRate}%
- Current Liquid Corpus: ₹${projectionsData.metrics.currentLiquidAssets}
- 1-Year Projected Corpus (Moderate 10%): ₹${projectionsData.projections.oneYear.moderate}
- 3-Year Projected Corpus (Moderate 10%): ₹${projectionsData.projections.threeYear.moderate}
- 5-Year Projected Corpus (Moderate 10%): ₹${projectionsData.projections.fiveYear.moderate}
- Outstanding Debt: ₹${projectionsData.metrics.totalOutstandingDebt} (Months to clear: ${projectionsData.metrics.monthsToDebtFree})
`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are Grow 0.2 Financial Projection AI powered by Groq LPU. Explain the calculated future projections clearly in 3 brief bullet points (Trajectory, Key Risk/Habit, Actionable Recommendation). Strictly use the exact numbers provided. Never invent returns or promise future performance. State that figures are projections.'
            },
            {
              role: 'user',
              content: `Here are the deterministic backend projections:\n${summaryMetrics}\nProvide the explanation.`
            }
          ],
          max_tokens: 350
        })
      });

      if (response.ok) {
        const json = await response.json();
        return {
          explanation: json.choices?.[0]?.message?.content,
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          provider: 'Groq Cloud LPU',
          generatedAt: new Date().toISOString()
        };
      }
    } catch (err) {
      console.warn('⚠️ Groq explanation error:', err.message);
    }

    return {
      explanation: `Deterministic projection indicates healthy wealth compounding. At a 10% balanced trajectory, your liquid assets are projected to reach ₹${projectionsData.projections.threeYear.moderate.toLocaleString()} over 3 years. Continue systematic monthly savings of ₹${projectionsData.metrics.monthlySurplus.toLocaleString()}.`,
      model: 'Fallback Rule Engine',
      generatedAt: new Date().toISOString()
    };
  }
}

export const futurePredictionEngine = new FuturePredictionEngine();
export default futurePredictionEngine;
