// Financial Math Engine

export interface SipResult {
  totalInvestment: number;
  estimatedReturns: number;
  totalValue: number;
  chartData: { year: number; investment: number; value: number }[];
}

export function calculateSIP(monthlyInvestment: number, expectedReturnRate: number, timeInYears: number): SipResult {
  const i = expectedReturnRate / 12 / 100;
  const n = timeInYears * 12;
  
  // Future Value formula: P * ({[1 + i]^n - 1} / i) * (1 + i)
  const futureValue = monthlyInvestment * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
  const totalInvestment = monthlyInvestment * n;
  const estimatedReturns = futureValue - totalInvestment;

  const chartData = [];
  for (let yr = 1; yr <= timeInYears; yr++) {
    const months = yr * 12;
    const val = monthlyInvestment * ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
    const inv = monthlyInvestment * months;
    chartData.push({
      year: yr,
      investment: Math.round(inv),
      value: Math.round(val)
    });
  }

  return {
    totalInvestment: Math.round(totalInvestment),
    estimatedReturns: Math.round(estimatedReturns),
    totalValue: Math.round(futureValue),
    chartData
  };
}

export interface FdResult {
  principal: number;
  interestEarned: number;
  totalValue: number;
}

export function calculateFD(principal: number, interestRate: number, tenureYears: number): FdResult {
  // Compound quarterly formula by default
  const n = 4;
  const r = interestRate / 100;
  const totalValue = principal * Math.pow(1 + r / n, n * tenureYears);
  const interestEarned = totalValue - principal;

  return {
    principal: Math.round(principal),
    interestEarned: Math.round(interestEarned),
    totalValue: Math.round(totalValue)
  };
}

export interface EmiResult {
  monthlyEmi: number;
  totalInterest: number;
  totalPayment: number;
  amortization: { month: number; principalPaid: number; interestPaid: number; remainingBalance: number }[];
}

export function calculateEMI(principal: number, annualInterestRate: number, tenureYears: number): EmiResult {
  const r = annualInterestRate / 12 / 100;
  const n = tenureYears * 12;
  
  const monthlyEmi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPayment = monthlyEmi * n;
  const totalInterest = totalPayment - principal;

  let balance = principal;
  const amortization = [];
  for (let m = 1; m <= n; m++) {
    const interestForMonth = balance * r;
    const principalForMonth = monthlyEmi - interestForMonth;
    balance = Math.max(0, balance - principalForMonth);
    
    if (m % 12 === 0 || m === n) {
      amortization.push({
        month: m,
        principalPaid: Math.round(principalForMonth),
        interestPaid: Math.round(interestForMonth),
        remainingBalance: Math.round(balance)
      });
    }
  }

  return {
    monthlyEmi: Math.round(monthlyEmi),
    totalInterest: Math.round(totalInterest),
    totalPayment: Math.round(totalPayment),
    amortization
  };
}

export function calculateCAGR(buyPrice: number, sellPrice: number, years: number): number {
  if (buyPrice <= 0 || years <= 0) return 0;
  const cagr = (Math.pow(sellPrice / buyPrice, 1 / years) - 1) * 100;
  return parseFloat(cagr.toFixed(2));
}

export function calculateInflation(currentCost: number, inflationRate: number, years: number): number {
  const futureCost = currentCost * Math.pow(1 + inflationRate / 100, years);
  return Math.round(futureCost);
}

export function calculateRetirement(
  currentAge: number,
  retirementAge: number,
  monthlyExpenses: number,
  inflationRate: number,
  expectedReturnRate: number
): { corpusNeeded: number; monthlySavingsNeeded: number } {
  const yearsToRetire = Math.max(1, retirementAge - currentAge);
  const futureMonthlyExpense = calculateInflation(monthlyExpenses, inflationRate, yearsToRetire);
  const annualExpenseAtRetire = futureMonthlyExpense * 12;
  
  // Real rate of return post retirement
  const realReturn = ((1 + expectedReturnRate / 100) / (1 + inflationRate / 100) - 1);
  const retirementDurationYears = 25; // standard assumption
  
  // Present Value of Annuity formula for retirement corpus
  const corpusNeeded = annualExpenseAtRetire * ((1 - Math.pow(1 + realReturn, -retirementDurationYears)) / realReturn);
  
  // Monthly SIP needed to reach corpus
  const sipRes = calculateSIP(1000, expectedReturnRate, yearsToRetire);
  const factor = sipRes.totalValue / 1000;
  const monthlySavingsNeeded = corpusNeeded / factor;

  return {
    corpusNeeded: Math.round(corpusNeeded),
    monthlySavingsNeeded: Math.round(monthlySavingsNeeded)
  };
}
