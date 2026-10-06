import express from 'express';

export function createDailyMoneyRouter(memoryStore = {}, io = null) {
  const router = express.Router();

  // Helper for current date
  const getTodayStr = () => new Date().toISOString().slice(0, 10);

  // Initialize In-Memory Stores if missing in memoryStore (Clean real-time state)
  if (!memoryStore.dbTodayTransactions) memoryStore.dbTodayTransactions = [];
  if (!memoryStore.dbBills) memoryStore.dbBills = [];
  if (!memoryStore.dbSubscriptions) memoryStore.dbSubscriptions = [];
  if (!memoryStore.dbSavingsGoals) memoryStore.dbSavingsGoals = [];
  if (!memoryStore.dbLending) memoryStore.dbLending = [];

  // 1. GET /api/money/today & /api/today
  const handleGetToday = (req, res) => {
    try {
      const todayStr = getTodayStr();
      const todayTxs = (memoryStore.dbTodayTransactions || []).filter(t => t.transaction_date === todayStr);
      
      const todaySpendingFromTxs = todayTxs
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Math.round(t.amount * 100), 0) / 100;
      const todayExpensesFromDb = (memoryStore.dbExpenses || [])
        .filter(e => (e.date || '').slice(0, 10) === todayStr && !todayTxs.some(t => t.id === e.id))
        .reduce((sum, e) => sum + Math.round(e.amount * 100), 0) / 100;
      const todaySpending = todaySpendingFromTxs + todayExpensesFromDb;

      const todayIncomeFromTxs = todayTxs
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + Math.round(t.amount * 100), 0) / 100;
      const todayIncomesFromDb = (memoryStore.dbIncomes || [])
        .filter(i => (i.date || '').slice(0, 10) === todayStr && !todayTxs.some(t => t.id === i.id))
        .reduce((sum, i) => sum + Math.round(i.amount * 100), 0) / 100;
      const todayIncome = todayIncomeFromTxs + todayIncomesFromDb;

      const monthlyIncome = (memoryStore.dbIncomes || []).reduce((sum, i) => sum + i.amount, 0);
      const fixedExpenses = (memoryStore.dbExpenses || []).reduce((sum, e) => sum + e.amount, 0);
      const totalInvested = (memoryStore.dbInvestments || []).reduce((sum, i) => sum + (i.currentValue || i.investedAmount), 0);
      const totalSavings = Math.max(0, monthlyIncome - fixedExpenses);
      const availableBalance = Math.max(0, monthlyIncome - fixedExpenses - todaySpending);

      // Daily safe-spending limit formula (Decimal integer safe arithmetic)
      const now = new Date();
      const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const remainingDays = Math.max(1, totalDaysInMonth - now.getDate() + 1);
      
      const upcomingBillsTotal = (memoryStore.dbBills || [])
        .filter(b => b.payment_status !== 'PAID')
        .reduce((sum, b) => sum + b.amount, 0);
        
      const spendableInCents = Math.round((monthlyIncome - fixedExpenses - upcomingBillsTotal) * 100);
      const safeDailyLimitInCents = Math.max(0, Math.floor(spendableInCents / remainingDays));
      const safeDailyLimit = safeDailyLimitInCents / 100;

      const score = monthlyIncome > 0 ? Math.min(100, Math.round(50 + (totalSavings / monthlyIncome) * 50)) : 50;

      res.json({
        success: true,
        data: {
          user_name: memoryStore.dbUser?.name || 'User',
          date_formatted: new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }),
          time_formatted: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          available_balance: availableBalance,
          today_income: todayIncome,
          today_spending: todaySpending,
          today_remaining_budget: Math.max(0, Number((safeDailyLimit - todaySpending).toFixed(2))),
          monthly_savings: totalSavings,
          total_investments: totalInvested,
          total_net_worth: availableBalance + totalInvested,
          upcoming_payments_count: (memoryStore.dbBills || []).filter(b => b.payment_status !== 'PAID').length,
          upcoming_payments_amount: upcomingBillsTotal,
          safe_daily_limit: safeDailyLimit,
          remaining_days: remainingDays,
          financial_health_score: score,
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
      const monthlyIncome = (memoryStore.dbIncomes || []).reduce((sum, i) => sum + i.amount, 0);
      const monthlyExpenses = (memoryStore.dbExpenses || []).reduce((sum, e) => sum + e.amount, 0);
      const totalInvested = (memoryStore.dbInvestments || []).reduce((sum, i) => sum + (i.currentValue || i.investedAmount), 0);
      const availableBalance = Math.max(0, monthlyIncome - monthlyExpenses);

      res.json({
        success: true,
        data: {
          availableBalance,
          monthlyIncome,
          monthlyExpenses,
          totalInvestments: totalInvested,
          netWorth: availableBalance + totalInvested,
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
      
      // Synchronize with global incomes / expenses
      if (type === 'INCOME' && memoryStore.dbIncomes) {
        if (!memoryStore.dbIncomes.some(i => i.id === newTx.id)) {
          memoryStore.dbIncomes.unshift({
            id: newTx.id,
            amount: newTx.amount,
            date: newTx.transaction_date,
            category: category || 'Salary',
            notes: description,
            isRecurring: false
          });
        }
      } else if (type === 'EXPENSE' && memoryStore.dbExpenses) {
        if (!memoryStore.dbExpenses.some(e => e.id === newTx.id)) {
          memoryStore.dbExpenses.unshift({
            id: newTx.id,
            amount: newTx.amount,
            date: newTx.transaction_date,
            category: category || 'Others',
            notes: description,
            isRecurring: false
          });
        }
      }

      if (io) {
        io.emit('transaction-added', newTx);
        if (type === 'INCOME') io.emit('income-added', newTx);
        if (type === 'EXPENSE') io.emit('expense-added', newTx);
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
    if (memoryStore.dbIncomes) {
      memoryStore.dbIncomes = memoryStore.dbIncomes.filter(i => i.id !== id);
    }
    if (memoryStore.dbExpenses) {
      memoryStore.dbExpenses = memoryStore.dbExpenses.filter(e => e.id !== id);
    }
    if (io) {
      io.emit('income-deleted', { id });
      io.emit('expense-deleted', { id });
    }
    res.json({ success: true, message: 'Transaction deleted' });
  });

  // 5. GET /api/budgets & POST / PATCH / daily-limit
  router.get('/budgets', (req, res) => {
    const monthly_income = (memoryStore.dbIncomes || []).reduce((sum, i) => sum + i.amount, 0);
    const fixed_expenses = (memoryStore.dbExpenses || []).reduce((sum, e) => sum + e.amount, 0);
    const planned_investments = (memoryStore.dbInvestments || []).reduce((sum, i) => sum + (i.investedAmount || 0), 0);
    const upcoming_payments = (memoryStore.dbBills || []).filter(b => b.payment_status !== 'PAID').reduce((sum, b) => sum + b.amount, 0);
    const savings_target = Math.max(0, monthly_income - fixed_expenses);
    res.json({
      success: true,
      data: {
        monthly_income,
        fixed_expenses,
        planned_investments,
        savings_target,
        upcoming_payments,
        currency: 'INR'
      }
    });
  });

  router.get('/budgets/daily-limit', (req, res) => {
    const now = new Date();
    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remainingDays = Math.max(1, totalDays - now.getDate() + 1);

    const todayStr = getTodayStr();
    const todaySpent = (memoryStore.dbTodayTransactions || [])
      .filter(t => t.transaction_date === todayStr && t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Math.round(t.amount * 100), 0) / 100;

    const monthly_income = (memoryStore.dbIncomes || []).reduce((sum, i) => sum + i.amount, 0);
    const fixed_expenses = (memoryStore.dbExpenses || []).reduce((sum, e) => sum + e.amount, 0);
    const upcoming_payments = (memoryStore.dbBills || []).filter(b => b.payment_status !== 'PAID').reduce((sum, b) => sum + b.amount, 0);

    const netSpendable = Math.max(0, monthly_income - fixed_expenses - upcoming_payments);
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
    const monthlyIncome = (memoryStore.dbIncomes || []).reduce((sum, i) => sum + i.amount, 0);
    const monthlyExpenses = (memoryStore.dbExpenses || []).reduce((sum, e) => sum + e.amount, 0);
    const totalEmi = (memoryStore.dbLoans || []).reduce((sum, l) => sum + (l.monthlyEmi || 0), 0);
    const totalSavings = Math.max(0, monthlyIncome - monthlyExpenses);
    const savingsRatio = monthlyIncome > 0 ? Number(((totalSavings / monthlyIncome) * 100).toFixed(1)) : 0;
    const debtRatio = monthlyIncome > 0 ? Number(((totalEmi / monthlyIncome) * 100).toFixed(1)) : 0;
    const score = monthlyIncome > 0 ? Math.min(100, Math.round(40 + (savingsRatio * 0.4) + Math.max(0, 20 - debtRatio * 0.5))) : 50;
    const rating = score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 50 ? 'Average' : 'Needs Attention';

    res.json({
      success: true,
      data: {
        score,
        category: rating,
        disclaimer: 'Personalized money-management score calculated in real time from your active incomes and expenses.',
        factors: [
          { name: 'Savings Rate', score: Math.min(100, Math.round(savingsRatio * 1.5)), details: `${savingsRatio}% of income saved` },
          { name: 'Budget Control', score: monthlyExpenses > 0 ? 80 : 50, details: 'Daily spending tracked against cashflow' },
          { name: 'Debt Management', score: Math.max(0, Math.round(100 - debtRatio * 2)), details: `EMI ratio at ${debtRatio}%` },
          { name: 'Active Streams', score: (memoryStore.dbIncomes || []).length > 0 ? 90 : 40, details: `${(memoryStore.dbIncomes || []).length} active income stream(s)` }
        ]
      }
    });
  });

  // 11. GET /api/ai/daily-actions
  router.get('/ai/daily-actions', (req, res) => {
    const todayStr = getTodayStr();
    const dueTodayBills = (memoryStore.dbBills || []).filter(b => b.due_date === todayStr && b.payment_status !== 'PAID');
    
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

    const pendingGoals = (memoryStore.dbSavingsGoals || []).filter(g => g.target_amount > g.current_saved);
    if (pendingGoals.length > 0) {
      const topGoal = pendingGoals[0];
      const remaining = topGoal.target_amount - topGoal.current_saved;
      actions.push({
        id: `act-goal-${topGoal.id}`,
        title: `Goal Progress: ${topGoal.name}`,
        explanation: `You are ₹${remaining.toLocaleString()} away from reaching your target.`,
        amount: remaining,
        priority: 'MEDIUM',
        recommended_action: 'Transfer surplus savings to goal',
        action_type: 'VIEW_GOAL'
      });
    }

    if (actions.length === 0) {
      actions.push({
        id: 'act-start-1',
        title: 'Real-Time Financial Tracking Active',
        explanation: 'Add your active bills, income, or savings goals to unlock automated AI insights.',
        amount: 0,
        priority: 'LOW',
        recommended_action: 'Add entry',
        action_type: 'GENERAL'
      });
    }

    res.json({ success: true, data: actions });
  });

  // 12. POST /api/ai/ask
  router.post('/ai/ask', async (req, res) => {
    const { question, apiKey } = req.body;
    const q = (question || '').toLowerCase();

    const monthlyIncome = (memoryStore.dbIncomes || []).reduce((sum, i) => sum + i.amount, 0);
    const fixedExpenses = (memoryStore.dbExpenses || []).reduce((sum, e) => sum + e.amount, 0);
    const totalInvestments = (memoryStore.dbInvestments || []).reduce((sum, i) => sum + (i.currentValue || i.investedAmount), 0);
    const availableBalance = Math.max(0, monthlyIncome - fixedExpenses);

    const groqKey = apiKey || (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here' ? process.env.GROQ_API_KEY : '');

    // If Groq API Key is available, use high-speed Groq LPU (Llama 3.3 70B)
    if (groqKey) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
                content: `You are the Grow 0.2 Daily AI Financial Assistant powered by Groq LPU. Current user context:
- Monthly Income: ₹${monthlyIncome.toLocaleString('en-IN')}
- Fixed Expenses: ₹${fixedExpenses.toLocaleString('en-IN')}
- Available Balance: ₹${availableBalance.toLocaleString('en-IN')}
- Total Portfolio Value: ₹${totalInvestments.toLocaleString('en-IN')}
- Active Bills: ${(memoryStore.dbBills || []).length}
Provide concise, practical, and helpful answers in 2-4 sentences with appropriate emoji.`
              },
              { role: 'user', content: question || 'What is my financial status?' }
            ],
            max_tokens: 300
          })
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const groqAnswer = data.choices?.[0]?.message?.content;
          if (groqAnswer) {
            return res.json({ success: true, answer: groqAnswer, provider: 'GROQ' });
          }
        }
      } catch (err) {
        console.warn('⚠️ Groq /api/ai/ask note:', err.message);
      }
    }

    // Deterministic Rule Fallback
    let answer = `Based on your authenticated Grow 0.2 financial records:`;
    if (q.includes('spend') || q.includes('safe')) {
      const now = new Date();
      const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const remainingDays = Math.max(1, totalDays - now.getDate() + 1);
      const safeDailyLimit = Math.max(0, Math.floor((availableBalance * 100) / remainingDays) / 100);
      answer = `💰 **Daily Safe Spending Limit**: You can safely spend **₹${safeDailyLimit.toLocaleString('en-IN')} per day** for the remaining ${remainingDays} days of this month.`;
    } else if (q.includes('bill') || q.includes('due')) {
      const bills = memoryStore.dbBills || [];
      if (bills.length > 0) {
        answer = `⚡ **Upcoming Bills**: You have ${bills.length} active bill(s) totaling ₹${bills.reduce((s, b) => s + b.amount, 0).toLocaleString('en-IN')}.`;
      } else {
        answer = `⚡ **Bill Status**: You have no upcoming bills due today.`;
      }
    } else if (q.includes('owe') || q.includes('lent') || q.includes('people')) {
      const lending = memoryStore.dbLending || [];
      const totalLent = lending.filter(l => l.type === 'LENT' && l.status !== 'SETTLED').reduce((s, l) => s + l.amount, 0);
      const totalBorrowed = lending.filter(l => l.type === 'BORROWED' && l.status !== 'SETTLED').reduce((s, l) => s + l.amount, 0);
      answer = `🤝 **Lend & Borrow Status**: Pending to receive: **₹${totalLent.toLocaleString('en-IN')}**. Pending to pay: **₹${totalBorrowed.toLocaleString('en-IN')}**.`;
    } else if (q.includes('invest') || q.includes('portfolio')) {
      answer = `📈 **Investment Summary**: Your verified portfolio current value is **₹${totalInvestments.toLocaleString('en-IN')}** across ${(memoryStore.dbInvestments || []).length} registered asset(s).`;
    } else {
      answer = `💡 **Daily Financial Overview**: Your current available balance is **₹${availableBalance.toLocaleString('en-IN')}**. Total investments: **₹${totalInvestments.toLocaleString('en-IN')}**. Total monthly cashflow: +₹${monthlyIncome.toLocaleString('en-IN')}.`;
    }

    res.json({ success: true, answer, provider: 'RULE_ENGINE' });
  });

  return router;
}
