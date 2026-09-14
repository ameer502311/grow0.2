# Grow 0.2 Fintech App - Real-Time GPT AI Advisor

Grow 0.2 is a personal finance application equipped with a real-time, streaming, tool-calling AI assistant named **Grow 0.2 AI Advisor** powered by the official OpenAI API.

## Features

- 🤖 **Real OpenAI Chat Completions**: Real-time token streaming via Server-Sent Events (SSE).
- 🪙 **Live Market Data Tools**: Function calling for `get_gold_price` (24K, 22K, 18K), `get_silver_price`, `get_budget_summary`, and `calculate_investment_growth`.
- 💬 **ChatGPT-Style Chat UI**: Markdown formatting, Copy message, Regenerate response, Edit & resend, New chat, Stop generation, and Speech-to-Text Microphone input.
- 🔐 **Secure Backend**: API keys are securely managed on the Express backend and never exposed to client-side JavaScript.

---

## Setup & Running Locally

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o
OPENAI_MAX_OUTPUT_TOKENS=1200
MONGODB_URI=mongodb://127.0.0.1:27017/grow02
```

### 3. Start Backend Server

```bash
npm run server
```

The Express API server will start on `http://localhost:5000`.

### 4. Start Frontend Application

In a separate terminal window:

```bash
npm run dev
```

The Vite dev server will start on `http://localhost:3000`.

---

## Verification & Testing

1. Open `http://localhost:3000` in your browser.
2. Click **AI Advisor & Health** in the sidebar navigation menu.
3. Test asking `"hi"` -> Verifies real-time streaming response from OpenAI API.
4. Test asking `"What is today's gold price?"` -> Verifies OpenAI function calling (`get_gold_price`) returning 24K, 22K, 18K gold rates with source & timestamp.
5. Test asking `"How can I save money every month?"` -> Verifies real financial planning guidance.

---

## Deployment & Security Guidelines

- Never check `.env` into version control. `.env` is listed in `.gitignore`.
- All requests to `/api/chat` validate user input and sanitize errors.
- CORS is restricted to trusted origins in production builds.
