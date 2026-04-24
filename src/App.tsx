import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  ListOrdered, 
  Zap, 
  Network,
  Activity,
  Cpu,
  Shield,
  Menu,
  X,
  Sparkles,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { cn } from './lib/utils';
import { auth, logout, onAuthStateChanged } from './lib/firebase';
import { User } from 'firebase/auth';

// --- COMPONENTS ---
import Auth from './components/Auth';
import CommandCenter from './components/CommandCenter';
import LedgerStream from './components/LedgerStream';
import DependencyMatrix from './components/DependencyMatrix';
import CashoutPredictor from './components/CashoutPredictor';
import NegotiationAgent from './components/NegotiationAgent';
import CustomCursor from './components/CustomCursor';

type Page = 'home' | 'ledger' | 'negotiate' | 'matrix' | 'cashout';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState<Page>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const navItems = [
    { id: 'home' as Page, icon: LayoutDashboard, label: 'Command Center' },
    { id: 'ledger' as Page, icon: ListOrdered, label: 'Ledger Stream' },
    { id: 'negotiate' as Page, icon: Sparkles, label: 'Negotiation Agent' },
    { id: 'matrix' as Page, icon: Network, label: 'Dependency Matrix' },
    { id: 'cashout' as Page, icon: Activity, label: 'Cashout Predictor' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCFAF8] flex items-center justify-center">
        <CustomCursor />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-2 border-blue-900/10 border-t-blue-900 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative font-sans text-slate-900 bg-[#FCFAF8] overflow-hidden flex">
      <CustomCursor />
      <div className="scanline" />

      {!user ? (
        <Auth />
      ) : (
        <>
          {/* Mesh Background */}
          <div className="mesh-bg">
            <div className="mesh-gradient" />
          </div>

          {/* Sidebar Navigation */}
          <motion.nav 
            animate={{ width: isSidebarOpen ? '280px' : '80px' }}
            className="relative z-40 h-screen bg-white shadow-[20px_0_40px_rgba(0,28,100,0.03)] border-r border-blue-900/5 flex flex-col transition-all duration-500 overflow-hidden"
          >
            <div className="p-6 flex items-center gap-4 border-b border-blue-900/5 h-20 shrink-0">
              <div className="w-10 h-10 bg-blue-950 border border-blue-900/5 flex items-center justify-center rounded-lg shrink-0 overflow-hidden">
                <img 
                  src="https://lh3.googleusercontent.com/d/1aRuPE1caAF55hSyaB479McO6dpk80NJ9" 
                  alt="Logo" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              {isSidebarOpen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col whitespace-nowrap"
                >
                  <h1 className="text-sm font-black tracking-tight text-blue-950 font-mono leading-none">DHAN_RAKSHAK</h1>
                  <span className="text-[7px] font-bold text-blue-900/40 tracking-[0.1em] uppercase">Outsmart your own savings</span>
                </motion.div>
              )}
            </div>

            <div className="flex-1 py-10 flex flex-col gap-2 px-4 text-slate-900">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={cn(
                    "group relative flex items-center h-12 rounded-lg transition-all duration-300 overflow-hidden",
                    activePage === item.id 
                      ? "bg-blue-900/5 text-blue-950" 
                      : "text-slate-500 hover:text-blue-900 hover:bg-blue-900/5"
                  )}
                >
                  <div className="w-12 h-12 flex items-center justify-center shrink-0">
                    <item.icon className={cn("w-5 h-5", activePage === item.id ? "text-blue-900" : "text-slate-400 group-hover:text-blue-900")} />
                  </div>
                  {isSidebarOpen && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                  {activePage === item.id && (
                    <motion.div 
                      layoutId="active-nav"
                      className="absolute left-0 w-1 h-full bg-blue-950" 
                    />
                  )}
                </button>
              ))}
            </div>

            {/* User Profile & Logout */}
            <div className="p-4 border-t border-blue-900/5 flex flex-col gap-2">
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl overflow-hidden shrink-0">
                <div className="w-8 h-8 rounded-lg bg-blue-900/10 flex items-center justify-center shrink-0">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="profile" className="w-full h-full rounded-lg" referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-blue-900" />
                  )}
                </div>
                {isSidebarOpen && (
                  <div className="flex flex-col min-w-0">
                    <div className="text-[9px] font-black uppercase text-blue-950 truncate">{user.displayName || 'Guardian_Node'}</div>
                    <div className="text-[8px] font-mono font-bold text-slate-400 truncate">{user.email}</div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 h-10 w-full">
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="flex-1 h-full flex items-center justify-center bg-blue-900/5 border border-blue-900/5 hover:bg-blue-900/10 transition-all rounded text-blue-900/40"
                >
                  {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
                {isSidebarOpen && (
                  <button 
                    onClick={logout}
                    className="h-full px-4 flex items-center justify-center bg-blue-900 text-white hover:bg-blue-800 transition-all rounded group"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                )}
              </div>
            </div>
          </motion.nav>

          {/* Main Content Area */}
          <main className="flex-1 relative z-10 flex flex-col min-h-screen overflow-hidden">
            {/* Dynamic Header */}
            <header className="h-20 border-b border-blue-900/5 bg-white/60 backdrop-blur-md px-10 flex items-center justify-between sticky top-0 shrink-0">
              <div className="flex flex-col">
                <div className="text-[10px] font-black text-blue-900 uppercase tracking-[0.3em]">Operational_Node: {user.uid.slice(0, 8)}</div>
                <div className="text-[8px] font-mono text-slate-400 mt-1 uppercase italic transition-all duration-300 font-bold">
                  {activePage === 'home' && "Calibrating Liquidity Trajectory Signals..."}
                  {activePage === 'ledger' && "Scanning Transmission Surface for Patterns..."}
                  {activePage === 'negotiate' && "Optimizing Subscription Parity Vectors..."}
                  {activePage === 'matrix' && "Mapping Multi-Node Structural Flows..."}
                  {activePage === 'cashout' && "Forecasting Liquidity Depletion Epochs..."}
                </div>
              </div>
              
              <div className="hidden lg:flex items-center gap-8">
                <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl group transition-all hover:bg-emerald-500/10 hover:border-emerald-500/30">
                  <div className="relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]" />
                    <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-40" />
                  </div>
                  <span className="text-[10px] font-black font-mono text-emerald-600 uppercase tracking-widest">Status: Node_Optimal</span>
                </div>
                <div className="px-4 py-1.5 glass rounded border-blue-900/10 text-[9px] font-black text-blue-950/40 uppercase tracking-[0.3em]">
                  LAB_EDITION_v4.2
                </div>
              </div>
            </header>

            {/* Dynamic Page Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 relative">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-900/[0.02] blur-[120px] rounded-full -z-10 pointer-events-none" />
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePage}
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.01 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full max-w-7xl mx-auto w-full"
                >
                  {activePage === 'home' && <CommandCenter />}
                  {activePage === 'ledger' && <LedgerStream />}
                  {activePage === 'negotiate' && <NegotiationAgent />}
                  {activePage === 'matrix' && <DependencyMatrix />}
                  {activePage === 'cashout' && <CashoutPredictor />}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </>
      )}
    </div>
  );
}

