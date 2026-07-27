import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldAlert, Users, Server, Radio, FileText, Activity, CheckCircle, AlertTriangle, Key, Plus
} from 'lucide-react';
import { AuditLog } from '../types';

export const AdminPanel: React.FC = () => {
  const { user } = useApp();
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'users' | 'apis' | 'logs' | 'broadcast'>('users');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const mockUsers = [
    { id: 'u-1', name: 'Alex Vance', email: 'alex.vance@fintech.io', role: 'USER', status: 'ACTIVE', joined: '2026-01-12' },
    { id: 'u-2', name: 'Sarah Jenkins', email: 'sarah.j@growth.org', role: 'USER', status: 'ACTIVE', joined: '2026-02-18' },
    { id: 'u-3', name: 'Admin Ameer', email: 'admin@grow02.com', role: 'ADMIN', status: 'ACTIVE', joined: '2025-11-01' },
    { id: 'u-4', name: 'David Miller', email: 'david.m@quant.net', role: 'USER', status: 'SUSPENDED', joined: '2026-04-05' }
  ];

  const apiStatusList = [
    { name: 'GoldAPI / MetalPriceAPI', endpoint: 'api.metalpriceapi.com', status: 'HEALTHY', latency: '42ms', quota: '8,420 / 10,000' },
    { name: 'Finnhub Stock Ticker', endpoint: 'finnhub.io/api/v1', status: 'HEALTHY', latency: '65ms', quota: '54,100 / 100,000' },
    { name: 'CoinGecko Crypto Feed', endpoint: 'api.coingecko.com/v3', status: 'HEALTHY', latency: '110ms', quota: 'Unlimited' },
    { name: 'Google Gemini 1.5 Flash AI', endpoint: 'generativelanguage.googleapis.com', status: 'HEALTHY', latency: '280ms', quota: 'Active' },
    { name: 'NewsAPI Aggregator', endpoint: 'newsapi.org/v2', status: 'HEALTHY', latency: '88ms', quota: '1,200 / 5,000' }
  ];

  const auditLogs: AuditLog[] = [
    { id: 'log-1', action: 'USER_LOGIN', user: 'alex.vance@fintech.io', timestamp: '2026-07-27 20:15:22', ipAddress: '192.168.1.42', status: 'SUCCESS' },
    { id: 'log-2', action: 'EXPENSE_ADDED', user: 'alex.vance@fintech.io', timestamp: '2026-07-27 19:40:10', ipAddress: '192.168.1.42', status: 'SUCCESS' },
    { id: 'log-3', action: 'ADMIN_ROLE_SWITCH', user: 'admin@grow02.com', timestamp: '2026-07-27 18:10:05', ipAddress: '10.0.0.1', status: 'SUCCESS' },
    { id: 'log-4', action: 'FAILED_OTP_VERIFY', user: 'unknown@test.com', timestamp: '2026-07-27 15:22:00', ipAddress: '172.16.0.99', status: 'WARNING' }
  ];

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg) return;
    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastMsg('');
      setBroadcastSent(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel rounded-3xl p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 border-purple-500/30">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-400" /> Admin Control & Operations Portal
          </h1>
          <p className="text-xs text-slate-400">Manage application platform users, monitor live API rate limits, audit logs, and broadcast announcements.</p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button 
          onClick={() => setActiveAdminSubTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeAdminSubTab === 'users' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          User Management ({mockUsers.length})
        </button>
        <button 
          onClick={() => setActiveAdminSubTab('apis')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeAdminSubTab === 'apis' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          API Integrations & Quotas
        </button>
        <button 
          onClick={() => setActiveAdminSubTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeAdminSubTab === 'logs' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Audit Logs
        </button>
        <button 
          onClick={() => setActiveAdminSubTab('broadcast')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeAdminSubTab === 'broadcast' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Broadcast Notifications
        </button>
      </div>

      {/* USERS TAB */}
      {activeAdminSubTab === 'users' && (
        <div className="glass-panel rounded-3xl overflow-hidden border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">User Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {mockUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{u.name}</td>
                    <td className="py-3.5 px-4 text-slate-400">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400">{u.joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APIS TAB */}
      {activeAdminSubTab === 'apis' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apiStatusList.map((api) => (
            <div key={api.name} className="glass-panel rounded-3xl p-5 bg-slate-900/60 border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-white">{api.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> {api.status}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-400">
                <p>Endpoint: <span className="font-mono text-slate-200">{api.endpoint}</span></p>
                <p>Latency: <span className="text-emerald-400 font-semibold">{api.latency}</span></p>
                <p>Quota Usage: <span className="text-slate-200 font-semibold">{api.quota}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AUDIT LOGS TAB */}
      {activeAdminSubTab === 'logs' && (
        <div className="glass-panel rounded-3xl overflow-hidden border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Action Event</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 font-mono text-[11px]">
                    <td className="py-3.5 px-4 font-bold text-purple-300">{log.action}</td>
                    <td className="py-3.5 px-4 text-slate-300">{log.user}</td>
                    <td className="py-3.5 px-4 text-slate-400">{log.timestamp}</td>
                    <td className="py-3.5 px-4 text-slate-400">{log.ipAddress}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.status === 'SUCCESS' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BROADCAST TAB */}
      {activeAdminSubTab === 'broadcast' && (
        <div className="glass-panel rounded-3xl p-6 bg-slate-900/60 border-slate-800 max-w-lg space-y-4 text-xs">
          <h2 className="text-sm font-bold text-white">Broadcast System Notification</h2>
          <p className="text-slate-400">Send an instant alert message to all active platform users.</p>

          <form onSubmit={handleSendBroadcast} className="space-y-3">
            <textarea 
              rows={3}
              placeholder="e.g. Scheduled maintenance on GoldAPI integration at 02:00 AM UTC."
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
            />
            <button 
              type="submit"
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all"
            >
              Broadcast Notification Now
            </button>
          </form>

          {broadcastSent && (
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-center font-bold">
              ✓ Broadcast notification sent to all active users!
            </div>
          )}
        </div>
      )}
    </div>
  );
};
