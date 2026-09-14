import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, Send, Mic, Volume2, Key, RefreshCw, 
  TrendingUp, BarChart2, Bot, Cpu, CheckCircle2, 
  AlertTriangle, Lightbulb, Copy, RotateCcw, Edit2, Trash2, Plus, StopCircle, Check
} from 'lucide-react';
import { streamOpenAiChat, fetchMarketPrices } from '../services/api';
import { runFinancialAnalysis } from '../services/financialApi';
import { FinancialRecommendationItem } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  toolCalled?: string;
}

interface MarketPrices {
  gold: {
    "24k": number;
    "22k": number;
    "18k": number;
  };
  silver: {
    per_gram: number;
    per_kg: number;
  };
  currency: string;
  source: string;
  updated_at: string;
}

export const AiAdvisor: React.FC = () => {
  const { user, setUser, healthScore, incomes, expenses, investments, currencySymbol } = useApp();

  const [conversationId, setConversationId] = useState<string>(`conv-${Date.now()}`);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: "Hello! I am **Grow 0.2 AI Advisor**, your personal finance assistant.\n\nAsk me anything about your monthly spending, savings strategy, investment compounding, or **live gold & silver market prices**!",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Market Ticker State
  const [marketPrices, setMarketPrices] = useState<MarketPrices | null>(null);
  const [loadingMarket, setLoadingMarket] = useState(false);

  // Voice Input State
  const [isListening, setIsListening] = useState(false);

  // AbortController for Stopping Stream
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll ref
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Fetch initial market prices
  const loadMarketPrices = async () => {
    setLoadingMarket(true);
    const data = await fetchMarketPrices();
    if (data) setMarketPrices(data);
    setLoadingMarket(false);
  };

  useEffect(() => {
    loadMarketPrices();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Keys modal state
  const [showKeySetting, setShowKeySetting] = useState(false);
  const [openaiKeyInput, setOpenaiKeyInput] = useState(user.openaiApiKey || '');

  const handleStartNewChat = () => {
    if (isGenerating && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const newConvId = `conv-${Date.now()}`;
    setConversationId(newConvId);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: "New chat session started! I am **Grow 0.2 AI Advisor**. How can I assist your financial planning today?",
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  const handleClearChat = () => {
    if (isGenerating && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  const submitUserMessage = async (userText: string) => {
    if (!userText.trim() || isGenerating) return;

    const userMsgId = `usr-${Date.now()}`;
    const assistantMsgId = `ast-${Date.now()}`;

    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString()
    };

    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      isStreaming: true
    };

    setMessages(prev => [...prev, userMsg, initialAssistantMsg]);
    setInputPrompt('');
    setIsGenerating(true);

    const historyForApi = messages
      .filter(m => !m.isStreaming)
      .map(m => ({ role: m.role, content: m.content }));

    abortControllerRef.current = new AbortController();

    await streamOpenAiChat({
      message: userText,
      conversationId,
      messages: historyForApi,
      apiKey: user.openaiApiKey,
      signal: abortControllerRef.current.signal,
      onChunk: (delta) => {
        setMessages(prev => prev.map(m => {
          if (m.id === assistantMsgId) {
            return { ...m, content: m.content + delta };
          }
          return m;
        }));
      },
      onToolCall: (toolName) => {
        setMessages(prev => prev.map(m => {
          if (m.id === assistantMsgId) {
            return { ...m, toolCalled: toolName };
          }
          return m;
        }));
      },
      onDone: (newId, fullText) => {
        setIsGenerating(false);
        setMessages(prev => prev.map(m => {
          if (m.id === assistantMsgId) {
            return { ...m, content: fullText || m.content, isStreaming: false };
          }
          return m;
        }));
      },
      onError: (err) => {
        setIsGenerating(false);
        setMessages(prev => prev.map(m => {
          if (m.id === assistantMsgId) {
            return { 
              ...m, 
              content: m.content || `⚠️ Error connecting to Grow 0.2 AI Advisor: ${err.message}`, 
              isStreaming: false 
            };
          }
          return m;
        }));
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitUserMessage(inputPrompt);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerate = (index: number) => {
    // Find last user message
    let lastUserText = '';
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserText = messages[i].content;
        break;
      }
    }

    if (lastUserText) {
      // Remove assistant message at index
      setMessages(prev => prev.filter((_, idx) => idx !== index));
      submitUserMessage(lastUserText);
    }
  };

  // Speech-to-text voice recorder
  const handleToggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleSaveApiKeys = () => {
    setUser(prev => ({ 
      ...prev, 
      openaiApiKey: openaiKeyInput
    }));
    setShowKeySetting(false);
  };

  return (
    <div className="space-y-6">
      {/* Real-time Market Prices Ticker Bar */}
      <div className="glass-panel p-4 rounded-3xl bg-slate-900/90 border border-amber-500/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-white">Live Commodity Prices</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                {marketPrices?.source || 'Verified Market Feed'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Updated: {marketPrices ? new Date(marketPrices.updated_at).toLocaleTimeString() : 'Live'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 space-x-1">
            <span className="text-slate-400">24K Gold:</span>
            <span className="font-bold text-amber-400">{marketPrices?.gold?.["24k"] ? `₹${marketPrices.gold["24k"].toLocaleString()}/10g` : 'Price unavailable'}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 space-x-1">
            <span className="text-slate-400">22K Gold:</span>
            <span className="font-bold text-amber-300">{marketPrices?.gold?.["22k"] ? `₹${marketPrices.gold["22k"].toLocaleString()}/10g` : 'Price unavailable'}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 space-x-1">
            <span className="text-slate-400">Silver:</span>
            <span className="font-bold text-cyan-300">{marketPrices?.silver?.per_kg ? `₹${marketPrices.silver.per_kg.toLocaleString()}/kg` : 'Price unavailable'}</span>
          </div>

          <button
            onClick={loadMarketPrices}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            title="Refresh Live Market Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingMarket ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="glass-panel rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col h-[640px] overflow-hidden">
        {/* Chat Header Controls */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                Grow 0.2 AI Advisor
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </h2>
              <p className="text-[11px] text-slate-400">Real-Time Streaming • Tool Calling • Financial Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartNewChat}
              className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> New Chat
            </button>

            <button
              onClick={handleClearChat}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs transition-all"
              title="Clear Conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setShowKeySetting(!showKeySetting)}
              className="p-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs transition-all"
              title="Configure API Keys"
            >
              <Key className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* API Key Modal Drawer */}
        {showKeySetting && (
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs space-x-3">
            <div className="flex-1 space-y-1">
              <span className="font-bold text-slate-200">OpenAI API Key Config</span>
              <input
                type="password"
                placeholder="sk-proj-..."
                value={openaiKeyInput}
                onChange={e => setOpenaiKeyInput(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={handleSaveApiKeys}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold self-end"
            >
              Save Key
            </button>
          </div>
        )}

        {/* Messages Stream View */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-md">
                    🤖
                  </div>
                )}

                <div className={`max-w-2xl space-y-2 group ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Tool Call Indicator Badge */}
                  {msg.toolCalled && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold">
                      <Sparkles className="w-3 h-3 text-amber-300" /> Called Tool: {msg.toolCalled}
                    </div>
                  )}

                  <div
                    className={`p-4 rounded-3xl leading-relaxed text-xs space-y-2 ${
                      isUser
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20 rounded-tr-none'
                        : 'bg-slate-950 border border-slate-800/90 text-slate-200 shadow-md rounded-tl-none font-sans'
                    }`}
                  >
                    {/* Render Content with Line Breaks */}
                    <div className="whitespace-pre-wrap font-sans leading-relaxed">
                      {msg.content || (msg.isStreaming ? 'Typing...' : '')}
                    </div>
                  </div>

                  {/* Message Action Toolbar */}
                  {!isUser && !msg.isStreaming && msg.content && (
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 opacity-80 group-hover:opacity-100 transition-opacity px-1">
                      <span>{msg.timestamp}</span>
                      <span>•</span>
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="hover:text-slate-300 flex items-center gap-1 transition-colors"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedId === msg.id ? 'Copied' : 'Copy'}
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => handleRegenerate(idx)}
                        className="hover:text-slate-300 flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" /> Regenerate
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold shrink-0">
                    AV
                  </div>
                )}
              </div>
            );
          })}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Controls Bar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 space-y-2">
          {isGenerating && (
            <div className="flex items-center justify-between text-xs text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
                Grow 0.2 AI Advisor is generating response...
              </span>
              <button
                onClick={handleStopGeneration}
                className="flex items-center gap-1 font-bold text-rose-400 hover:text-rose-300"
              >
                <StopCircle className="w-4 h-4" /> Stop
              </button>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); submitUserMessage(inputPrompt); }} className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`p-3 rounded-2xl border transition-all ${
                isListening
                  ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
              title="Speech-to-Text Microphone"
            >
              <Mic className="w-4 h-4" />
            </button>

            <textarea
              rows={1}
              value={inputPrompt}
              onChange={e => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Grow 0.2 AI Advisor about gold prices, savings, budget, or investments..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none max-h-28"
            />

            <button
              type="submit"
              disabled={isGenerating || !inputPrompt.trim()}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
