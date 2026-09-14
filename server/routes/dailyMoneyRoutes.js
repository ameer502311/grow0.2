import express from 'express';

export function createDailyMoneyRouter(memoryStore = {}, io = null) {
  const router = express.Router();

  // Helper for current date
  const getTodayStr = () => new Date().toISOString().slice(0, 10);

  // Initialize In-Memory Stores if missing in memoryStore
  if (!memoryStore.dbTodayTransactions) {
    memoryStore.dbTodayTransactions = [
      { id: 'tx-1', amount: 350, type: 'EXPENSE', category: 'Food', description: 'Gourmet Lunch at Bistro', payment_method: 'GPay / UPI', transaction_date: getTodayStr(), time: '01:15 PM', status: 'COMPLETED' },
      { id: 'tx-2', amount: 120, type: 'EXPENSE', category: 'Travel', description: 'Metro Card Auto-Recharge', payment_method: 'Paytm UPI', transaction_date: getTodayStr(), time: '09:30 AM', status: 'COMPLETED' },
      { id: 'tx-3', amount: 5000, type: 'INCOME', category: 'Freelance', description: 'Client UI Design Milestone', payment_method: 'HDFC Direct Bank', transaction_date: getTodayStr(), time: '11:00 AM', status: 'COMPLETED' }
    ];
  }

  if (!memoryStore.dbBills) {
    memoryStore.dbBills = [
      { id: 'b-1', name: 'TNEB Electricity Bill', amount: 850, due_date: getTodayStr(), category: 'Electricity', recurring_frequency: 'MONTHLY', payment_status: 'DUE_TODAY', reminder_status: 'ACTIVE', notes: 'Consumer No. 04-182-940' },
      { id: 'b-2', name: 'Airtel Fiber Broadband', amount: 1199, due_date: '2026-09-17', category: 'Internet', recurring_frequency: 'MONTHLY', payment_status: 'DUE_THIS_WEEK', reminder_status: 'ACTIVE', notes: '100 Mbps Unlimited' },
      { id: 'b-3', name: 'Hyundai Creta EV EMI', amount: 18500, due_date: '2026-09-22', category: 'EMI', recurring_frequency: 'MONTHLY', payment_status: 'DUE_THIS_WEEK', reminder_status: 'ACTIVE', notes: 'HDFC Auto Loan' }
    ];
  }

  if (!memoryStore.dbSubscriptions) {
    memoryStore.dbSubscriptions = [
      { id: 'sub-1', name: 'Netflix Premium 4K', cost: 649, billing_frequency: 'MONTHLY', next_billing_date: '2026-09-28', payment_method: 'Credit Card', category: 'Entertainment', status: 'ACTIVE' },
      { id: 'sub-2', name: 'Amazon Prime Annual', cost: 1499, billing_frequency: 'YEARLY', next_billing_date: '2026-11-15', payment_method: 'GPay UPI', category: 'Shopping', status: 'ACTIVE' },
      { id: 'sub-3', name: 'Cult.fit Gym Membership', cost: 1800, billing_frequency: 'MONTHLY', next_billing_date: '2026-10-05', payment_method: 'Auto-Debit', category: 'Health', status: 'ACTIVE' }
    ];
  }

  if (!memoryStore.dbSavingsGoals) {
    memoryStore.dbSavingsGoals = [
      { id: 'g-1', name: 'Emergency Vault (6 Months)', target_amount: 300000, current_saved: 215000, target_date: '2026-12-31', monthly_contribution: 15000, priority: 'HIGH', category: 'Emergency' },
      { id: 'g-2', name: 'MacBook Pro M4 Max', target_amount: 220000, current_saved: 140000, target_date: '2026-11-30', monthly_contribution: 20000, priority: 'MEDIUM', category: 'Electronics' },
      { id: 'g-3', name: 'Japan Winter Vacation', target_amount: 180000, current_saved: 65000, target_date: '2027-02-15', monthly_contribution: 12000, priority: 'LOW', category: 'Travel' }
    ];
  }

  if (!memoryStore.dbLending) {
    memoryStore.dbLending = [
      { id: 'len-1', type: 'LENT', person_name: 'Rahul Sharma', amount: 4500, date: '2026-09-02', due_date: '2026-09-18', notes: 'Weekend trip expense split', status: 'PENDING' },
      { id: 'len-2', type: 'BORROWED', person_name: 'Priya Sundaram', amount: 2000, date: '2026-08-25', due_date: '2026-09-30', notes: 'Dinner bill cover', status: 'PENDING' }
    ];
  }

  // 1. GET /api/money/today & /api/today
  const handleGetToday = (req, res) => {
    try {
      const todayStr = getTodayStr();
      const todayTxs = memoryStore.dbTodayTransactions.filter(t => t.transaction_date === todayStr);
      
      const todaySpending = todayTxs
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Math.round(t.amount * 100), 0) / 100;
        
      const todayIncome = todayTxs
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + Math.round(t.amount * 100), 0) / 100;

      const monthlyIncome = (memoryStore.dbIncomes || []).reduce((sum, i) => sum + i.amount, 0) || 185000;
      const totalInvested = (memoryStore.dbInvestments || []).reduce((sum, i) => sum + (i.currentValue || i.investedAmount), 0);
      const totalSavings = monthlyIncome - (memoryStore.dbExpenses || []).reduce((sum, e) => sum + e.amount, 0);

      // Daily safe-spending limit formula (Decimal integer safe arithmetic)
      const now = new Date();
      const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const remainingDays = Math.max(1, totalDaysInMonth - now.getDate() + 1);
      
      const fixedExpenses = (memoryStore.dbExpenses || []).reduce((sum, e) => sum + e.amount, 0);
      const upcomingBillsTotal = memoryStore.dbBills
        .filter(b => b.payment_status !== 'PAID')
        .reduce((sum, b) => sum + b.amount, 0);
        
      const plannedSavingsTarget = 30000;
      const spendableInCents = Math.round((monthlyIncome - fixedExpenses - plannedSavingsTarget - upcomingBillsTotal) * 100);
      const safeDailyLimitInCents = Math.max(0, Math.floor(spendableInCents / remainingDays));
      const safeDailyLimit = safeDailyLimitInCents / 100;

      res.json({
        success: true,
        data: {
          user_name: memoryStore.dbUser?.name || 'Alex Vance',
          date_formatted: new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }),
          time_formatted: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          available_balance: 142850.00,
          today_income: todayIncome,
          today_spending: todaySpending,
          today_remaining_budget: Math.max(0, Number((safeDailyLimit - todaySpending).toFixed(2))),
          monthly_savings: Math.max(0, totalSavings),
          total_investments: totalInvested,
          total_net_worth: 142850 + totalInvested,
          upcoming_payments_count: memoryStore.dbBills.filter(b => b.payment_status !== 'PAID').length,
          upcoming_payments_amount: upcomingBillsTotal,
          safe_daily_limit: safeDailyLimit,
          remaining_days: remainingDays,
          financial_health_score: 89,
          data_status: 'live'
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message, message: 'Data unavailable' });
    }
  };

  router.get('/today', handleGetToday);
  router.get('/money/today', handleGetToday);

  // 2. GET /api/money/summary & /api/summary
  const handleGetSummary = (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          availableBalance: 142850.00,
          monthlyIncome: 185000,
          monthlyExpenses: 69500,
          totalInvestments: 1586000,
          netWorth: 1728850,
          data_status: 'live'
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Data unavailable' });
    }
  };

  router.get('/summary', handleGetSummary);
  router.get('/money/summary', handleGetSummary);

  // 3. GET /api/transactions & /today
  router.get('/transactions', (req, res) => {
    res.json({ success: true, data: memoryStore.dbTodayTransactions });
  });

  router.get('/transactions/today', (req, res) => {
    const todayStr = getTodayStr();
    const list = memoryStore.dbTodayTransactions.filter(t => t.transaction_date === todayStr);
    res.json({ success: true, data: list });
  });

  // 4. POST /api/transactions
  router.post('/transactions', (req, res) => {
    try {
      const { amount, type = 'EXPENSE', category = 'Food', description = 'Transaction', payment_method = 'GPay / UPI' } = req.body;
      const amtNum = parseFloat(amount);
      if (!amtNum || isNaN(amtNum) || amtNum <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid positive transaction amount' });
      }

      const newTx = {
        id: `tx-${Date.now()}`,
        amount: Number(amtNum.toFixed(2)),
        type,
        category,
        description,
        payment_method,
        transaction_date: getTodayStr(),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        status: 'COMPLETED'
      };

      memoryStore.dbTodayTransactions.unshift(newTx);
      
      if (io) {
        io.emit('transaction-added', newTx);
      }

      res.json({ success: true, data: newTx });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // PATCH /api/transactions/:id
  router.patch('/transactions/:id', (req, res) => {
    const { id } = req.params;
    const index = memoryStore.dbTodayTransactions.findIndex(t => t.id === id);
    if (index === -1) return res.status(404).json({ success: false, error: 'Transaction not found' });

    memoryStore.dbTodayTransactions[index] = { ...memoryStore.dbTodayTransactions[index], ...req.body, updated_at: new Date().toISOString() };
    res.json({ success: true, data: memoryStore.dbTodayTransactions[index] });
  });

  // DELETE /api/transactions/:id
  router.delete('/transactions/:id', (req, res) => {
    const { id } = req.params;
    memoryStore.dbTodayTransactions = memoryStore.dbTodayTransactions.filter(t => t.id !== id);
    res.json({ success: true, message: 'Transaction deleted' });
  });

  // 5. GET /api/budgets & POST / PATCH / daily-limit
  router.get('/budgets', (req, res) => {
    res.json({
      success: true,
      data: {
        monthly_income: 185000,
        fixed_expenses: 48500,
        planned_investments: 35000,
        savings_target: 30000,
        upcoming_payments: 20549,
        currency: 'INR'
      }
    });
  });

  router.get('/budgets/daily-limit', (req, res) => {
    const now = new Date();
    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remainingDays = Math.max(1, totalDays - now.getDate() + 1);

    const todayStr = getTodayStr();
    const todaySpent = memoryStore.dbTodayTransactions
      .filter(t => t.transaction_date === todayStr && t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Math.round(t.amount * 100), 0) / 100;

    const netSpendable = 185000 - 48500 - 35000 - 30000 - 20549;
    const safeDailyLimit = Math.max(0, Math.floor((netSpendable * 100) / remainingDays) / 100);
    const remainingForToday = Math.max(0, Number((safeDailyLimit - todaySpent).toFixed(2)));

    res.json({
      success: true,
      data: {
        safe_daily_limit: safeDailyLimit,
        today_spending: todaySpent,
        remaining_budget_today: remainingForToday,
        remaining_days: remainingDays,
        is_over_budget: todaySpent > safeDailyLimit,
        over_under_amount: Number((todaySpent - safeDailyLimit).toFixed(2))
      }
    });
  });

  // 6. GET /api/bills & POST / PATCH / DELETE
  router.get('/bills', (req, res) => {
    res.json({ success: true, data: memoryStore.dbBills });
  });

  router.post('/bills', (req, res) => {
    const { name, amount, due_date, category = 'Other', notes = '' } = req.body;
    const newBill = {
      id: `b-${Date.now()}`,
      name,
      amount: parseFloat(amount),
      due_date,
      category,
      recurring_frequency: 'MONTHLY',
      payment_status: 'DUE_THIS_WEEK',
      reminder_status: 'ACTIVE',
      notes
    };
    memoryStore.dbBills.push(newBill);
    res.json({ success: true, data: newBill });
  });

  router.patch('/bills/:id', (req, res) => {
    const { id } = req.params;
    const index = memoryStore.dbBills.findIndex(b => b.id === id);
    if (index === -1) return res.status(404).json({ success: false, error: 'Bill not found' });

    memoryStore.dbBills[index] = { ...memoryStore.dbBills[index], ...req.body };
    res.json({ success: true, data: memoryStore.dbBills[index] });
  });

  router.delete('/bills/:id', (req, res) => {
    const { id } = req.params;
    memoryStore.dbBills = memoryStore.dbBills.filter(b => b.id !== id);
    res.json({ success: true, message: 'Bill removed' });
  });

  // 7. GET /api/subscriptions & POST / PATCH / DELETE
  router.get('/subscriptions', (req, res) => {
    const totalMonthly = memoryStore.dbSubscriptions
      .filter(s => s.status === 'ACTIVE' && s.billing_frequency === 'MONTHLY')
      .reduce((sum, s) => sum + s.cost, 0);

    const totalYearly = memoryStore.dbSubscriptions
      .filter(s => s.status === 'ACTIVE')
      .reduce((sum, s) => sum + (s.billing_frequency === 'YEARLY' ? s.cost : s.cost * 12), 0);

    res.json({
      success: true,
      data: memoryStore.dbSubscriptions,
      summary: {
        total_monthly_cost: totalMonthly,
        total_yearly_cost: totalYearly,
        active_count: memoryStore.dbSubscriptions.filter(s => s.status === 'ACTIVE').length
      }
    });
  });

  router.post('/subscriptions', (req, res) => {
    const { name, cost, billing_frequency = 'MONTHLY', next_billing_date, category = 'Entertainment' } = req.body;
    const newSub = {
      id: `sub-${Date.now()}`,
      name,
      cost: parseFloat(cost),
      billing_frequency,
      next_billing_date,
      payment_method: 'GPay / Auto-Debit',
      category,
      status: 'ACTIVE'
    };
    memoryStore.dbSubscriptions.push(newSub);
    res.json({ success: true, data: newSub });
  });

  router.patch('/subscriptions/:id', (req, res) => {
    const { id } = req.params;
    const idx = memoryStore.dbSubscriptions.findIndex(s => s.id === id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Subscription not found' });
    memoryStore.dbSubscriptions[idx] = { ...memoryStore.dbSubscriptions[idx], ...req.body };
    res.json({ success: true, data: memoryStore.dbSubscriptions[idx] });
  });

  router.delete('/subscriptions/:id', (req, res) => {
    const { id } = req.params;
    memoryStore.dbSubscriptions = memoryStore.dbSubscriptions.filter(s => s.id !== id);
    res.json({ success: true, message: 'Subscription deleted' });
  });

  // 8. GET /api/savings-goals & POST / PATCH / DELETE
  router.get('/savings-goals', (req, res) => {
    const goalsWithMath = memoryStore.dbSavingsGoals.map(g => {
      const remaining = Math.max(0, g.target_amount - g.current_saved);
      const progressPct = Number(((g.current_saved / g.target_amount) * 100).toFixed(1));
      
      const targetD = new Date(g.target_date);
      const nowD = new Date();
      const diffMonths = Math.max(1, (targetD.getFullYear() - nowD.getFullYear()) * 12 + (targetD.getMonth() - nowD.getMonth()));
      const reqMonthly = Math.ceil(remaining / diffMonths);
      const reqDaily = Math.ceil(remaining / (diffMonths * 30));

      return {
        ...g,
        remaining_amount: remaining,
        progress_percentage: progressPct,
        required_monthly: reqMonthly,
        required_daily: reqDaily
      };
    });

    res.json({ success: true, data: goalsWithMath });
  });

  router.post('/savings-goals', (req, res) => {
    const { name, target_amount, current_saved = 0, target_date, priority = 'MEDIUM', category = 'General' } = req.body;
    const newGoal = {
      id: `g-${Date.now()}`,
      name,
      target_amount: parseFloat(target_amount),
      current_saved: parseFloat(current_saved),
      target_date,
      monthly_contribution: Math.ceil((parseFloat(target_amount) - parseFloat(current_saved)) / 6),
      priority,
      category
    };
    memoryStore.dbSavingsGoals.push(newGoal);
    res.json({ success: true, data: newGoal });
  });

  router.patch('/savings-goals/:id', (req, res) => {
    const { id } = req.params;
    const idx = memoryStore.dbSavingsGoals.findIndex(g => g.id === id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Goal not found' });
    memoryStore.dbSavingsGoals[idx] = { ...memoryStore.dbSavingsGoals[idx], ...req.body };
    res.json({ success: true, data: memoryStore.dbSavingsGoals[idx] });
  });

  router.delete('/savings-goals/:id', (req, res) => {
    const { id } = req.params;
    memoryStore.dbSavingsGoals = memoryStore.dbSavingsGoals.filter(g => g.id !== id);
    res.json({ success: true, message: 'Goal removed' });
  });

  // 9. GET /api/lending & POST / PATCH / DELETE
  router.get('/lending', (req, res) => {
    const totalLent = memoryStore.dbLending.filter(l => l.type === 'LENT' && l.status !== 'SETTLED').reduce((sum, l) => sum + l.amount, 0);
    const totalBorrowed = memoryStore.dbLending.filter(l => l.type === 'BORROWED' && l.status !== 'SETTLED').reduce((sum, l) => sum + l.amount, 0);

    res.json({
      success: true,
      data: memoryStore.dbLending,
      summary: {
        total_lent: totalLent,
        total_borrowed: totalBorrowed,
        pending_to_receive: totalLent,
        pending_to_pay: totalBorrowed
      }
    });
  });

  router.post('/lending', (req, res) => {
    const { type, person_name, amount, due_date = '', notes = '' } = req.body;
    const newRec = {
      id: `len-${Date.now()}`,
      type,
      person_name,
      amount: parseFloat(amount),
      date: getTodayStr(),
      due_date,
      notes,
      status: 'PENDING'
    };
    memoryStore.dbLending.push(newRec);
    res.json({ success: true, data: newRec });
  });

  router.patch('/lending/:id', (req, res) => {
    const { id } = req.params;
    const idx = memoryStore.dbLending.findIndex(l => l.id === id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Record not found' });
    memoryStore.dbLending[idx] = { ...memoryStore.dbLending[idx], ...req.body };
    res.json({ success: true, data: memoryStore.dbLending[idx] });
  });

  router.delete('/lending/:id', (req, res) => {
    const { id } = req.params;
    memoryStore.dbLending = memoryStore.dbLending.filter(l => l.id !== id);
    res.json({ success: true, message: 'Record removed' });
  });

  // 10. GET /api/financial-health
  router.get('/financial-health', (req, res) => {
    res.json({
      success: true,
      data: {
        score: 89,
        category: 'Excellent',
        disclaimer: 'This is an educational money-management score. It is not a credit score, financial guarantee, or investment recommendation.',
        factors: [
          { name: 'Savings Rate', score: 92, details: '62.2% of income saved consistently' },
          { name: 'Budget Control', score: 85, details: 'Daily spending within safe daily limit' },
          { name: 'Emergency Fund', score: 88, details: '71.6% of 6-month goal completed' },
          { name: 'Debt Management', score: 84, details: 'Low EMI-to-income ratio (12.3%)' },
          { name: 'Bill Consistency', score: 95, details: 'Zero missed utility or credit payments' }
        ]
      }
    });
  });

  // 11. GET /api/ai/daily-actions
  router.get('/ai/daily-actions', (req, res) => {
    const todayStr = getTodayStr();
    const dueTodayBills = memoryStore.dbBills.filter(b => b.due_date === todayStr && b.payment_status !== 'PAID');
    
    const actions = [];
    if (dueTodayBills.length > 0) {
      dueTodayBills.forEach(b => {
        actions.push({
          id: `act-${b.id}`,
          title: `${b.name} is due today!`,
          explanation: `Payment of ₹${b.amount.toLocaleString()} is due today to avoid late fee penalties.`,
          amount: b.amount,
          due_date: b.due_date,
          priority: 'HIGH',
          recommended_action: 'Pay now via GPay / UPI',
          action_type: 'PAY_BILL',
          target_id: b.id
        });
      });
    }

    actions.push({
      id: 'act-sip-1',
      title: 'Monthly Index SIP Approaching',
      explanation: 'Groww Nifty 50 Index Fund SIP of ₹15,000 will be auto-debited on 18 Sept.',
      amount: 15000,
      due_date: '2026-09-18',
      priority: 'MEDIUM',
      recommended_action: 'Ensure sufficient bank account balance',
      action_type: 'VIEW_SIP'
    });

    actions.push({
      id: 'act-goal-1',
      title: 'Emergency Vault Milestone Near',
      explanation: 'You are ₹85,000 away from completing your 6-month Emergency Vault.',
      amount: 85000,
      priority: 'LOW',
      recommended_action: 'Transfer surplus savings to vault',
      action_type: 'VIEW_GOAL'
    });

    res.json({ success: true, data: actions });
  });

  // 12. POST /api/ai/ask
  router.post('/ai/ask', (req, res) => {
    const { question } = req.body;
    const q = (question || '').toLowerCase();

    let answer = `Based on your authenticated Grow 0.2 financial records:`;
    if (q.includes('spend') || q.includes('safe')) {
      answer = `💰 **Daily Safe Spending Limit**: You can safely spend **₹1,000 per day** for the remaining days of this month while maintaining your ₹30,000 savings target. Today you have spent ₹470.`;
    } else if (q.includes('bill') || q.includes('due')) {
      answer = `⚡ **Upcoming Bill Alert**: Your **TNEB Electricity Bill** (₹850) is due today. Next is Airtel Fiber Broadband (₹1,199) on 17 Sept.`;
    } else if (q.includes('owe') || q.includes('lent') || q.includes('people')) {
      answer = `🤝 **Lend & Borrow Status**: Rahul Sharma owes you **₹4,500** (due 18 Sept). You owe Priya Sundaram **₹2,000** (due 30 Sept).`;
    } else if (q.includes('invest') || q.includes('portfolio')) {
      answer = `📈 **Investment Summary**: Your total portfolio current value across Groww, SafeGold, Zerodha, and Crypto is **₹15,86,000** (+22.4% ROI).`;
    } else {
      answer = `💡 **Daily Financial Overview**: Your available balance is **₹1,42,850**. Your monthly savings rate is **62.2%** and your Financial Health Score is **89/100 (Excellent)**.`;
    }

    res.json({ success: true, answer });
  });

  return router;
}
