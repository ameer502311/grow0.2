import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Globe, CheckCircle2, ShieldCheck, RefreshCw, Plus, ArrowUpRight, 
  Coins, Sparkles, Layers, Zap, ShoppingBag, PieChart, ShieldAlert, Trash2, Key, ExternalLink, Settings, X,
  Eye, EyeOff, FileText, CheckCircle, AlertCircle
} from 'lucide-react';
import { PaymentGatewayModal } from './PaymentGatewayModal';
import { PaymentTransaction } from '../types';
import { 
  fetchPlatformIntegrations, 
  configurePlatformApi,
  connectPlatformApi, 
  disconnectPlatformApi, 
  syncSinglePlatformApi, 
  fetchPortfolioSummaryApi,
  testPlatformApi,
  deletePlatformCredentialsApi
} from '../services/api';
import { fetchAiRebalanceInsights } from '../services/portfolioApi';

export interface PlatformIntegrationsProps {
  onOpenPayment?: (amount?: number, purpose?: PaymentTransaction['purpose']) => void;
  onExit?: () => void;
}

export interface RealPlatform {
  id: string;
  name: string;
  category: string;
  logo: string;
  isConnected: boolean;
  status: string;
  statusLabel: string;
  message: string;
  investedAmount: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  holdingsCount: number;
  lastSyncedAt: string | null;
}

