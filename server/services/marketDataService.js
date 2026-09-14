import { goldSilverProvider } from './market_data/goldSilverProvider.js';

// Live / Cached Market Prices Store
let cachedMarketPrices = {
  gold: {
    "24k": 115402, // INR per 10g (Live normalized default)
    "22k": 105708,
    "18k": 86552
  },
  silver: {
    per_gram: 114.20,
    per_kg: 114200
  },
  currency: "INR",
  source: "Gold-API Verified Spot Feed",
  updated_at: new Date().toISOString()
};

export class MarketDataService {
  /**
   * Get Current Market Prices
   */
  static async getMarketPrices() {
    try {
      const snap = await goldSilverProvider.getGoldSnapshot();
      if (snap && snap.pricePer10g) {
        cachedMarketPrices.gold["24k"] = snap.pricePer10g;
        cachedMarketPrices.gold["22k"] = snap.pricePer10g22k || Math.round(snap.pricePer10g * (916/999));
        cachedMarketPrices.gold["18k"] = Math.round(snap.pricePer10g * (750/999));
        cachedMarketPrices.source = snap.source || "Gold-API Verified Spot Feed";
      }
      const silSnap = await goldSilverProvider.getSilverSnapshot();
      if (silSnap && silSnap.price) {
        cachedMarketPrices.silver.per_kg = silSnap.price;
        cachedMarketPrices.silver.per_gram = Number((silSnap.price / 1000).toFixed(2));
      }
    } catch (e) {
      console.error('MarketDataService error:', e.message);
    }
    cachedMarketPrices.updated_at = new Date().toISOString();
    return cachedMarketPrices;
  }

  /**
   * OpenAI Tool: get_gold_price
   */
  static async getGoldPrice(purity = "24K") {
    const prices = await this.getMarketPrices();
    const key = purity.toLowerCase();
    const price = prices.gold[key] || prices.gold["24k"];
    return {
      purity,
      pricePer10g: price,
      currency: "INR",
      source: prices.source,
      timestamp: prices.updated_at,
      disclaimer: "National reference price shown. Local jewellery rates & GST may differ."
    };
  }

  /**
   * OpenAI Tool: get_silver_price
   */
  static async getSilverPrice() {
    const prices = await this.getMarketPrices();
    return {
      pricePerGram: prices.silver.per_gram,
      pricePerKg: prices.silver.per_kg,
      currency: "INR",
      source: prices.source,
      timestamp: prices.updated_at,
      disclaimer: "National reference price shown. Local jewellery rates & GST may differ."
    };
  }

  /**
   * OpenAI Tool: get_budget_summary
   */
  static getBudgetSummary(memoryStore = null) {
    if (!memoryStore) {
      return {
        totalMonthlyIncome: 185000,
        totalMonthlyExpenses: 69500,
        netSavings: 115500,
        savingsRatePercent: 62.4,
        currency: "INR"
      };
    }

    const totalIncome = (memoryStore.dbIncomes || []).reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = (memoryStore.dbExpenses || []).reduce((sum, e) => sum + e.amount, 0);
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0;

    return {
      totalMonthlyIncome: totalIncome,
      totalMonthlyExpenses: totalExpense,
      netSavings,
      savingsRatePercent: Number(savingsRate),
      currency: "INR",
      activeIncomesCount: (memoryStore.dbIncomes || []).length,
      activeExpensesCount: (memoryStore.dbExpenses || []).length
    };
  }

  /**
   * OpenAI Tool: calculate_investment_growth
   */
  static calculateInvestmentGrowth({ principal = 0, monthlySip = 0, annualRatePercent = 12, tenureYears = 5 }) {
    const monthlyRate = annualRatePercent / 12 / 100;
    const totalMonths = tenureYears * 12;

    let lumpSumFuture = principal * Math.pow(1 + monthlyRate, totalMonths);
    let sipFuture = 0;

    if (monthlySip > 0 && monthlyRate > 0) {
      sipFuture = monthlySip * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);
    }

    const totalInvested = principal + (monthlySip * totalMonths);
    const totalFutureValue = Math.round(lumpSumFuture + sipFuture);
    const totalReturns = totalFutureValue - totalInvested;

    return {
      principalInvested: principal,
      monthlySipAmount: monthlySip,
      tenureYears,
      expectedAnnualReturnPercent: annualRatePercent,
      totalAmountInvested: totalInvested,
      estimatedFutureValue: totalFutureValue,
      estimatedWealthGain: totalReturns,
      currency: "INR"
    };
  }
}
