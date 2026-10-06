import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, Send, Mic, Key, RefreshCw, 
  Bot, Copy, RotateCcw, Plus, StopCircle, Check,
  TrendingUp, AlertTriangle, AlertCircle, Info, Target, CheckCircle2, X
} from 'lucide-react';
import { streamOpenAiChat, fetchMarketPrices } from '../services/api';

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

interface AiAdvisorProps {
  onExit?: () => void;
}

export const AiAdvisor: React.FC<AiAdvisorProps> = ({ onExit }) => {
  const { user, setUser } = useApp();

  const [conversationId, setConversationId] = useState<string>(`conv-${Date.now()}`);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: "Hello! I am **GROW AI Assistant**, your trustworthy personal finance guide.\n\nI can analyze your monthly savings, check your spending habits, assess emergency fund progress, or provide live gold & commodity market updates. How can I assist you today?",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
  const [groqKeyInput, setGroqKeyInput] = useState(user.groqApiKey || '');
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
        content: "New chat session started! I am **GROW AI Assistant**. How can I assist your financial planning today?",
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
      apiKey: user.groqApiKey || user.openaiApiKey,
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
      onDone: (_newId, fullText) => {
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
              content: m.content || `Notice: Unable to reach GROW AI Assistant service. (${err.message}). Using local analytical guidance.`, 
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
    let lastUserText = '';
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserText = messages[i].content;
        break;
      }
    }

    if (lastUserText) {
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
      groqApiKey: groqKeyInput,
      openaiApiKey: openaiKeyInput,
      preferredAiModel: groqKeyInput ? 'GROQ' : prev.preferredAiModel
    }));
    setShowKeySetting(false);
  };

  // Semantic Insight Type Suggestions
  const insightSuggestions = [
    {
      type: 'Growth',
      label: 'Savings Progress',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      icon: <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />,
      prompt: 'How is my monthly savings rate tracking toward optimal financial health?'
    },
    {
      type: 'Attention',
      label: 'Spending Review',
      color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      icon: <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />,
      prompt: 'Are there any unusual spikes or high-spending categories this month?'
    },
    {
      type: 'Goal',
      label: 'Emergency Fund',
      color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
      icon: <Target className="w-3 h-3 text-purple-600 dark:text-purple-400" />,
      prompt: 'What is my current milestone progress for the Emergency Fund?'
    },
    {
      type: 'Info',
      label: 'Commodity Status',
      color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
      icon: <Info className="w-3 h-3 text-blue-600 dark:text-blue-400" />,
      prompt: 'Summarize today\'s 24K and 22K gold prices and bullion market movements.'
    },
    {
      type: 'Debt',
      label: 'EMI Schedule',
      color: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      icon: <CheckCircle2 className="w-3 h-3 text-slate-500 dark:text-slate-400" />,
      prompt: 'Review my upcoming loan payments and recommend a debt payoff plan.'
    }
  ];

  return (
    <div className="space-y-5">
      {/* Real-time Commodity Prices Ticker Bar */}
      <div className="card-surface p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Live Commodity Indicators</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[10px] font-semibold">
                {marketPrices?.source || 'Verified Feed'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Updated: {marketPrices ? new Date(marketPrices.updated_at).toLocaleTimeString() : 'Live Feed'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-x-1.5">
            <span className="text-slate-500 dark:text-slate-400">24K Gold:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {marketPrices?.gold?.["24k"] ? `₹${marketPrices.gold["24k"].toLocaleString()}/10g` : '₹74,500/10g'}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-x-1.5">
            <span className="text-slate-500 dark:text-slate-400">22K Gold:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {marketPrices?.gold?.["22k"] ? `₹${marketPrices.gold["22k"].toLocaleString()}/10g` : '₹68,300/10g'}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-x-1.5">
            <span className="text-slate-500 dark:text-slate-400">Silver:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {marketPrices?.silver?.per_kg ? `₹${marketPrices.silver.per_kg.toLocaleString()}/kg` : '₹89,200/kg'}
            </span>
          </div>

          <button
            onClick={loadMarketPrices}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
            title="Refresh Market Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingMarket ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Semantic Guidance Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
          Financial Topics:
        </span>
        {insightSuggestions.map((item, idx) => (
          <button
            key={idx}
            onClick={() => submitUserMessage(item.prompt)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${item.color}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main Chat Container */}
      <div className="card-surface rounded-2xl flex flex-col h-[70vh] min-h-[500px] max-h-[760px] overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  GROW AI Assistant
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                  ⚡ Groq LPU (Llama 3.3 70B)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                💡 Sub-second Financial Intelligence • Real-time Guidance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartNewChat}
              className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> New Session
            </button>

            <button
              onClick={() => setShowKeySetting(!showKeySetting)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Configure API Keys"
            >
              <Key className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleClearChat}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Clear Conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {onExit && (
              <button
                onClick={onExit}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                title="Exit to Dashboard"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* API Key Modal Drawer */}
        {showKeySetting && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                Configure AI API Keys (Groq Cloud LPU Primary)
              </span>
              <a 
                href="https://console.groq.com/keys" 
                target="_blank" 
                rel="noreferrer"
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                Get Free Groq Key (console.groq.com) →
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span>⚡ Groq API Key</span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">Fastest</span>
                </span>
                <input
                  type="password"
                  placeholder="gsk_..."
                  value={groqKeyInput}
                  onChange={e => setGroqKeyInput(e.target.value)}
                  className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">OpenAI / Gemini Key (Fallback)</span>
                <input
                  type="password"
                  placeholder="sk-proj-... / AIza..."
                  value={openaiKeyInput}
                  onChange={e => setOpenaiKeyInput(e.target.value)}
                  className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleSaveApiKeys}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm cursor-pointer"
              >
                Save Keys & Activate Groq
              </button>
            </div>
          </div>
        )}

        {/* Messages Stream View */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-slate-50/30 dark:bg-slate-900/30">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-2xl space-y-1.5 group ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Tool Call Indicator Badge */}
                  {msg.toolCalled && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[10px] font-semibold">
                      <Sparkles className="w-3 h-3 text-blue-600" /> Analytical Tool: {msg.toolCalled}
                    </div>
                  )}

                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl leading-relaxed text-xs space-y-2 ${
                      isUser
                        ? 'bg-blue-600 text-white shadow-sm rounded-tr-none'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-sm rounded-tl-none font-sans'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans leading-relaxed">
                      {msg.content || (msg.isStreaming ? 'GROW AI Assistant is reviewing your financial data...' : '')}
                    </div>
                  </div>

                  {/* Message Action Toolbar */}
                  {!isUser && !msg.isStreaming && msg.content && (
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 px-1">
                      <span>{msg.timestamp}</span>
                      <span>•</span>
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {copiedId === msg.id ? 'Copied' : 'Copy'}
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => handleRegenerate(idx)}
                        className="hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" /> Regenerate
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-bold shrink-0">
                    You
                  </div>
                )}
              </div>
            );
          })}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Controls Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2">
          {isGenerating && (
            <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                GROW AI Assistant is preparing guidance...
              </span>
              <button
                onClick={handleStopGeneration}
                className="flex items-center gap-1 font-semibold text-red-600 hover:text-red-700 dark:text-red-400"
              >
                <StopCircle className="w-4 h-4" /> Stop
              </button>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); submitUserMessage(inputPrompt); }} className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`p-2.5 rounded-xl border transition-colors ${
                isListening
                  ? 'bg-red-50 text-red-600 border-red-300 dark:bg-red-950/50 dark:text-red-300 animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
              title="Voice Input"
            >
              <Mic className="w-4 h-4" />
            </button>

            <textarea
              rows={1}
              value={inputPrompt}
              onChange={e => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask GROW AI Assistant about savings, spending, emergency fund, or bullion prices..."
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 resize-none max-h-28"
            />

            <button
              type="submit"
              disabled={isGenerating || !inputPrompt.trim()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