export const PlatformIntegrations: React.FC<PlatformIntegrationsProps> = ({ onOpenPayment, onExit }) => {
  const { buyDigitalGold, tickers, currencySymbol, transactions } = useApp();

  const [realPlatforms, setRealPlatforms] = useState<RealPlatform[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<any>(null);
  const [syncingPlatformId, setSyncingPlatformId] = useState<string | null>(null);
  const [rebalanceData, setRebalanceData] = useState<any>(null);

  // Configure API Modal Dynamic State
  const [configModalPlatform, setConfigModalPlatform] = useState<RealPlatform | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiSecretInput, setApiSecretInput] = useState('');
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [partnerIdInput, setPartnerIdInput] = useState('');
  const [merchantIdInput, setMerchantIdInput] = useState('');
  const [redirectUriInput, setRedirectUriInput] = useState('');
  const [baseUrlInput, setBaseUrlInput] = useState('');
  const [accessTokenInput, setAccessTokenInput] = useState('');
  const [webhookSecretInput, setWebhookSecretInput] = useState('');

  // Password / Secret Visibility State (per field key)
  const [showSecretMap, setShowSecretMap] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  // Sync Logs Drawer State
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);

  // Digital Gold Form State
  const [goldAmount, setGoldAmount] = useState('1000');
  const [selectedGoldPlatform, setSelectedGoldPlatform] = useState('SafeGold / Augmont');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [deliveryRequested, setDeliveryRequested] = useState(false);

  const loadIntegrationsData = async () => {
    const platformsData = await fetchPlatformIntegrations();
    if (platformsData) setRealPlatforms(platformsData);

    const summary = await fetchPortfolioSummaryApi();
    if (summary) setPortfolioSummary(summary);
  };

  useEffect(() => {
    loadIntegrationsData();
    fetchAiRebalanceInsights().then(res => {
      if (res) setRebalanceData(res);
    });
  }, []);

  const toggleShowSecret = (fieldKey: string) => {
    setShowSecretMap(prev => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const openConfigModal = (platform: RealPlatform) => {
    setConfigModalPlatform(platform);
    setApiKeyInput('');
    setApiSecretInput('');
    setClientIdInput('');
    setClientSecretInput('');
    setPartnerIdInput('');
    setMerchantIdInput('');
    setRedirectUriInput(platform.id === 'zerodha' ? 'http://localhost:5000/api/integrations/zerodha/callback' : '');
    setBaseUrlInput('');
    setAccessTokenInput('');
    setWebhookSecretInput('');
    setShowSecretMap({});
    setTestResult(null);
  };

  const handleSaveConfig = async () => {
    if (!configModalPlatform) return;
    setSaveLoading(true);

    try {
      await configurePlatformApi(configModalPlatform.id, {
        apiKey: apiKeyInput,
        apiSecret: apiSecretInput,
        clientId: clientIdInput,
        clientSecret: clientSecretInput || apiSecretInput,
        partnerId: partnerIdInput,
        merchantId: merchantIdInput,
        redirectUri: redirectUriInput,
        baseUrl: baseUrlInput,
        accessToken: accessTokenInput,
        webhookSecret: webhookSecretInput
      });

      await loadIntegrationsData();
      setConfigModalPlatform(null);
    } catch (err: any) {
      alert(`Save Error: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!configModalPlatform) return;
    setTestLoading(true);
    setTestResult(null);

    try {
      const res = await testPlatformApi(configModalPlatform.id);
      if (res.success) {
        setTestResult({ success: true, message: res.message || 'Connection test successful.' });
      } else {
        setTestResult({ success: false, message: res.message || 'Connection test failed.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Test connection error.' });
    } finally {
      setTestLoading(false);
    }
  };

  const handleDeleteCredentials = async () => {
    if (!configModalPlatform) return;
    if (!window.confirm(`Are you sure you want to purge saved credentials for ${configModalPlatform.name}?`)) return;

    try {
      await deletePlatformCredentialsApi(configModalPlatform.id);
      await loadIntegrationsData();
      setConfigModalPlatform(null);
    } catch (err: any) {
      alert(`Remove error: ${err.message}`);
    }
  };

  const openSyncLogs = async () => {
    try {
      const res = await fetch('/api/sync/status');
      if (res.ok) {
        const json = await res.json();
        setAuditLogsList(json.data || []);
      }
    } catch (e) {}
    setShowLogsModal(true);
  };

  const handleConnect = async (platformId: string) => {
    setSyncingPlatformId(platformId);
    try {
      if (platformId === 'zerodha') {
        window.location.href = 'http://localhost:5000/api/integrations/zerodha/connect';
        return;
      }
      if (platformId === 'groww') {
        window.location.href = 'http://localhost:5000/api/integrations/groww/connect';
        return;
      }
      await connectPlatformApi(platformId);
      await loadIntegrationsData();
    } catch (err: any) {
      alert(`Platform Connect Note: ${err.message || 'Partner API credentials required.'}`);
    } finally {
      setSyncingPlatformId(null);
    }
  };

  const handleSync = async (platformId: string) => {
    setSyncingPlatformId(platformId);
    try {
      await syncSinglePlatformApi(platformId);
      await loadIntegrationsData();
    } catch (err: any) {
      alert(`Sync Note: ${err.message || 'Platform sync failed.'}`);
    } finally {
      setSyncingPlatformId(null);
    }
  };

  const handleDisconnect = async (platformId: string) => {
    setSyncingPlatformId(platformId);
    try {
      await disconnectPlatformApi(platformId);
      await loadIntegrationsData();
    } catch (err: any) {
      console.warn('Disconnect error:', err);
    } finally {
      setSyncingPlatformId(null);
    }
  };

  const gold24k = tickers.find(t => t.symbol === 'GOLD24K');
  const goldPricePerGram = gold24k ? gold24k.price / 10 : 7477;
  const currentGrams = (parseFloat(goldAmount || '0') / goldPricePerGram);

  const handleBuyGoldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onOpenPayment) {
      onOpenPayment(parseFloat(goldAmount || '1000'), 'Digital Gold Buy');
    } else {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = () => {
    const buyAmt = parseFloat(goldAmount);
    buyDigitalGold(buyAmt, selectedGoldPlatform, currentGrams);
  };

  const handleRequestPhysicalDelivery = () => {
    setDeliveryRequested(true);
    setTimeout(() => setDeliveryRequested(false), 4000);
  };

  const getDocLink = (platformId: string) => {
    if (platformId === 'groww') return 'https://groww.in/trade-api/docs';
    if (platformId === 'zerodha') return 'https://kite.zerodha.com/connect/login';
    if (platformId === 'safegold') return 'https://www.safegold.com';
    if (platformId === 'augmont') return 'https://www.augmont.com';
    return 'https://api.auragold.com';
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel rounded-3xl p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 mb-1 uppercase tracking-wider">
            <Globe className="w-4 h-4" /> Multi-Platform Investment Aggregation System
          </div>
          <h1 className="text-xl font-extrabold text-white">Platform Integrations & Gold Vaults</h1>
          <p className="text-xs text-slate-400">Official API adapters for Groww, Zerodha Kite Connect, SafeGold, Augmont & Aura Gold.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openSyncLogs}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all shadow-md"
          >
            <FileText className="w-4 h-4 text-amber-400" /> View Sync Logs
          </button>
          <button
            onClick={loadIntegrationsData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${syncingPlatformId ? 'animate-spin' : ''}`} /> Refresh All
          </button>
          {onExit && (
            <button
              onClick={onExit}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-xs font-bold transition-all"
              title="Exit to Dashboard"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Verified Aggregated Portfolio Summary Banner */}
      {portfolioSummary && (
        <div className="glass-panel p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Aggregated Connected Portfolio Summary
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Last Synced: {new Date(portfolioSummary.as_of).toLocaleTimeString()}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 text-[10px] block uppercase">Total Invested</span>
              <span className="text-lg font-black text-white">{currencySymbol}{portfolioSummary.totalInvested.toLocaleString()}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 text-[10px] block uppercase">Current Valuation</span>
              <span className="text-lg font-black text-emerald-400">{currencySymbol}{portfolioSummary.totalCurrentValue.toLocaleString()}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 text-[10px] block uppercase">Net Profit / Loss</span>
              <span className={`text-lg font-black ${portfolioSummary.totalProfitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {portfolioSummary.totalProfitLoss >= 0 ? '+' : ''}{currencySymbol}{portfolioSummary.totalProfitLoss.toLocaleString()} ({portfolioSummary.totalProfitLossPercent}%)
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 text-[10px] block uppercase">Active Connected Platforms</span>
              <span className="text-lg font-black text-indigo-300">{portfolioSummary.connectedPlatformsCount} Connected</span>
            </div>
          </div>
        </div>
      )}

      {/* Official 5 Platform Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {realPlatforms.map((p) => {
          const isConnected = p.isConnected;
          const isPartnerReq = p.status === 'PARTNER_API_REQUIRED' || p.status === 'PENDING_PARTNER_ACCESS';

          return (
            <div key={p.id} className="glass-panel p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 flex flex-col justify-between shadow-xl">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold font-mono">{p.logo || '🪙'}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${
                    isConnected
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : isPartnerReq
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {isConnected ? 'CONNECTED' : p.statusLabel ? p.statusLabel.toUpperCase() : 'PARTNER API REQUIRED'}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-white">{p.name}</h3>
                  <span className="text-[10px] text-slate-400 font-semibold block">{p.category}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Invested Amount:</span>
                    <span className="font-bold text-white">{currencySymbol}{(p.investedAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Current Value:</span>
                    <span className="font-bold text-emerald-400">{currencySymbol}{(p.currentValue || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Holdings Count:</span>
                    <span className="font-bold text-indigo-300">{p.holdingsCount || 0} Assets</span>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                    {isConnected && p.lastSyncedAt ? `Synced: ${new Date(p.lastSyncedAt).toLocaleTimeString()}` : 'No verified holdings available'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => openConfigModal(p)}
                  className="w-full py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5 text-amber-400" /> Configure Partner API
                </button>

                {isConnected ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSync(p.id)}
                      disabled={syncingPlatformId === p.id}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncingPlatformId === p.id ? 'animate-spin' : ''}`} /> Sync
                    </button>
                    <button
                      onClick={() => handleDisconnect(p.id)}
                      disabled={syncingPlatformId === p.id}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all"
                      title="Disconnect Platform"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnect(p.id)}
                    disabled={syncingPlatformId === p.id}
                    className="w-full py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Connect Account
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic API Configuration Drawer Modal */}
      {configModalPlatform && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 bg-slate-900 border border-slate-800 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl font-mono p-2 rounded-xl bg-slate-950 border border-slate-800">
                  {configModalPlatform.logo || '🪙'}
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-white">{configModalPlatform.name}</h3>
                  <span className="text-[10px] text-amber-400 font-bold uppercase">{configModalPlatform.category}</span>
                </div>
              </div>
              <button onClick={() => setConfigModalPlatform(null)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Connection Status Banner */}
            <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between ${
              configModalPlatform.isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}>
              <div className="flex items-center gap-2">
                {configModalPlatform.isConnected ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-amber-400" />}
                <span>Status: {configModalPlatform.isConnected ? 'Connected & Authorized' : (configModalPlatform.statusLabel || 'Partner API Required')}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{configModalPlatform.id.toUpperCase()}</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Connect using official API credentials or approved partner access. Credentials must be encrypted and stored only on the backend.
            </p>

            {/* Documentation & Developer Portal Section */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5 text-xs">
              <div className="font-bold text-slate-200">Documentation & Partner Resources</div>
              <a
                href={getDocLink(configModalPlatform.id)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-indigo-400 font-bold hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View Official {configModalPlatform.name} Documentation
              </a>
              <p className="text-[11px] text-slate-500">Requires registered partner sandbox or live API keys.</p>
            </div>

            {/* Dynamic Credential Input Fields */}
            <div className="space-y-3 text-xs pt-1">
              {configModalPlatform.id === 'groww' || configModalPlatform.id === 'zerodha' ? (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-400 font-semibold">{configModalPlatform.id === 'groww' ? 'Groww API Key' : 'Kite Connect API Key'}</label>
                      <span className="text-[10px] text-amber-400 font-extrabold uppercase">Required</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={configModalPlatform.id === 'groww' ? "e.g. GW_KEY_991823" : "e.g. kite_api_key_88"}
                        value={apiKeyInput}
                        onChange={e => setApiKeyInput(e.target.value)}
                        className="w-full p-2.5 pr-8 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono focus:outline-none focus:border-amber-500 text-xs"
                      />
                      {apiKeyInput && (
                        <button onClick={() => setApiKeyInput('')} className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-400 font-semibold">{configModalPlatform.id === 'groww' ? 'Groww API Secret' : 'Kite Connect API Secret'}</label>
                      <span className="text-[10px] text-amber-400 font-extrabold uppercase">Required</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showSecretMap['apiSecret'] ? 'text' : 'password'}
                        placeholder="e.g. secret_key_..."
                        value={apiSecretInput}
                        onChange={e => setApiSecretInput(e.target.value)}
                        className="w-full p-2.5 pr-14 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono focus:outline-none focus:border-amber-500 text-xs"
                      />
                      <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
                        {apiSecretInput && (
                          <button onClick={() => setApiSecretInput('')} className="text-slate-500 hover:text-slate-300">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => toggleShowSecret('apiSecret')} className="text-slate-400 hover:text-slate-200">
                          {showSecretMap['apiSecret'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-400 font-semibold">Redirect URI</label>
                      <span className="text-[10px] text-slate-500 uppercase">Optional</span>
                    </div>
                    <input
                      type="text"
                      placeholder={configModalPlatform.id === 'zerodha' ? "http://localhost:5000/api/integrations/zerodha/callback" : "http://localhost:5000/api/integrations/groww/callback"}
                      value={redirectUriInput}
                      onChange={e => setRedirectUriInput(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Partner ID</label>
                      <input
                        type="text"
                        placeholder="e.g. PARTNER_901"
                        value={partnerIdInput}
                        onChange={e => setPartnerIdInput(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Merchant ID</label>
                      <input
                        type="text"
                        placeholder="e.g. MERCH_402"
                        value={merchantIdInput}
                        onChange={e => setMerchantIdInput(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Client ID</label>
                      <input
                        type="text"
                        placeholder="e.g. CLIENT_881"
                        value={clientIdInput}
                        onChange={e => setClientIdInput(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Client Secret</label>
                      <div className="relative">
                        <input
                          type={showSecretMap['clientSecret'] ? 'text' : 'password'}
                          placeholder="e.g. secret_..."
                          value={clientSecretInput}
                          onChange={e => setClientSecretInput(e.target.value)}
                          className="w-full p-2.5 pr-8 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500"
                        />
                        <button onClick={() => toggleShowSecret('clientSecret')} className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-200">
                          {showSecretMap['clientSecret'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">API Key</label>
                      <input
                        type="text"
                        placeholder="e.g. API_KEY_..."
                        value={apiKeyInput}
                        onChange={e => setApiKeyInput(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Base API URL</label>
                      <input
                        type="text"
                        placeholder={configModalPlatform.id === 'safegold' ? "https://api.safegold.com" : configModalPlatform.id === 'augmont' ? "https://api.augmont.com" : "https://api.auragold.com"}
                        value={baseUrlInput}
                        onChange={e => setBaseUrlInput(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Test Connection Banner */}
            {testResult && (
              <div className={`p-3 rounded-2xl text-xs font-bold border ${
                testResult.success
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>
                {testResult.message}
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestConnection}
                  disabled={testLoading}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 transition-all"
                >
                  {testLoading ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  onClick={handleDeleteCredentials}
                  className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30 transition-all"
                >
                  Remove Credentials
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfigModalPlatform(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfig}
                  disabled={saveLoading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/20 transition-all"
                >
                  {saveLoading ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Logs Drawer Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 bg-slate-900 border border-slate-800 max-w-xl w-full space-y-4 shadow-2xl max-h-[85vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Platform Synchronization Audit Logs</h3>
              </div>
              <button onClick={() => setShowLogsModal(false)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs font-mono pr-1">
              {auditLogsList.length === 0 ? (
                <div className="p-6 text-center text-slate-500">No audit log entries recorded yet.</div>
              ) : (
                auditLogsList.map((log) => (
                  <div key={log.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-amber-400 uppercase">{log.platformId}</span>
                      <span className="text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-300 font-sans text-xs">{log.message}</div>
                    <div className="text-[10px] text-indigo-400 font-bold uppercase">{log.eventType}</div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 text-right">
              <button
                onClick={() => setShowLogsModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Close Audit Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Asset Allocation Rebalancing Insights Card */}
      {rebalanceData && (
        <div className="glass-panel rounded-3xl p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider">
              <PieChart className="w-4 h-4 text-purple-400" />
              AI Asset Allocation Rebalancing Advisor
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {rebalanceData.healthRating}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {rebalanceData.rebalancingTips.map((tip: string, idx: number) => (
              <div key={idx} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Digital Gold Direct Vault Buying & Aura Gold Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Instant 24K Digital Gold Buyer */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider block">24K 99.9% Pure Digital Gold Vault</span>
              <h2 className="text-base font-extrabold text-white">Buy & Store Digital Gold starting at ₹10</h2>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1">
              <Coins className="w-4 h-4 text-amber-400" /> ₹{goldPricePerGram.toFixed(1)} / gram
            </span>
          </div>

          <form onSubmit={handleBuyGoldSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Select Provider Platform</label>
              <select 
                value={selectedGoldPlatform}
                onChange={(e) => setSelectedGoldPlatform(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-bold"
              >
                <option value="SafeGold / Augmont">SafeGold (Augmont Vault)</option>
                <option value="Aura Gold">Aura Gold Digital</option>
                <option value="Groww Gold">Groww Digital Gold</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Investment Amount ({currencySymbol})</label>
              <input 
                type="number"
                value={goldAmount}
                onChange={(e) => setGoldAmount(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold text-sm focus:outline-none focus:border-amber-500"
                min="10"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Calculated Gold Grams</label>
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-400 font-extrabold text-sm">
                ~ {currentGrams.toFixed(4)} Grams
              </div>
            </div>

            <div className="md:col-span-3 pt-2">
              <button 
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-current" /> Pay {currencySymbol}{parseFloat(goldAmount || '0').toLocaleString()} via GPay / Paytm / PhonePe
              </button>
            </div>
          </form>

          {/* Quick preset chips */}
          <div className="flex items-center space-x-2 pt-1 text-xs">
            <span className="text-slate-400 font-semibold">Quick Amounts:</span>
            {['100', '500', '1000', '5000', '10000'].map(amt => (
              <button 
                key={amt}
                type="button"
                onClick={() => setGoldAmount(amt)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold border border-slate-700"
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Insured Physical Delivery Vault Card */}
        <div className="glass-panel rounded-3xl p-5 bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Physical Gold Coin Delivery</h3>
            </div>

            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Convert your accumulated SafeGold / Aura Gold vault balance into 24K 999.9 pure tamper-proof gold coins delivered directly to your doorstep with 100% insurance.
            </p>
          </div>

          <div className="space-y-3">
            {deliveryRequested && (
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold text-center">
                ✓ Delivery Order Dispatched! Tracking details sent to email.
              </div>
            )}

            <button 
              onClick={handleRequestPhysicalDelivery}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all border border-slate-700"
            >
              Request Doorstep Delivery (0.5g - 100g)
            </button>
          </div>
        </div>
      </div>

      {/* Recent Online Payment Transactions Log */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800">
        <div className="p-4 border-b border-slate-800 font-bold text-xs text-slate-200">
          Recent Payment Transactions (GPay, Paytm, PhonePe, UPI)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Provider</th>
                <th className="py-3.5 px-4">Purpose</th>
                <th className="py-3.5 px-4">Reference No</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors font-mono text-[11px]">
                  <td className="py-3.5 px-4 font-bold text-emerald-400">{tx.provider}</td>
                  <td className="py-3.5 px-4 text-slate-200 font-sans">{tx.purpose}</td>
                  <td className="py-3.5 px-4 text-slate-400">{tx.referenceNo}</td>
                  <td className="py-3.5 px-4 text-slate-400">{tx.timestamp}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-white font-sans">{currencySymbol}{tx.amount.toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Gateway Launcher Modal */}
      {showPaymentModal && (
        <PaymentGatewayModal 
          onClose={() => setShowPaymentModal(false)}
          defaultAmount={parseFloat(goldAmount || '1000')}
          defaultPurpose="Digital Gold Buy"
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
