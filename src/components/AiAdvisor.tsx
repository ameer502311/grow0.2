import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, Send, Mic, Volume2, ShieldCheck, Key, RefreshCw, 
  TrendingUp, AlertCircle, ArrowUpRight, BarChart2, Bot, Cpu
} from 'lucide-react';
import { askGeminiAdvisor, askChatGptAdvisor } from '../services/api';
import { AiModelProvider } from '../types';

export const AiAdvisor: React.FC = () => {
  const { user, setUser, healthScore, incomes, expenses, investments, currencySymbol } = useApp();

  const [aiModel, setAiModel] = useState<AiModelProvider>(user.preferredAiModel || 'GEMINI');
  const [promptInput, setPromptInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string; model?: string }[]>([
    { 
      role: 'ai', 
      text: "Hello Alex! I am your Grow 0.2 AI Financial Advisor powered by Google Gemini 1.5. How can I optimize your cash flow, tax strategy, or gold & stock portfolio today?",
      model: 'Google Gemini'
    }
  ]);

  // Keys modal
  const [showKeySetting, setShowKeySetting] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState(user.geminiApiKey || '');
  const [openaiKeyInput, setOpenaiKeyInput] = useState(user.openaiApiKey || '');

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    const userMsg = promptInput;
    setPromptInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const statsContext = {
      incomes: incomes.map(i => `${i.category}: ${i.amount}`),
      expenses: expenses.map(e => `${e.category}: ${e.amount}`),
      healthScore: healthScore.score,
      portfolioVal: investments.reduce((a, c) => a + c.currentValue, 0)
    };

    let reply = '';
    if (aiModel === 'GEMINI') {
      reply = await askGeminiAdvisor(userMsg, user.geminiApiKey, statsContext);
    } else {
      reply = await askChatGptAdvisor(userMsg, user.openaiApiKey, statsContext);
    }

    setChatMessages(prev => [...prev, { role: 'ai', text: reply, model: aiModel === 'GEMINI' ? 'Google Gemini 1.5' : 'ChatGPT 4o' }]);
    setLoading(false);
  };

  const handleSaveApiKeys = () => {
    setUser(prev => ({ 
      ...prev, 
      geminiApiKey: geminiKeyInput,
      openaiApiKey: openaiKeyInput,
      preferredAiModel: aiModel
    }));
    setShowKeySetting(false);
  };

  // Next Month Cash Flow AI Predictions
  const totalIncome = incomes.reduce((a, c) => a + c.amount, 0);
  const totalExpense = expenses.reduce((a, c) => a + c.amount, 0);
  const predictedNextIncome = Math.round(totalIncome * 1.05);
  const predictedNextExpense = Math.round(totalExpense * 0.94);
  const predictedNextSavings = predictedNextIncome - predictedNextExpense;

  return (
    <div className="space-y-6">
      {/* Banner & AI Engine Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-panel rounded-3xl p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-purple-400 mb-1 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" /> Powered by Google Gemini 1.5 Flash AI
          </div>
          <h1 className="text-xl font-extrabold text-white">AI Financial Advisor & Health Score</h1>
          <p className="text-xs text-slate-400">Google Gemini AI analyzes your spending habits, tax planning, and investment growth in real-time.</p>
        </div>

        {/* Model Switcher Buttons & Key Drawer Button */}
        <div className="flex items-center space-x-2">
          {/* Engine Selector */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button 
              onClick={() => setAiModel('GEMINI')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${aiModel === 'GEMINI' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md' : 'text-slate-400'}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Google Gemini
            </button>
            <button 
              onClick={() => setAiModel('CHATGPT')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${aiModel === 'CHATGPT' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md' : 'text-slate-400'}`}
            >
              <Cpu className="w-3.5 h-3.5" /> ChatGPT (GPT-4o)
            </button>
          </div>

          <button 
            onClick={() => setShowKeySetting(!showKeySetting)}
            className="p-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all"
            title="Configure Google Gemini & OpenAI API Keys"
          >
            <Key className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* API Key Modal Drawer */}
      {showKeySetting && (
        <div className="glass-panel rounded-3xl p-5 bg-slate-900 border-slate-800 space-y-4 max-w-md">
          <h3 className="font-bold text-xs text-slate-200">Configure AI Model API Keys</h3>
          <p className="text-[11px] text-slate-400">Enter your Google Gemini API key or OpenAI API key. If left blank, Grow 0.2 connects via Express Backend Proxy endpoints.</p>
          
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Google Gemini API Key (AIza...)</label>
              <input 
                type="password" 
                placeholder="AIzaSy..."
                value={geminiKeyInput}
                onChange={(e) => setGeminiKeyInput(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">OpenAI ChatGPT API Key (sk-...)</label>
              <input 
                type="password" 
                placeholder="sk-proj-..."
                value={openaiKeyInput}
                onChange={(e) => setOpenaiKeyInput(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-1">
            <button onClick={() => setShowKeySetting(false)} className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-400">Cancel</button>
            <button onClick={handleSaveApiKeys} className="px-4 py-1.5 rounded-xl bg-purple-600 text-xs text-white font-bold">Save Keys</button>
          </div>
        </div>
      )}

      {/* Financial Health Score Breakdown (0-100) */}
      <div className="glass-panel rounded-3xl p-6 bg-slate-900/60 border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-4">
            <div className="relative w-20 h-20 rounded-full bg-slate-950 border-4 border-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-2xl font-black text-white">{healthScore.score}</span>
              <span className="text-[8px] text-slate-400 absolute bottom-2">/ 100</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase">Health Score Rating</span>
              <h2 className="text-xl font-extrabold text-emerald-400">{healthScore.rating}</h2>
              <p className="text-[11px] text-slate-400">Calculated across 6 key wealth discipline metrics</p>
            </div>
          </div>
        </div>

        {/* 6 Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Savings Ratio</span>
            <span className="font-extrabold text-emerald-400 text-sm mt-0.5 block">{healthScore.savingsRatio}%</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Debt Ratio</span>
            <span className="font-extrabold text-cyan-400 text-sm mt-0.5 block">{healthScore.debtRatio}%</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Investment Ratio</span>
            <span className="font-extrabold text-purple-400 text-sm mt-0.5 block">{healthScore.investmentRatio}%</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Emergency Fund</span>
            <span className="font-extrabold text-amber-400 text-sm mt-0.5 block">{healthScore.emergencyFundMonths} Months</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Budget Discipline</span>
            <span className="font-extrabold text-emerald-400 text-sm mt-0.5 block">{healthScore.budgetDiscipline}%</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Bill History</span>
            <span className="font-extrabold text-emerald-400 text-sm mt-0.5 block">{healthScore.billPaymentHistory}%</span>
          </div>
        </div>
      </div>

      {/* AI Budget & Cash Flow Predictor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 bg-slate-900/60 border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-400" /> Gemini AI Cash Flow & Budget Forecast (Next Month)
          </h2>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Predicted Income</span>
              <p className="text-lg font-black text-emerald-400 mt-1">{currencySymbol}{predictedNextIncome.toLocaleString()}</p>
              <span className="text-[9px] text-emerald-400/80">+5% expected freelance</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Predicted Expenses</span>
              <p className="text-lg font-black text-rose-400 mt-1">{currencySymbol}{predictedNextExpense.toLocaleString()}</p>
              <span className="text-[9px] text-emerald-400/80">-6% optimized food spend</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Predicted Savings</span>
              <p className="text-lg font-black text-amber-400 mt-1">{currencySymbol}{predictedNextSavings.toLocaleString()}</p>
              <span className="text-[9px] text-amber-400/80">+12% savings growth</span>
            </div>
          </div>
        </div>

        {/* AI Chat Assistant Box (Google Gemini) */}
        <div className="glass-panel rounded-3xl p-5 bg-slate-900/80 border-slate-800 flex flex-col justify-between h-[420px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> 
              {aiModel === 'GEMINI' ? 'Google Gemini 1.5 AI Assistant' : 'ChatGPT 4o Assistant'}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 my-3 pr-1 text-xs">
            {chatMessages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-2xl leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-purple-600/30 text-purple-100 border border-purple-500/30 ml-8' 
                    : 'bg-slate-950 text-slate-200 border border-slate-800 mr-4'
                }`}
              >
                {msg.model && (
                  <span className="text-[9px] font-bold text-amber-400 uppercase block mb-1">
                    [{msg.model}]
                  </span>
                )}
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="p-3 rounded-2xl bg-slate-950 text-slate-400 text-xs animate-pulse">
                {aiModel === 'GEMINI' ? 'Google Gemini AI is analyzing your cash flows...' : 'ChatGPT is analyzing your cash flows...'}
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="relative">
            <input 
              type="text"
              placeholder={`Ask ${aiModel === 'GEMINI' ? 'Google Gemini' : 'ChatGPT'} about spending, stocks, or tax...`}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
            <button 
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 p-1 text-amber-400 hover:text-amber-300 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
