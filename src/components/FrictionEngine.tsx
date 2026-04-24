import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, BrainCircuit, Clock, FastForward, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';
import { format, parseISO } from 'date-fns';

interface ImpulseBuy {
  id: string;
  date: string;
  amount: number;
  merchant: string;
  category: string;
  impulseProb: number;
}

export default function FrictionEngine() {
  const [items, setItems] = useState<ImpulseBuy[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    fetch('/api/friction')
      .then(res => res.json())
      .then(setTxs => {
        setItems(setTxs);
      });
  }, []);

  const handleBlock = () => {
    setIsBlocked(true);
    setTimeout(() => {
      setIsBlocked(false);
      setSelectedIndex((prev) => (prev + 1) % items.length);
    }, 1500);
  };

  const activeItem = items[selectedIndex];

  return (
    <div className="h-full flex flex-col gap-6 pb-20">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-900/5 border border-blue-900/10 rounded-lg">
           <Zap className="w-6 h-6 text-blue-900" />
        </div>
        <div>
           <h2 className="text-2xl font-black text-blue-950 italic uppercase tracking-tighter">Friction Engine</h2>
           <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-1 font-bold">Autonomous Impulse Interception</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeItem ? (
          <motion.div 
            key={activeItem.id + (isBlocked ? '_blocked' : '')}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            <div className={cn(
              "w-full max-w-sm glass-card p-8 relative transition-all duration-500 bg-white",
              isBlocked && "border-blue-900 bg-blue-900/5 scale-95 opacity-50 shadow-xl"
            )}>
              {isBlocked && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-sm">
                   <div className="text-4xl font-black text-blue-900 rotate-[-12deg] border-4 border-blue-900 px-6 py-3 uppercase tracking-tighter bg-white shadow-2xl">Delay_Enforced</div>
                </div>
              )}
              
              <div className="flex justify-between items-center mb-6">
                <div className="text-[10px] text-blue-900 font-black uppercase tracking-widest flex items-center gap-2">
                   <ShieldAlert className="w-3 h-3 text-emerald-600" />
                   Intercepted_Transmission
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-900 animate-pulse" />
              </div>
              
              <div className="mb-8 border-b border-blue-900/5 pb-8">
                <div className="text-4xl font-black text-emerald-600 italic tracking-tighter">₹{activeItem.amount.toLocaleString()}</div>
                <div className="text-[10px] font-mono text-blue-900 font-black uppercase tracking-widest mt-2 underline decoration-blue-900/10 underline-offset-4">
                  {activeItem.merchant.toUpperCase().replace(/\s+/g, '_')}
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="p-4 bg-blue-900/[0.02] border border-blue-900/5 rounded-xl relative overflow-hidden group hover:border-blue-900/10 hover:bg-white transition-all">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-[9px] text-slate-400 uppercase tracking-tighter font-black">Heuristic_Classifier_Result</div>
                    <BrainCircuit className="w-4 h-4 text-blue-900 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-xl font-black text-blue-950 italic uppercase">
                    Decision: Impulse_Buy
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1 font-bold">Random_Forest_Confidence: {(activeItem.impulseProb * 100).toFixed(0)}%</div>
                  
                  <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${activeItem.impulseProb * 100}%` }}
                      className="h-full bg-blue-900" 
                    />
                  </div>
                </div>

                <div className="space-y-3">
                   <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Decision Matrix Weights</div>
                   <div className="grid grid-cols-1 gap-2">
                      <div className="flex justify-between items-center p-3 bg-slate-50 border border-blue-900/5 hover:border-blue-900/20 transition-all font-mono text-[9px] rounded-lg">
                         <span className="text-slate-400 font-bold uppercase">Circadian_Offset (2AM)</span>
                         <span className="text-blue-900 font-black tracking-tighter">+0.65</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 border border-blue-900/5 hover:border-blue-900/20 transition-all font-mono text-[9px] rounded-lg">
                         <span className="text-slate-400 font-bold uppercase">Merchant_Volatility (E-Comm)</span>
                         <span className="text-blue-900 font-black tracking-tighter">+0.15</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 border border-blue-900/5 hover:border-blue-900/20 transition-all font-mono text-[9px] rounded-lg">
                         <span className="text-slate-400 font-bold uppercase">Magnitude_Scalar ({activeItem.amount > 100 ? '>100' : '<100'})</span>
                         <span className="text-blue-900 font-black tracking-tighter">+{activeItem.amount > 100 ? '0.15' : '0.00'}</span>
                      </div>
                   </div>
                </div>

                <div className="text-[10px] italic leading-tight text-slate-400 border-t border-blue-900/5 pt-4 font-mono font-bold uppercase">
                  Autonomous sentiment: High risk of capital leakage. Interception protocol activated.
                </div>
              </div>

              <div className="mt-10 flex flex-col gap-3">
                <button 
                  onClick={handleBlock}
                  className="w-full py-4 bg-blue-900 hover:bg-blue-800 text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all rounded-xl cursor-none flex items-center justify-center gap-2 shadow-xl border border-blue-700/30"
                >
                  <Clock className="w-4 h-4" />
                  Intercept & Delay 12h
                </button>
                <button 
                  onClick={() => setSelectedIndex((prev) => (prev + 1) % items.length)}
                  className="w-full py-4 border border-blue-900/10 text-blue-900/60 hover:text-blue-900 hover:bg-blue-900/5 text-[11px] font-black uppercase tracking-[0.2em] transition-all rounded-xl cursor-none"
                >
                  Override ML Decision
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-blue-900 font-mono text-[10px] uppercase tracking-widest animate-pulse font-black">
            Scanning financial perimeter...
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
