import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingDown, AlertTriangle, Calendar, Zap, Info, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';

export default function CashoutPredictor() {
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [burnRate, setBurnRate] = useState(0);
  const [balance, setBalance] = useState(0);
  const [projectionData, setProjectionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/runway')
      .then(res => res.json())
      .then(d => {
        setDaysRemaining(d.days);
        setBurnRate(d.dailyBurn);
        setBalance(d.balance);
        setProjectionData(d.projectionData);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="h-full flex items-center justify-center font-mono text-blue-900 text-xs animate-pulse uppercase tracking-widest">
      Projecting Trajectory...
    </div>
  );

  return (
    <div className="space-y-8 pb-32">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Forecast HUD */}
        <div className="lg:col-span-2 glass-card p-8 flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900/5 border border-blue-900/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-blue-900" />
              </div>
              <div>
                <h2 className="text-xl font-black text-blue-950 italic uppercase tracking-tighter">Liquidity_Trajectory</h2>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5 font-bold">Projected Net Multi-Node Burn</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded text-[9px] font-black text-emerald-600 uppercase tracking-widest animate-pulse">
              ML_PROJECTION_ACTIVE
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#001C44" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#001C44" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  fontFamily="JetBrains Mono"
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  fontFamily="JetBrains Mono"
                  tickFormatter={(val) => `₹${val/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid rgba(0, 28, 68, 0.1)', fontSize: '10px', fontFamily: 'JetBrains Mono', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 28, 68, 0.05)' }}
                  itemStyle={{ color: '#001C44' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#001C44" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorBalance)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border border-blue-900/5 bg-slate-50 rounded-lg">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Current_Surface</span>
              <span className="text-lg font-black text-blue-950 font-mono leading-none">₹{balance.toLocaleString()}</span>
            </div>
            <div className="p-4 border border-blue-900/5 bg-slate-50 rounded-lg">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Daily_Drain_Rate</span>
              <span className="text-lg font-black text-emerald-600 font-mono leading-none">₹{burnRate.toLocaleString()}</span>
            </div>
            <div className="p-4 border border-blue-900/5 bg-slate-50 rounded-lg">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Confidence_Score</span>
              <span className="text-lg font-black text-blue-900 font-mono leading-none">94.8%</span>
            </div>
            <div className="p-4 border border-blue-900/5 bg-slate-50 rounded-lg">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Simulation_Count</span>
              <span className="text-lg font-black text-slate-300 font-mono leading-none">12.5k</span>
            </div>
          </div>
        </div>

        {/* Action/Metric Column */}
        <div className="flex flex-col gap-6">
          <div className="glass-card p-8 bg-blue-900/[0.02] border-blue-900/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-900/5 blur-3xl -z-10 transition-all duration-700 group-hover:scale-150" />
            <div className="flex flex-col gap-1 items-center text-center">
              <span className="text-[10px] font-black text-blue-900 uppercase tracking-[0.3em]">Critical_Horizon</span>
              <div className="relative mt-2">
                <span className="text-7xl font-black text-blue-950 tracking-tighter leading-none">{Math.floor(daysRemaining)}</span>
                <span className="text-xl font-bold text-emerald-600 ml-1">.{(daysRemaining % 1).toFixed(1).split('.')[1]}</span>
              </div>
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Solar_Days_Until_Zero</span>
              <div className="mt-8 w-full">
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(daysRemaining / 30) * 100}%` }}
                    className="h-full bg-blue-900"
                  />
                </div>
                <div className="flex justify-between mt-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  <span>CRITICAL_ZONE</span>
                  <span>SAFETY_MARGIN</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card flex-1 p-6 relative">
            <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-widest flex items-center gap-2 mb-6">
              <AlertTriangle className="w-3 h-3 text-emerald-600" />
              Burn_Optimization_Protocols
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Unused Cloud Node', impact: '₹12,400 Monthly', action: 'Terminate' },
                { label: 'Recurring PR Retainer', impact: '₹45,000 Monthly', action: 'Downgrade' },
                { label: 'Over-provisioned S3', impact: '₹8,200 Monthly', action: 'Archive' },
              ].map((item, i) => (
                <div key={i} className="p-4 bg-blue-900/[0.02] border border-blue-900/5 rounded-lg flex items-center justify-between group hover:border-blue-900/20 transition-all hover:bg-white">
                  <div>
                    <div className="text-[10px] font-bold text-blue-950 uppercase">{item.label}</div>
                    <div className="text-[9px] font-mono text-slate-400 tracking-tight font-black mt-0.5">{item.impact}</div>
                  </div>
                  <button className="p-2 bg-blue-900/5 border border-blue-900/10 text-blue-900 rounded hover:bg-blue-900 hover:text-white transition-all">
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-blue-900/5">
               <div className="flex items-center gap-3 p-3 bg-slate-50 border border-blue-900/10 rounded-lg">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-[9px] font-medium text-slate-400 uppercase leading-relaxed font-mono">
                    Optimization could extend critical horizon by <span className="text-blue-950 font-black underline underline-offset-4 decoration-emerald-500">2.4 days</span>.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-6">
                  <Calendar className="w-4 h-4 text-blue-900" />
                  <span className="text-[10px] font-black text-blue-950 uppercase tracking-[0.2em]">Liquidity_Events</span>
              </div>
              <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-blue-900/10">
                  {[
                    { date: '04.25', label: 'AWS_CLOUD_INVOICE', amount: '-₹18,400', severity: 'low' },
                    { date: '04.28', label: 'NODE_PAYROLL_BETA', amount: '-₹1,42,000', severity: 'high' },
                    { date: '05.01', label: 'STRIPE_CLEARANCE', amount: '+₹42,500', severity: 'low' },
                  ].map((event, i) => (
                    <div key={i} className="flex gap-4 relative pl-8">
                       <div className={cn(
                         "absolute left-0 top-1 w-6 h-6 rounded-lg border flex items-center justify-center bg-white z-10",
                         event.severity === 'high' ? "border-blue-900" : "border-blue-900/10"
                       )}>
                          <div className={cn("w-1 h-1 rounded-full", event.severity === 'high' ? "bg-blue-950 animate-pulse" : "bg-blue-900/30")} />
                       </div>
                       <div className="flex-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                             <span className="text-blue-950 font-black">{event.label}</span>
                             <span className={cn(
                               "font-black tracking-tighter",
                               event.amount.startsWith('+') ? "text-emerald-600" : "text-blue-900"
                             )}>{event.amount}</span>
                          </div>
                          <div className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-widest">{event.date}</div>
                       </div>
                    </div>
                  ))}
              </div>
          </div>

          <div className="lg:col-span-2 glass-card p-6 overflow-hidden relative">
              <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] font-black text-blue-950 uppercase tracking-[0.2em]">Projection_Logic_Logs</span>
                  </div>
                  <div className="flex gap-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                     <span className="text-[8px] font-mono text-emerald-600 font-bold uppercase tracking-widest">LIVE_CALC</span>
                  </div>
              </div>
              
              <div className="space-y-2 font-mono text-[9px] text-slate-400 uppercase overflow-hidden h-[160px] font-bold">
                  <div className="flex gap-4 opacity-50"><span className="text-blue-900">[SYS]</span> <span>Fetching structural burn parameters...</span></div>
                  <div className="flex gap-4 opacity-70"><span className="text-blue-700">[ML_V1]</span> <span>Analyzing recurring subscription nodes... (IDENTIFIED: 14)</span></div>
                  <div className="flex gap-4 text-blue-900"><span className="text-blue-900">[ML_V1]</span> <span>Calculating velocity of capital flight... (EST: 45.2k/DAY)</span></div>
                  <div className="flex gap-4 opacity-80"><span className="text-blue-900">[PROJ]</span> <span>Running monte carlo simulation (ITER: 50,000)...</span></div>
                  <div className="flex gap-4 text-emerald-600"><span className="font-black">[SUCCESS]</span> <span>Simulation complete. Variance: 0.042%</span></div>
                  <div className="flex gap-4 text-blue-950 font-black animate-pulse"><span>{`> `}</span> <span>CASH_OUT_DATE_DETECTED: 2026.04.28 22:14:00</span></div>
                  <div className="flex gap-4 opacity-40"><span>[SYS]</span> <span>Monitoring node activity for trajectory shifts...</span></div>
              </div>
              
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          </div>
      </div>
    </div>
  );
}
