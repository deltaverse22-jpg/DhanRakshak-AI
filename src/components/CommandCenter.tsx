import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Clock, TrendingUp, Cpu, Shield, AlertTriangle } from 'lucide-react';

interface RunwayData {
  days: number;
  cashOutDate: string;
  balance: number;
  dailyBurn: number;
  status: string;
}

export default function CommandCenter() {
  const [data, setData] = useState<RunwayData | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/runway')
      .then(res => res.json())
      .then(setData);

    fetch('/api/command')
      .then(res => res.json())
      .then(d => setActiveAlerts(d.activeAlerts));
  }, []);

  if (!data) return (
     <div className="h-full flex items-center justify-center font-mono text-blue-500 text-xs animate-pulse uppercase tracking-widest">
       Syncing Central Node...
     </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Hero: Runway Countdown */}
      <div className="glass-card p-12 relative overflow-hidden flex flex-col items-center justify-center text-center">
        <div className="absolute inset-0 bg-blue-900/[0.02] transition-colors duration-500 hover:bg-blue-900/[0.04]" />
        <div className="relative z-10">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-[120px] font-black text-blue-900 leading-none tracking-tighter"
          >
            {data.days}
            <span className="text-2xl font-black ml-4 uppercase tracking-widest text-slate-400">Days</span>
          </motion.div>
          <div className="text-lg font-bold uppercase tracking-[0.4em] text-blue-950 mt-4 italic">Runway_Trajectory</div>
          <div className="text-xs font-mono text-slate-400 mt-6 uppercase tracking-widest border-t border-blue-900/5 pt-6">
            Predicted Liquidity Depletion: <span className="text-emerald-600 font-bold tracking-tight italic underline decoration-blue-900/10 underline-offset-4">{data.cashOutDate}</span>
          </div>
        </div>
        
        {/* Animated Background Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
           <motion.div 
             animate={{ scale: [1, 1.2, 1], rotate: 360 }}
             transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
             className="w-[500px] h-[500px] border border-blue-900/10 rounded-full"
           />
           <motion.div 
             animate={{ scale: [1.2, 1, 1.2], rotate: -360 }}
             transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
             className="w-[400px] h-[400px] border border-blue-900/5 rounded-full"
           />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Burn Rate Scorecard */}
        <div className="glass-card p-6 flex flex-col gap-4">
           <div className="flex items-center gap-3 text-blue-900">
              <TrendingUp className="w-5 h-5" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest">Real-Time Burn Rate</h3>
           </div>
           <div>
              <div className="text-3xl font-black text-blue-950 italic tracking-tighter">₹{data.dailyBurn.toLocaleString()}</div>
              <div className="text-[10px] font-mono text-slate-400 mt-1 uppercase font-bold">Avg. Daily Outflow</div>
           </div>
           <div className="mt-2 flex items-center gap-2">
              <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-600 uppercase">Trend_Status: Optimal</div>
           </div>
        </div>

        {/* Sentinel Status */}
        <div className="glass-card p-6 flex flex-col gap-4">
           <div className="flex items-center gap-3 text-blue-900">
              <Cpu className="w-5 h-5" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest">Neural Cluster Status</h3>
           </div>
           <div className="space-y-3">
              <div className="flex items-center justify-between">
                 <span className="text-[10px] font-mono text-slate-400 uppercase">Edge ML Models</span>
                 <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                    Online_Sync
                 </span>
              </div>
              <div className="flex items-center justify-between">
                 <span className="text-[10px] font-mono text-slate-400 uppercase">Surface Stream</span>
                 <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                    Active_Scan
                 </span>
              </div>
              <div className="flex items-center justify-between">
                 <span className="text-[10px] font-mono text-slate-400 uppercase">Heuristic Delta</span>
                 <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-900 uppercase">
                    <div className="w-1 h-1 bg-blue-900 rounded-full animate-pulse" />
                    Reactive
                 </span>
              </div>
           </div>
        </div>

        {/* Risk Assessment */}
        <div className="glass-card p-6 hidden md:flex flex-col gap-4">
           <div className="flex items-center gap-3 text-blue-900">
              <Shield className="w-5 h-5" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest">Risk Integrity Index</h3>
           </div>
           <div className="flex-1 flex flex-col justify-center">
              <div className="text-xs font-mono text-slate-400 uppercase mb-4 tracking-widest">Fragility Matrix</div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: '42%' }}
                   className="h-full bg-blue-900" 
                 />
              </div>
              <div className="flex justify-between text-[8px] font-mono mt-2 text-blue-900 uppercase">
                 <span>SECURED</span>
                 <span>42.8% INDEX</span>
              </div>
           </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="glass-card p-8">
         <h3 className="text-[10px] font-bold text-blue-950 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
            Operational Intelligence Feed
         </h3>
         <div className="space-y-4">
            {activeAlerts.map((alert: any, i: number) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-4 bg-blue-900/[0.02] border border-blue-900/5 rounded-lg hover:border-blue-900/20 transition-all cursor-none group hover:bg-white"
              >
                 <div className="flex items-center gap-6">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 group-hover:animate-ping" />
                    <div>
                       <div className="text-xs font-bold text-blue-950 tracking-tight uppercase italic">{alert.merchant}</div>
                       <div className="text-[10px] font-mono text-slate-400 font-bold">{alert.threatSource}</div>
                    </div>
                 </div>
                 <div className="flex items-center gap-8 text-right">
                    <div className="hidden sm:block">
                       <div className="text-[10px] font-mono text-blue-900">0.00{i+2}ms</div>
                       <div className="text-[8px] text-slate-400 uppercase font-black">LATENCY</div>
                    </div>
                    <div>
                       <div className="text-xs font-black text-emerald-600 italic tracking-tight">₹{alert.impact.toLocaleString()}</div>
                       <div className="text-[8px] font-mono text-slate-400 uppercase font-black">MAGNITUDE</div>
                    </div>
                 </div>
              </motion.div>
            ))}
         </div>
      </div>
    </div>
  );
}
