import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ShieldAlert, CheckCircle2, ChevronDown, RefreshCcw, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { cn } from '../lib/utils';

interface Transaction {
  id: string;
  date: string;
  amount: number;
  merchant: string;
  category: string;
  isAnomaly: boolean;
  anomalyScore: number;
  isImpulse?: boolean;
  impulseProb?: number;
}

type SortField = 'date' | 'amount';
type SortOrder = 'asc' | 'desc';

export default function LedgerStream() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter States
  const [category, setCategory] = useState('ALL');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sort State
  const [sortConfig, setSortConfig] = useState<{ field: SortField; order: SortOrder }>({
    field: 'date',
    order: 'desc'
  });

  const categories = ['ALL', ...Array.from(new Set(txs.map(tx => tx.category)))];

  useEffect(() => {
    fetch('/api/transactions')
      .then(res => res.json())
      .then(setTxs);
  }, []);

  const resetFilters = () => {
    setCategory('ALL');
    setMinAmount('');
    setMaxAmount('');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setSortConfig({ field: 'date', order: 'desc' });
  };

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'desc' ? 'asc' : 'desc'
    }));
  };

  const filteredAndSortedTxs = txs
    .filter(tx => {
      const matchesSearch = tx.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tx.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = category === 'ALL' || tx.category === category;
      
      const matchesAmount = (!minAmount || tx.amount >= Number(minAmount)) && 
                           (!maxAmount || tx.amount <= Number(maxAmount));
      
      const txDate = parseISO(tx.date);
      const matchesDate = (!startDate || isAfter(txDate, startOfDay(parseISO(startDate)))) &&
                         (!endDate || isBefore(txDate, endOfDay(parseISO(endDate))));

      return matchesSearch && matchesCategory && matchesAmount && matchesDate;
    })
    .sort((a, b) => {
      if (sortConfig.field === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortConfig.order === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        return sortConfig.order === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
    });

  return (
    <div className="space-y-6 h-full flex flex-col pb-20">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
             <h2 className="text-2xl font-black text-blue-950 italic uppercase tracking-tighter">Ledger Stream</h2>
             <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-1 font-bold">Transmission Surface Observation HUD</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-900 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Transmission_ID Scan..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border border-blue-900/10 rounded-lg pl-10 pr-4 py-2.5 text-[11px] font-mono text-blue-950 focus:outline-none focus:border-blue-900/40 w-64 transition-all uppercase placeholder:text-slate-300"
                />
             </div>
             <button 
               onClick={() => setShowFilters(!showFilters)}
               className={cn(
                 "p-2.5 glass transition-all rounded-lg flex items-center gap-2 cursor-none",
                 showFilters ? "bg-blue-900 text-white border-blue-800" : "border-blue-900/10 text-blue-900 hover:bg-blue-900/5"
               )}
             >
                <Filter className="w-4 h-4" />
                <span className="text-[9px] font-black uppercase tracking-widest hidden lg:block">Parameters</span>
             </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-blue-900 uppercase tracking-widest">Neural_Category</label>
                  <div className="relative">
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-blue-900/10 rounded-lg px-3 py-2 text-[10px] font-mono text-blue-950 appearance-none focus:border-blue-900/40 cursor-none uppercase"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-blue-900 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-blue-900 uppercase tracking-widest">Magnitude_Range (₹)</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="MIN" 
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-blue-900/10 rounded-lg px-3 py-2 text-[10px] font-mono text-blue-950 focus:outline-none focus:border-blue-900/40 cursor-none"
                    />
                    <input 
                      type="number" 
                      placeholder="MAX" 
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-blue-900/10 rounded-lg px-3 py-2 text-[10px] font-mono text-blue-950 focus:outline-none focus:border-blue-900/40 cursor-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-blue-900 uppercase tracking-widest">Temporal_Window</label>
                  <div className="flex gap-2">
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-blue-900/10 rounded-lg px-3 py-2 text-[10px] font-mono text-blue-950 focus:outline-none focus:border-blue-900/40 cursor-none"
                    />
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-50 border border-blue-900/10 rounded-lg px-3 py-2 text-[10px] font-mono text-blue-950 focus:outline-none focus:border-blue-900/40 cursor-none"
                    />
                  </div>
                </div>

                <div className="flex items-end">
                   <button 
                     onClick={resetFilters}
                     className="w-full py-2 border border-blue-900/20 text-blue-900 hover:bg-blue-900/5 transition-all rounded-lg text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 cursor-none"
                   >
                     <RefreshCcw className="w-3 h-3" />
                     Reset_Node_Params
                   </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="glass-card flex-1 overflow-hidden flex flex-col">
        <div className="overflow-y-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white/90 backdrop-blur-md z-10">
              <tr className="border-b border-blue-900/5">
                <th 
                  className="px-6 py-4 text-[10px] font-black text-blue-900 uppercase tracking-widest italic cursor-none hover:bg-blue-900/5 transition-colors"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-2">
                    Timestamp
                    {sortConfig.field === 'date' ? (
                      sortConfig.order === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : <ArrowUpDown className="w-3 h-3 opacity-20" />}
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-blue-900 uppercase tracking-widest italic">Transmission_ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-blue-900 uppercase tracking-widest italic">Vendor_Cluster</th>
                <th 
                  className="px-6 py-4 text-[10px] font-black text-blue-900 uppercase tracking-widest italic text-right cursor-none hover:bg-blue-900/5 transition-colors"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-2 text-right">
                    Magnitude
                    {sortConfig.field === 'amount' ? (
                      sortConfig.order === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : <ArrowUpDown className="w-3 h-3 opacity-20" />}
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-blue-900 uppercase tracking-widest italic text-center">Intelligence_Scan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-900/5 font-mono text-[11px]">
              {filteredAndSortedTxs.length > 0 ? (
                filteredAndSortedTxs.map((tx, i) => (
                  <motion.tr 
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.01, 1) }}
                    className={cn(
                      "hover:bg-blue-900/5 transition-colors group cursor-none",
                      tx.isAnomaly && "bg-blue-900/[0.03] border-y border-blue-900/20"
                    )}
                  >
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                      {format(parseISO(tx.date), 'yyyy.MM.dd HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {tx.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                         <span className={cn(
                            "font-bold",
                            tx.isAnomaly ? "text-blue-900" : "text-blue-950"
                         )}>
                           {tx.merchant.toUpperCase().replace(/\s+/g, '_')}
                         </span>
                         <span className="text-[8px] text-slate-400 font-black tracking-widest mt-0.5 uppercase">{tx.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={cn(
                         "font-black text-xs",
                         tx.isAnomaly ? "text-blue-900" : "text-emerald-600"
                      )}>
                         ₹{tx.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center justify-center gap-4">
                          <div className="flex-1 max-w-[100px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${tx.anomalyScore * 100}%` }}
                              className={cn(
                                "h-full",
                                tx.anomalyScore > 0.6 ? "bg-amber-400" : "bg-emerald-500"
                              )} 
                            />
                          </div>
                          {tx.isAnomaly ? (
                             <ShieldAlert className="w-4 h-4 text-amber-500 animate-pulse" />
                          ) : (
                             <CheckCircle2 className="w-4 h-4 text-emerald-500 group-hover:text-emerald-600 transition-colors" />
                          )}
                       </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center opacity-30 select-none italic text-slate-400 uppercase tracking-widest font-black text-[10px]">
                    No matching transmission sequences found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
