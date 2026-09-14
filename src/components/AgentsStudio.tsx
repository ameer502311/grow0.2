import React, { useState, useEffect } from 'react';
import { Bot, Cpu, Play, RefreshCw, Send, Server, Terminal, Users, FileCode, CheckCircle2, Zap, TrendingUp, ShieldAlert, Sparkles } from 'lucide-react';
import io from 'socket.io-client';

interface AgentEvent {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  details: string;
}

interface Subagent {
  id: string;
  role: string;
  status: string;
  task: string;
}

interface Artifact {
  id: string;
  name: string;
  path: string;
  size: string;
  createdAt: string;
}

interface AgentSession {
  id: string;
  status: string;
  createdAt: string;
  agentConfig: {
    model: string;
    instructions: string;
    tools: any[];
    multi_agent: {
      enabled: boolean;
      max_concurrent_subagents: number;
    };
  };
  environment: {
    type: string;
    workspace_directory: string;
  };
  events: AgentEvent[];
  subagents: Subagent[];
  artifacts: Artifact[];
}

export const AgentsStudio: React.FC = () => {
  const [model, setModel] = useState('gpt-6-astra');
  const [instructions, setInstructions] = useState(
    'Act as an autonomous financial analyst & Codex harness. Investigate user financial queries, run tools, and report findings.'
  );
  const [taskInput, setTaskInput] = useState(
    'Research portfolio performance, run risk simulations on Nifty index vs SafeGold, and check tax optimization.'
  );
  const [enableMultiAgent, setEnableMultiAgent] = useState(true);
  const [maxSubagents, setMaxSubagents] = useState(4);
  const [mcpUrl, setMcpUrl] = useState('https://developers.openai.com/mcp');

  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [activeSession, setActiveSession] = useState<AgentSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [followupTask, setFollowupTask] = useState('');

  // Fetch initial session list
  const fetchSessions = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/ai/agents/sessions');
      const data = await res.json();
      if (data.success && data.data) {
        setSessions(data.data);
        if (data.data.length > 0 && !activeSession) {
          setActiveSession(data.data[0]);
        }
      }
    } catch (err) {
      console.warn('Backend connection note:', err);
    }
  };

  useEffect(() => {
    fetchSessions();

    // Socket.IO Real-time event listener
    const socket = io('http://localhost:5000');
    socket.on('agent-event-stream', ({ sessionId, event }) => {
      setActiveSession(prev => {
        if (!prev || prev.id !== sessionId) return prev;
        // Avoid duplicate events
        if (prev.events.some(e => e.id === event.id)) return prev;
        return {
          ...prev,
          events: [...prev.events, event]
        };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const applyPreset = (presetType: 'portfolio' | 'tax' | 'bills') => {
    if (presetType === 'portfolio') {
      setModel('gpt-6-astra');
      setInstructions('Act as an autonomous Portfolio Rebalancing Agent. Query market tickers, asset allocation, and generate step-up SIP strategies.');
      setTaskInput('Analyze my asset allocation across Equity, 24K Gold, and Crypto. Recommend rebalancing steps based on current market trends.');
    } else if (presetType === 'tax') {
      setModel('gpt-6-astra');
      setInstructions('Act as a Tax Optimization Agent. Scan yearly incomes, expenses, and compute eligible Section 80C, 80D, and NPS deductions.');
      setTaskInput('Audit my annual tax liabilities. Check Section 80C limit and recommend NPS/ELSS contribution steps for maximum refund.');
    } else if (presetType === 'bills') {
      setModel('gpt-4o-codex');
      setInstructions('Act as an EMI & Bill Investigator Agent. Audit loan schedules, credit card balances, and BBPS utility bills.');
      setTaskInput('Investigate all upcoming loan EMIs and utility bills. Flag high-interest balances and verify liquidity before auto-debit.');
    }
  };

  const handleLaunchSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/ai/agents/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          instructions,
          tools: [{ type: 'programmatic_tool_calling' }, { type: 'web_search' }],
          mcpServers: [{ label: 'openai_docs', transportType: 'http', url: mcpUrl }],
          enableMultiAgent,
          maxSubagents: Number(maxSubagents),
          initialTask: taskInput
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setActiveSession(json.data);
        setSessions(prev => [json.data, ...prev]);
        setTaskInput('');
      }
    } catch (err) {
      console.error('Failed to create agent session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !followupTask.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/ai/agents/session/${activeSession.id}/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskText: followupTask })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setActiveSession(json.data);
        setSessions(prev => prev.map(s => (s.id === json.data.id ? json.data : s)));
        setFollowupTask('');
      }
    } catch (err) {
      console.error('Failed to send turn:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-purple-950 p-8 border border-indigo-500/20 shadow-2xl">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5" /> OpenAI Agents API Managed Harness
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Agents Studio & Financial MCP
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Build and orchestrate durable cloud agents with financial database MCP tools, Socket.IO real-time event streaming, and multi-agent subagent delegation.
            </p>
          </div>

          <button
            onClick={fetchSessions}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow-lg"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Sessions
          </button>
        </div>
      </div>

      {/* 1-Click Financial Agent Presets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => applyPreset('portfolio')}
          className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 hover:border-indigo-400/60 transition-all text-left space-y-2 group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-sm">
              <TrendingUp className="w-4 h-4" />
            </span>
            <Sparkles className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">Portfolio Rebalancer</h3>
            <p className="text-[11px] text-slate-400">Equity, Gold & Crypto SIP Optimization</p>
          </div>
        </button>

        <button
          onClick={() => applyPreset('tax')}
          className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30 hover:border-purple-400/60 transition-all text-left space-y-2 group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-sm">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <Sparkles className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">Tax Audit & NPS Agent</h3>
            <p className="text-[11px] text-slate-400">Section 80C & NPS refund maxing</p>
          </div>
        </button>

        <button
          onClick={() => applyPreset('bills')}
          className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 hover:border-cyan-400/60 transition-all text-left space-y-2 group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-sm">
              <Zap className="w-4 h-4" />
            </span>
            <Sparkles className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">EMI & Bill Investigator</h3>
            <p className="text-[11px] text-slate-400">Loan dues, credit card & BBPS audit</p>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Create Agent & Config Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-400" /> Launch Agent Session
              </h2>
              <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                Codex Harness
              </span>
            </div>

            <form onSubmit={handleLaunchSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Model Selection</label>
                <select
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="gpt-6-astra">gpt-6-astra (OpenAI Managed Harness)</option>
                  <option value="gpt-4o-codex">gpt-4o-codex (Code & Execution Sandbox)</option>
                  <option value="gpt-4o">gpt-4o (Standard Multi-Modal)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Agent System Instructions</label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Initial Task / Prompt</label>
                <textarea
                  rows={3}
                  value={taskInput}
                  onChange={e => setTaskInput(e.target.value)}
                  placeholder="Describe task to execute in cloud sandbox..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Multi-Agent Delegation Controls */}
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" /> Enable Multi-Agent Subagents
                  </span>
                  <input
                    type="checkbox"
                    checked={enableMultiAgent}
                    onChange={e => setEnableMultiAgent(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-500 focus:ring-0 bg-slate-900 border-slate-700"
                  />
                </div>

                {enableMultiAgent && (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">Max Concurrent Subagents:</span>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={maxSubagents}
                      onChange={e => setMaxSubagents(Number(e.target.value))}
                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-center text-slate-200"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-cyan-400" /> MCP Transport Server URL
                </label>
                <input
                  type="text"
                  value={mcpUrl}
                  onChange={e => setMcpUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" /> Provision Cloud Session
              </button>
            </form>
          </div>

          {/* Active Sessions List */}
          <div className="glass-panel p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Sessions ({sessions.length})</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {sessions.map(s => (
                <div
                  key={s.id}
                  onClick={() => setActiveSession(s)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all border flex items-center justify-between ${
                    activeSession?.id === s.id
                      ? 'bg-indigo-950/50 border-indigo-500/50 text-white'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-200">{s.id}</p>
                    <p className="text-[10px] text-slate-500">{new Date(s.createdAt).toLocaleTimeString()} • {s.agentConfig.model}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    {s.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Session Event Console */}
        <div className="lg:col-span-7 space-y-6">
          {activeSession ? (
            <div className="glass-panel p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
              {/* Session Status Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <h3 className="text-sm font-bold text-white">Session {activeSession.id}</h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    Directory: <code className="bg-slate-950 px-2 py-0.5 rounded text-indigo-300">{activeSession.environment.workspace_directory}</code>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700">
                    Model: {activeSession.agentConfig.model}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-indigo-500/10 text-xs font-bold text-indigo-300 border border-indigo-500/30">
                    {activeSession.agentConfig.multi_agent.enabled ? `Subagents Max: ${activeSession.agentConfig.multi_agent.max_concurrent_subagents}` : 'Single Agent'}
                  </span>
                </div>
              </div>

              {/* Subagents Grid if active */}
              {activeSession.subagents && activeSession.subagents.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" /> Concurrent Subagent Workforce
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeSession.subagents.map(sa => (
                      <div key={sa.id} className="p-3 rounded-2xl bg-slate-950 border border-indigo-500/20 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-300">{sa.role}</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <p className="text-[11px] text-slate-400">{sa.task}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Session Timeline / Event Logs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Live Socket.IO Execution Stream ({activeSession.events.length} Events)
                </h4>
                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                  {activeSession.events.map(evt => (
                    <div key={evt.id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                          {evt.title}
                        </span>
                        <span className="text-[10px] text-slate-500">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                        {evt.details}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Artifacts Produced */}
              {activeSession.artifacts && activeSession.artifacts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-purple-400" /> Sandbox Output Artifacts
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeSession.artifacts.map(art => (
                      <div key={art.id} className="px-3 py-2 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-300 text-xs font-mono flex items-center gap-2">
                        <FileCode className="w-4 h-4" />
                        <span>{art.name} ({art.size})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up Steering Input */}
              <form onSubmit={handleSendFollowup} className="pt-2 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={followupTask}
                  onChange={e => setFollowupTask(e.target.value)}
                  placeholder="Steer agent or send next task in session..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={loading || !followupTask.trim()}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> Send Turn
                </button>
              </form>
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto text-2xl font-black">
                🤖
              </div>
              <h3 className="text-lg font-bold text-white">No Agent Session Active</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Select one of the 1-click Financial Agent Presets above or fill out the custom configuration form on the left.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
