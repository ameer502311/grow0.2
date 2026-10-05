# GROW 0.2 — Smart Budget & AI Personal Finance Platform

GROW 0.2 is a comprehensive, psychology-driven personal finance and budget management platform powered by Artificial Intelligence. It features real-time financial tracking, multi-platform asset aggregation, smart bill payments, automated live market data, and predictive future financial modeling.

---

## 🌟 Key Highlights & Architecture

### 1. 🔮 My Financial Future (AI Future Simulator & Risk Predictor)
- **Top Financial Summary**: Immediate glance at Liquid Savings, Investments, Monthly Net Savings, and Emergency Fund Coverage.
- **Can I Handle an Emergency?**: Clear visual coverage progress bar benchmarking against the recommended 6-month safety net.
- **"What If Something Happens?" Scenario Simulator**:
  - 💼 **I Lose My Job**: Calculates exact survival runway in months, monthly essential cash burn rate, and priority expense cutbacks.
  - 📉 **My Salary Goes Down**: Simulates compensation cuts (-10%, -20%, -30%, or custom %) and resulting savings impact.
  - 💸 **My Expenses Go Up**: Models living cost inflation (+10%, +20%, +30%) and cash flow squeeze.
  - 🏥 **Big Unexpected Expense**: Models sudden financial shocks (₹25k, ₹50k, ₹100k) deducted from emergency reserves.
  - 📈 **Salary Increase**: Suggests an automated 50/30/20 surplus allocation (Emergency Vault, Long-Term SIPs, Goals, Discretionary).
  - 🎯 **Adjust Monthly SIP**: Models multi-year wealth growth differences.
- **Before vs After Comparison**: Clear 4-metric delta comparison table showing exactly what changes in each scenario.
- **My Financial Protection**: Distinct separation between liquid cash savings and long-term investment assets.
- **My Future Outlook**: Milestone projections across 1 Year, 3 Years, and 5 Years with conservative compound growth modeling.
- **Is My Financial Life Improving?**: Simple indicator matrix tracking Income, Savings, Expenses, Investments, and Debt.
- **GROW AI Advice**: 3 targeted, human-readable insights: *What's Going Well?*, *What Should You Watch?*, and *What Should You Do?*.

---

### 2. 🎨 Psychology-Based Fintech Design System
- **Trust Blue (`#2563EB`)**: Primary brand identity, navigation, links, and important financial info.
- **Growth Green (`#10B981`)**: Positive savings, income growth, completed milestones, and successful transactions.
- **Attention Amber (`#F59E0B`)**: Upcoming EMIs, bill reminders, and budget warnings.
- **Loss / Risk Red (`#EF4444`)**: Failed transactions, critical risk states, and negative cash flow.
- **Wealth Purple (`#8B5CF6`)**: Goals, milestones, and asset growth.
- **Universal Exit Marks**: Single-click `Exit [X]` and `Back to Dashboard` controls across all non-dashboard pages and modal headers.
- **Multi-Frame Responsive Layout**: Adapts smoothly to Desktop, Laptop, Tablet, and Mobile with dedicated bottom navigation dock and mobile drawer.

---

### 3. 💳 Smart Bill Center & BBPS Payments
- **Multi-Category Bills**: Electricity, Water, Gas, Broadband, DTH, Mobile Prepaid & Postpaid, Credit Card, and Fastag.
- **Official BBPS Receipts**: Downloadable and printable receipts with verified BBPS reference numbers.
- **Payment Gateway Simulation**: Razorpay UPI, Cards, NetBanking, and Digital Wallet checkout with instant webhook handling.

---

### 4. ⚡ Daily Money Command Center
- Real-time transaction logging with instant UPI/GPay simulation.
- Safe daily spending limit calculator.
- Lending & borrowing ledger (I Lent / I Borrowed) with WhatsApp/SMS payment reminders.

---

### 5. 🤖 GROW AI Advisor & Market Intelligence
- Real-time conversational AI financial advisory powered by OpenAI and Google Gemini.
- Live market data for 24K, 22K, and 18K Digital Gold, Silver, Nifty 50, Sensex, S&P 500, and Crypto.
- Google-style market search & intent recognition engine.

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js (v20+ recommended)
- MongoDB (running locally on port 27017 or MongoDB Atlas connection)

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/grow02
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Start the Application
Start the Express backend API server:
```bash
npm run server
```

In a separate terminal, start the Vite frontend development server:
```bash
npm run dev
```

- **Frontend Application**: `http://localhost:3000/`
- **Backend API**: `http://localhost:5000/`

---

## 🧪 Verification & Testing

### 1. Build Verification
```bash
npm run build
```
Compiles TypeScript and bundles production assets via Vite.

### 2. Backend Automated Test Suite
```bash
node server/tests/futureFinance.test.js
node server/tests/dailyMoney.test.js
```
Runs 22+ automated integration assertions validating financial simulation math, job loss runway calculations, and REST endpoints.

---

## 📁 Project Structure

```
grow0.2/
├── server/
│   ├── models/              # Mongoose database models (Finance, Forecasts, Bills, etc.)
│   ├── routes/              # Express API routers (financial, futureFinance, bills, etc.)
│   ├── services/            # Calculation engines & market providers
│   ├── tests/               # Automated unit & integration tests
│   └── index.js             # Express server entry point & Socket.io setup
├── src/
│   ├── components/          # React UI components (FutureFinanceSimulator, Dashboard, etc.)
│   ├── context/             # React AppContext global state store
│   ├── services/            # Frontend API fetch clients
│   ├── types/               # TypeScript interfaces & types
│   ├── App.tsx              # Main application router & exit bar
│   └── main.tsx             # React DOM client entry point
├── package.json
└── README.md
```

---

## 📄 License & Safety Disclaimer
This application is designed for personal financial planning, budgeting, and scenario simulation. Future projections and investment estimations are calculated using conservative models and do not guarantee market returns, employment status, or financial outcomes.
