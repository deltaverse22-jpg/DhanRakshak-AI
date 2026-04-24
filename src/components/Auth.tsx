import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Sparkles, ArrowRight, Lock, AlertCircle, ExternalLink, Activity } from 'lucide-react';
import { signInWithGoogle, signInWithMock } from '../lib/firebase';

export default function Auth() {
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Authentication Error:", error);
      setError("Handshake failed. Click 'Initialize Guest Node' to bypass.");
    }
  };

  const handleMockLogin = () => {
    signInWithMock();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card p-12 bg-white relative z-10 shadow-2xl shadow-blue-900/5 rounded-[40px]"
      >
        <div className="flex flex-col items-center text-center gap-8">
          <div className="w-20 h-20 bg-blue-950 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-900/20 rotate-[-8deg] hover:rotate-0 transition-transform duration-500 shrink-0 overflow-hidden border border-white/10">
             <img 
               src="https://lh3.googleusercontent.com/d/1aRuPE1caAF55hSyaB479McO6dpk80NJ9" 
               alt="DhanRakshak Logo" 
               className="w-full h-full object-cover"
               referrerPolicy="no-referrer"
             />
          </div>

          <div>
            <h1 className="text-4xl font-black text-blue-950 tracking-tighter uppercase italic">DhanRakshak</h1>
            <p className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-[0.4em] mt-2">Outsmart your own savings</p>
          </div>

          <div className="space-y-4 w-full">
            <div className="p-4 bg-slate-50 border border-blue-900/5 rounded-2xl flex items-center gap-4 text-left">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-black text-blue-950 uppercase truncate">Neural_Parity_Engine</div>
                <div className="text-[9px] text-slate-400 font-bold font-mono">Real-time subscription negotiation.</div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-blue-900/5 rounded-2xl flex items-center gap-4 text-left">
              <div className="w-8 h-8 rounded-full bg-blue-900/10 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-blue-900" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-black text-blue-950 uppercase truncate">Zero_Trust_Auth</div>
                <div className="text-[9px] text-slate-400 font-bold font-mono">Secured by Firebase Enterprise.</div>
              </div>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-red-50 border border-red-100 rounded-2xl w-full flex items-center gap-3 text-red-600"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-[10px] font-mono font-bold uppercase text-left leading-tight">{error}</p>
            </motion.div>
          )}

          <div className="w-full pt-4 space-y-4">
            <button 
              onClick={handleLogin}
              className="w-full py-5 bg-blue-950 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-3 hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/10 active:scale-[0.98]"
            >
              Enterprise Handshake
              <ArrowRight className="w-4 h-4" />
            </button>

            <button 
              onClick={handleMockLogin}
              className="w-full py-4 bg-white border border-blue-900/10 text-blue-950 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-[0.98]"
            >
              <Activity className="w-4 h-4 text-emerald-500" />
              Initialize Guest Node
            </button>
            
            <div className="mt-8 flex flex-col items-center gap-4">
              <p className="text-[8px] font-mono text-slate-300 font-bold uppercase tracking-widest">
                Experiencing technical resonance?
              </p>
              <a 
                href={window.location.href} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 text-[9px] font-black uppercase text-blue-900 hover:underline decoration-emerald-500 underline-offset-4"
              >
                Open in Full Access Tab
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
