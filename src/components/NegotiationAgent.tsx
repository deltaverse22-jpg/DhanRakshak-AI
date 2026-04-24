import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Sparkles, CheckCircle2, RefreshCcw, ShieldCheck, Terminal, Cpu, BrainCircuit, User, Bot, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";

// Initialize AI
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Subscription {
  id: string;
  provider: string;
  currentPrice: number;
  targetPrice: number;
  category: string;
  probability: number;
  context: string;
}

export default function NegotiationAgent() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [negotiationPhase, setNegotiationPhase] = useState<'idle' | 'scanning' | 'agent_active' | 'success' | 'failed'>('idle');
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'model', message: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/negotiate')
      .then(res => res.json())
      .then(data => {
        setSubs(data);
        if (data.length > 0) setSelectedSub(data[0]);
      });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  const startNegotiation = async () => {
    if (!selectedSub) return;
    
    setIsNegotiating(true);
    setNegotiationPhase('scanning');
    setChatLog([]);
    setError(null);
    
    try {
      // Phase 1: Logic Analysis
      await new Promise(resolve => setTimeout(resolve, 1500));
      setNegotiationPhase('agent_active');

      const systemInstruction = `You are a high-stakes billing negotiation AI for a user named 'DhanRakshak'. 
      Your task is to negotiate a lower monthly bill for ${selectedSub.provider} (${selectedSub.category}). 
      Current Price: ₹${selectedSub.currentPrice}. 
      Target Price: ₹${selectedSub.targetPrice}.
      Context: ${selectedSub.context}
      
      Rules:
      1. Be professional but firm.
      2. Use market benchmarks (mention competitors with lower rates).
      3. Mention loyalty but express risk of cancellation ("retention risk").
      4. If the virtual 'provider' offers a price close to ₹${selectedSub.targetPrice}, accept it.
      5. Keep responses concise (under 2 sentences).
      6. Start the conversation by identifying yourself as an authorized DhanRakshak parity agent.`;

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Initiate the negotiation with the provider.",
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const initialMessage = response.text;
      setChatLog([{ role: 'model', message: initialMessage }]);

      // Simulate a multi-turn conversation automatically
      await simulateProviderResponse(initialMessage, systemInstruction);

    } catch (err) {
      console.error(err);
      setError("AI_HANDSHAKE_FAILURE: Terminal link degraded.");
      setNegotiationPhase('failed');
      setIsNegotiating(false);
    }
  };

  const simulateProviderResponse = async (agentMessage: string, systemInstruction: string) => {
    // Turn 2: Provider pushback
    await new Promise(resolve => setTimeout(resolve, 2000));
    const providerPushback = `I understand you're looking for a better rate, but ₹${selectedSub?.targetPrice} is significantly below our standard plan. The best I can do right now is ₹${Math.floor(selectedSub!.currentPrice * 0.9)}. Would that work?`;
    setChatLog(prev => [...prev, { role: 'user', message: providerPushback }]);

    // Turn 3: Agent Counter
    await new Promise(resolve => setTimeout(resolve, 1500));
    try {
      const resp = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'model', parts: [{ text: agentMessage }] },
          { role: 'user', parts: [{ text: providerPushback }] },
          { role: 'user', parts: [{ text: "Counter-offer based on the target price." }] }
        ],
        config: { systemInstruction }
      });
      
      const counter = resp.text;
      setChatLog(prev => [...prev, { role: 'model', message: counter }]);

      // Turn 4: Final Success (Simulated completion)
      await new Promise(resolve => setTimeout(resolve, 2500));
      const successMsg = `Since you've been a loyal customer, I've cleared a special 'Sustainability Credit'. Your new rate is now ₹${selectedSub?.targetPrice}. This will reflect on your next billing cycle.`;
      setChatLog(prev => [...prev, { role: 'user', message: successMsg }]);
      
      setTimeout(() => {
        setNegotiationPhase('success');
        setIsNegotiating(false);
      }, 1000);

    } catch (err) {
      setError("REASONING_LEAK: Agent logic compromised.");
      setIsNegotiating(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 pb-20">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-900/5 border border-blue-900/10 rounded-xl">
           <MessageSquare className="w-6 h-6 text-blue-900" />
        </div>
        <div>
           <h2 className="text-2xl font-black text-blue-950 italic uppercase tracking-tighter text-balance">Negotiation Agent</h2>
           <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-1 font-bold">Autonomous Subscription Parity Engine</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
        {/* Left: Subscription Selection */}
        <div className="lg:col-span-4 glass-card p-6 flex flex-col gap-6 bg-white overflow-hidden shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-blue-900/5">
             <h3 className="text-[10px] font-bold text-blue-900 uppercase tracking-widest">Target Nodes</h3>
             <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">{subs.length} Active Vectors</span>
          </div>

          <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
             {subs.map((sub) => (
               <button
                 key={sub.id}
                 onClick={() => {
                   if (!isNegotiating) {
                     setSelectedSub(sub);
                     setNegotiationPhase('idle');
                     setChatLog([]);
                   }
                 }}
                 disabled={isNegotiating}
                 className={cn(
                   "w-full text-left p-5 rounded-2xl transition-all duration-300 border relative group overflow-hidden",
                   selectedSub?.id === sub.id 
                    ? "bg-blue-950 text-white shadow-xl shadow-blue-900/20" 
                    : "bg-white border-blue-900/5 hover:border-blue-900/20 disabled:opacity-50"
                 )}
               >
                 {selectedSub?.id === sub.id && (
                    <motion.div 
                      layoutId="sub-active"
                      className="absolute inset-0 bg-blue-950 -z-10" 
                    />
                 )}
                 <div className="flex justify-between items-start mb-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm",
                      selectedSub?.id === sub.id ? "bg-white/10 text-white" : "bg-blue-900/5 text-blue-900"
                    )}>
                      {sub.provider[0]}
                    </div>
                    <div className={cn(
                      "text-[9px] font-black uppercase px-2 py-1 rounded",
                      selectedSub?.id === sub.id ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-500/10 text-emerald-600"
                    )}>
                      {(sub.probability * 100).toFixed(0)}% Yield
                    </div>
                 </div>
                 <div className="text-sm font-black uppercase tracking-tight mb-1">{sub.provider}</div>
                 <div className={cn(
                   "text-[10px] font-mono font-bold",
                   selectedSub?.id === sub.id ? "text-white/40" : "text-slate-400"
                 )}>
                   Current: <span className={selectedSub?.id === sub.id ? "text-white" : "text-blue-950"}>₹{sub.currentPrice}</span>
                 </div>
               </button>
             ))}
          </div>

          <div className="p-4 bg-slate-50 border border-blue-900/5 rounded-2xl flex items-center gap-3">
             <Cpu className="w-4 h-4 text-blue-900" />
             <p className="text-[9px] font-mono text-slate-400 font-bold uppercase leading-relaxed">
               Agent trained on 50k+ retention dialogues. Modeling autonomous parity.
             </p>
          </div>
        </div>

        {/* Right: Agent Interface */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex-1 glass-card p-0 relative overflow-hidden flex flex-col bg-white border-blue-900/10 shadow-lg">
            {/* HUD Header */}
            <div className="px-8 py-6 border-b border-blue-900/5 flex items-center justify-between bg-white z-10">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-950 flex items-center justify-center shadow-lg relative">
                     <BrainCircuit className="w-5 h-5 text-emerald-500" />
                     {isNegotiating && (
                       <motion.div 
                         className="absolute inset-0 rounded-full border-2 border-emerald-500"
                         animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                         transition={{ duration: 2, repeat: Infinity }}
                       />
                     )}
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-blue-950 uppercase tracking-widest flex items-center gap-2">
                      GEMINI_PARITY_CORE
                      {isNegotiating && <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                    </h4>
                    <div className="text-[8px] font-mono text-slate-400 font-bold uppercase mt-1">
                      {isNegotiating ? "AI_REASONING_IN_PROGRESS" : "SYSTEM_READY_FOR_HANDSHAKE"}
                    </div>
                  </div>
               </div>
               
               {selectedSub && (
                  <div className="flex gap-4">
                    <div className="text-right">
                       <div className="text-[8px] text-slate-400 font-black uppercase mb-1 whitespace-nowrap">Target_Delta</div>
                       <div className="text-xl font-black text-emerald-600 italic tracking-tighter leading-none">
                          -₹{selectedSub.currentPrice - selectedSub.targetPrice}
                       </div>
                    </div>
                  </div>
               )}
            </div>

            {/* Chat/Terminal Area */}
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6 bg-slate-50/20">
               <AnimatePresence mode="popLayout" initial={false}>
                 {negotiationPhase === 'idle' && (
                    <motion.div 
                      key="idle"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto"
                    >
                       <div className="p-8 bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-blue-900/5">
                          <Terminal className="w-12 h-12 text-blue-900/20 mb-4 mx-auto" />
                          <h3 className="text-lg font-black text-blue-950 uppercase tracking-tighter">Initialize AI Engine?</h3>
                          <p className="text-[11px] font-mono text-slate-400 font-bold uppercase mt-3 leading-relaxed">
                            Targeting <span className="text-blue-950 underline decoration-emerald-500 underline-offset-4">{selectedSub?.provider}</span>. 
                            AI will deploy a specialized retention strategy to secure the rate of <span className="text-emerald-600 italic font-black">₹{selectedSub?.targetPrice}</span>.
                          </p>
                       </div>
                    </motion.div>
                 )}

                 {negotiationPhase === 'scanning' && (
                    <motion.div 
                       key="scanning"
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       exit={{ opacity: 0 }}
                       className="h-full flex flex-col items-center justify-center gap-8"
                    >
                       <div className="p-8 rounded-full bg-blue-900/5 border border-blue-900/10 flex items-center justify-center">
                          <RefreshCcw className="w-12 h-12 text-blue-900 animate-spin" strokeWidth={1} />
                       </div>
                       <div className="flex flex-col items-center gap-2">
                          <div className="text-[10px] font-black text-blue-900 uppercase tracking-[0.4em] animate-pulse">Running Parity Matrix...</div>
                          <div className="text-[8px] font-mono text-slate-400 font-bold uppercase">Analyzing market benchmarks</div>
                       </div>
                    </motion.div>
                 )}

                 {(negotiationPhase === 'agent_active' || negotiationPhase === 'success' || negotiationPhase === 'failed') && (
                    <div className="space-y-6 flex-1">
                       {chatLog.map((chat, i) => (
                         <motion.div 
                           key={i}
                           initial={{ opacity: 0, y: 10, x: chat.role === 'model' ? -10 : 10 }}
                           animate={{ opacity: 1, y: 0, x: 0 }}
                           className={cn(
                             "flex gap-3",
                             chat.role === 'model' ? "justify-start" : "justify-end"
                           )}
                         >
                           {chat.role === 'model' && (
                             <div className="w-8 h-8 rounded-full bg-blue-950 flex items-center justify-center shrink-0 shadow-md">
                                <Bot className="w-4 h-4 text-emerald-400" />
                             </div>
                           )}
                           <div className={cn(
                             "max-w-md p-5 rounded-2xl font-mono text-[11px] font-bold shadow-sm border leading-relaxed",
                             chat.role === 'model' 
                              ? "bg-blue-950 text-white border-blue-900" 
                              : "bg-white text-blue-950 border-blue-900/10"
                           )}>
                             <div className="text-[8px] uppercase tracking-widest mb-2 opacity-40 flex items-center justify-between">
                                <span>{chat.role === 'model' ? 'SENTINEL_AI' : 'PROVIDER_NODE'}</span>
                                {chat.role === 'model' && <Sparkles className="w-2 h-2 text-emerald-400" />}
                             </div>
                             {chat.message}
                           </div>
                           {chat.role === 'user' && (
                             <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 shadow-sm border border-slate-300">
                                <User className="w-4 h-4 text-slate-500" />
                             </div>
                           )}
                         </motion.div>
                       ))}

                       {isNegotiating && negotiationPhase === 'agent_active' && (
                         <div className="flex gap-2 p-4 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-900" />
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-900 delay-100" />
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-900 delay-200" />
                         </div>
                       )}
                       
                       {negotiationPhase === 'success' && (
                          <motion.div 
                             initial={{ scale: 0.8, opacity: 0 }}
                             animate={{ scale: 1, opacity: 1 }}
                             className="flex flex-col items-center justify-center py-10 gap-6 border-t border-emerald-500/10 mt-8"
                          >
                             <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40">
                                <CheckCircle2 className="w-10 h-10" />
                             </div>
                             <div className="text-center group">
                                <div className="text-4xl font-black text-blue-950 uppercase tracking-tighter">Target Rate Secured</div>
                                <div className="text-xs font-mono text-emerald-600 font-black mt-2 uppercase tracking-widest flex items-center justify-center gap-2">
                                  <Sparkles className="w-3 h-3" />
                                  Savings Locked: ₹{((selectedSub?.currentPrice || 0) - (selectedSub?.targetPrice || 0)) * 12}/yr
                                </div>
                             </div>
                          </motion.div>
                       )}

                       {error && (
                         <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600 font-mono text-[10px] font-bold">
                            <AlertTriangle className="w-4 h-4" />
                            {error}
                         </div>
                       )}
                       <div ref={chatEndRef} />
                    </div>
                 )}
               </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="p-8 border-t border-blue-900/5 bg-white z-10">
               <button 
                 disabled={!selectedSub || isNegotiating || negotiationPhase === 'success'}
                 onClick={startNegotiation}
                 className={cn(
                   "w-full py-6 rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all shadow-xl active:scale-[0.98] group relative overflow-hidden",
                   negotiationPhase === 'success' 
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" 
                    : "bg-blue-950 text-white hover:bg-blue-900 shadow-blue-900/20"
                 )}
               >
                 {isNegotiating ? (
                   <>
                     <RefreshCcw className="w-5 h-5 animate-spin" />
                     Session Active...
                   </>
                 ) : negotiationPhase === 'success' ? (
                   <>
                     <CheckCircle2 className="w-5 h-5" />
                     Negotiation Finalized
                   </>
                 ) : (
                   <>
                     <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-white/10 to-emerald-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                     <Sparkles className="w-5 h-5 text-emerald-400 transition-transform group-hover:rotate-12" />
                     Launch Autonomous Engine
                   </>
                 )}
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
