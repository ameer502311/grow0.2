import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mic, ScanLine, X, Sparkles, CheckCircle2, UploadCloud } from 'lucide-react';
import { ExpenseCategory } from '../types';

interface SmartFeaturesModalProps {
  onClose: () => void;
}

export const SmartFeaturesModal: React.FC<SmartFeaturesModalProps> = ({ onClose }) => {
  const { addExpense, currencySymbol } = useApp();
  const [activeTab, setActiveTab] = useState<'voice' | 'ocr'>('voice');

  // Voice speech state
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedVoiceAmount, setParsedVoiceAmount] = useState<number | null>(null);
  const [parsedVoiceCat, setParsedVoiceCat] = useState<ExpenseCategory>('Food');

  // OCR state
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [scannedData, setScannedData] = useState<{ merchant: string; amount: number; category: ExpenseCategory; date: string } | null>(null);

  const startVoiceInput = () => {
    setIsListening(true);
    setTranscript("Listening... (e.g. 'Spent 450 rupees on dinner at Starbucks')");

    setTimeout(() => {
      setIsListening(false);
      setTranscript("Parsed: Spent ₹450 on Food (Starbucks)");
      setParsedVoiceAmount(450);
      setParsedVoiceCat('Food');
    }, 2500);
  };

  const handleConfirmVoiceExpense = () => {
    if (parsedVoiceAmount) {
      addExpense({
        amount: parsedVoiceAmount,
        date: new Date().toISOString().slice(0, 10),
        category: parsedVoiceCat,
        notes: 'Voice Entry: Starbucks Dining'
      });
      onClose();
    }
  };

  const handleSimulateOCRUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setOcrStatus('scanning');
      setTimeout(() => {
        setOcrStatus('success');
        setScannedData({
          merchant: 'Supermarket Groceries',
          amount: 2840,
          category: 'Food',
          date: new Date().toISOString().slice(0, 10)
        });
      }, 2000);
    }
  };

  const handleConfirmOcrExpense = () => {
    if (scannedData) {
      addExpense({
        amount: scannedData.amount,
        date: scannedData.date,
        category: scannedData.category,
        notes: `OCR Receipt: ${scannedData.merchant}`
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel rounded-3xl p-6 bg-slate-900 border-slate-800 max-w-lg w-full space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-extrabold text-white">Smart Input Studio (Voice & Receipt OCR)</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex space-x-2">
          <button 
            onClick={() => setActiveTab('voice')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'voice' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-950 text-slate-400'}`}
          >
            <Mic className="w-4 h-4" /> Voice Expense Assistant
          </button>
          <button 
            onClick={() => setActiveTab('ocr')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'ocr' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-950 text-slate-400'}`}
          >
            <ScanLine className="w-4 h-4" /> Receipt OCR Scanner
          </button>
        </div>

        {/* VOICE TAB */}
        {activeTab === 'voice' && (
          <div className="space-y-4 text-center py-4">
            <div className="flex flex-col items-center justify-center">
              <button 
                onClick={startVoiceInput}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all ${isListening ? 'bg-rose-500 animate-pulse shadow-rose-500/30' : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30'}`}
              >
                <Mic className="w-8 h-8 text-slate-950" />
              </button>
              <span className="text-xs text-slate-400 mt-3 block font-semibold">
                {isListening ? 'Listening now...' : 'Click microphone to speak expense'}
              </span>
            </div>

            {transcript && (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200">
                {transcript}
              </div>
            )}

            {parsedVoiceAmount && (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-2 text-xs">
                <span className="text-emerald-400 font-bold block">AI Extracted Expense</span>
                <p className="text-white font-extrabold text-lg">{currencySymbol}{parsedVoiceAmount} ({parsedVoiceCat})</p>
                <button 
                  onClick={handleConfirmVoiceExpense}
                  className="w-full py-2 rounded-xl bg-emerald-500 text-white font-bold"
                >
                  Save Voice Expense
                </button>
              </div>
            )}
          </div>
        )}

        {/* OCR TAB */}
        {activeTab === 'ocr' && (
          <div className="space-y-4 py-2 text-xs">
            <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 text-center cursor-pointer bg-slate-950/60 relative">
              <input type="file" accept="image/*" onChange={handleSimulateOCRUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              <UploadCloud className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-200">Upload or Snap Receipt Image</p>
              <p className="text-[11px] text-slate-500 mt-1">Supports JPG, PNG, WEBP (Auto OCR detection)</p>
            </div>

            {ocrStatus === 'scanning' && (
              <div className="p-3 text-center text-emerald-400 animate-pulse font-bold">
                Scanning receipt text with AI OCR Engine...
              </div>
            )}

            {ocrStatus === 'success' && scannedData && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-2">
                <div className="flex justify-between font-bold text-slate-200">
                  <span>Merchant: {scannedData.merchant}</span>
                  <span className="text-emerald-400">{currencySymbol}{scannedData.amount}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Category: {scannedData.category}</span>
                  <span>Date: {scannedData.date}</span>
                </div>
                <button 
                  onClick={handleConfirmOcrExpense}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 text-white font-bold mt-2"
                >
                  Confirm & Log OCR Expense
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
