import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Lock, Mail, Smartphone, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { setUser, user } = useApp();
  const [authMode, setAuthMode] = useState<'email' | 'otp' | 'google' | 'forgot'>('email');

  const [emailInput, setEmailInput] = useState('alex.vance@fintech.io');
  const [phoneInput, setPhoneInput] = useState('+91 98765 43210');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSuccess(true);
    setTimeout(() => {
      setUser(prev => ({ ...prev, email: emailInput, isVerified: true }));
      onClose();
    }, 1200);
  };

  const handleSendOtp = () => {
    setOtpSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel rounded-3xl p-6 bg-slate-900 border-slate-800 max-w-md w-full space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-extrabold text-white">Secure Authentication</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub mode selector */}
        <div className="flex space-x-1 bg-slate-950 p-1 rounded-xl text-xs font-semibold text-slate-400">
          <button 
            onClick={() => setAuthMode('email')}
            className={`flex-1 py-1.5 rounded-lg ${authMode === 'email' ? 'bg-slate-800 text-white' : ''}`}
          >
            Email Login
          </button>
          <button 
            onClick={() => setAuthMode('otp')}
            className={`flex-1 py-1.5 rounded-lg ${authMode === 'otp' ? 'bg-slate-800 text-white' : ''}`}
          >
            Mobile OTP
          </button>
          <button 
            onClick={() => setAuthMode('google')}
            className={`flex-1 py-1.5 rounded-lg ${authMode === 'google' ? 'bg-slate-800 text-white' : ''}`}
          >
            Google SSO
          </button>
        </div>

        {authSuccess ? (
          <div className="py-6 text-center text-emerald-400 space-y-2 font-bold">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 animate-bounce" />
            <p>Authentication Successful!</p>
            <p className="text-xs text-slate-400 font-normal">JWT Session Token Generated.</p>
          </div>
        ) : (
          <>
            {authMode === 'email' && (
              <form onSubmit={handleLoginSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={emailInput} 
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Password</label>
                  <input 
                    type="password" 
                    value="••••••••••••" 
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all shadow-lg shadow-emerald-500/20"
                >
                  Sign In with Email
                </button>
              </form>
            )}

            {authMode === 'otp' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Mobile Number</label>
                  <input 
                    type="text" 
                    value={phoneInput} 
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  />
                </div>

                {!otpSent ? (
                  <button 
                    onClick={handleSendOtp}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all"
                  >
                    Send 6-Digit OTP
                  </button>
                ) : (
                  <>
                    <div>
                      <label className="block text-slate-400 mb-1">Enter 6-Digit OTP</label>
                      <input 
                        type="text" 
                        placeholder="784920" 
                        value={otpInput} 
                        onChange={(e) => setOtpInput(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-center font-bold tracking-widest text-base"
                      />
                    </div>
                    <button 
                      onClick={handleLoginSubmit}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all"
                    >
                      Verify OTP & Login
                    </button>
                  </>
                )}
              </div>
            )}

            {authMode === 'google' && (
              <div className="py-4 text-center space-y-4 text-xs">
                <p className="text-slate-400">Sign in securely using Google OAuth 2.0 single sign-on.</p>
                <button 
                  onClick={handleLoginSubmit}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <span className="font-extrabold text-blue-600">G</span> Continue with Google Account
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
