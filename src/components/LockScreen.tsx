import React, { useState } from 'react';
import { Lock, KeyRound, ArrowRight } from 'lucide-react';

interface LockScreenProps {
  pinCode: string;
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ pinCode, onUnlock }) => {
  const [inputPin, setInputPin] = useState('');
  const [error, setError] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPin === pinCode) {
      onUnlock();
    } else {
      setError(true);
      setInputPin('');
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-app/95 backdrop-blur-xl animate-fade-in">
      <div className="bg-panel border border-border rounded-3xl w-full max-w-sm p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Glow */}
        <div className="w-32 h-32 rounded-full bg-violet-600/10 blur-3xl absolute top-0 left-1/2 -translate-x-1/2" />

        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 text-violet-400 mx-auto flex items-center justify-center mb-4 border border-violet-500/20 shadow-inner">
          <Lock className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-bold font-serif text-main mb-1">
          ChronoNote 私密空间
        </h2>
        <p className="text-xs text-muted mb-6">
          已开启安全保护，请输入访问 PIN 码以继续
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <input
              type="password"
              value={inputPin}
              onChange={(e) => setInputPin(e.target.value)}
              placeholder="请输入解锁 PIN 码..."
              className={`w-full px-4 py-3 rounded-xl bg-card border text-center text-lg tracking-widest text-main focus:outline-none transition-all ${
                error
                  ? 'border-rose-500 ring-2 ring-rose-500/30 animate-bounce'
                  : 'border-border focus:border-violet-500 focus:ring-1 focus:ring-violet-500'
              }`}
              autoFocus
            />
            {error && (
              <p className="text-rose-400 text-xs mt-2 animate-fade-in">
                密码错误，请重新输入
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md shadow-violet-600/20 transition-all flex items-center justify-center gap-1.5"
          >
            <span>解锁时空墨历</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
