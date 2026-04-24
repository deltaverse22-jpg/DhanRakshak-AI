import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, Search, ShieldAlert, Cpu, Activity, Info, X } from 'lucide-react';
import * as d3 from 'd3';
import { cn } from '../lib/utils';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'core' | 'ecosystem' | 'service';
  val: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  weight: number;
}

interface MatrixData {
  centralNode: string;
  nodes: Node[];
  links: Link[];
  vendorLockInScore: number;
  diversificationPlan: { target: string; action: string; impact: number }[];
}

export default function DependencyMatrix() {
  const [data, setData] = useState<MatrixData | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showPlan, setShowPlan] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetch('/api/dependency')
      .then(res => res.json())
      .then(setData);
  }, []);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Add subtle grid background
    const grid = svg.append("g").attr("class", "grid-background");
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      for (let y = 0; y < height; y += gridSize) {
        grid.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 0.5)
          .attr("fill", "#001C44")
          .attr("opacity", 0.05);
      }
    }

    const container = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
        // Adjust grid based on zoom for a parallax effect or just stay fixed
        grid.attr("transform", `translate(${event.transform.x % gridSize}, ${event.transform.y % gridSize})`);
      });

    svg.call(zoom);

    const simulation = d3.forceSimulation<Node>(data.nodes)
      .force("link", d3.forceLink<Node, Link>(data.links).id(d => d.id).distance(140))
      .force("charge", d3.forceManyBody().strength(-600))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(60));

    const link = container.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(data.links)
      .enter().append("line")
      .attr("stroke", "#001C44")
      .attr("stroke-opacity", 0.2)
      .attr("stroke-width", d => ((d as any).weight as number) * 2);

    const node = container.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(data.nodes)
      .enter().append("g")
      .attr("class", "cursor-pointer group")
      .call(d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // High Spend Pulse Effect
    node.filter(d => (d as any).val > 20 && (d as any).type !== 'core')
      .append("circle")
      .attr("r", d => Math.sqrt((d as any).val) * 10 + 5)
      .attr("fill", "none")
      .attr("stroke", "#FF0000")
      .attr("stroke-width", 3)
      .attr("opacity", 0.6)
      .attr("class", "animate-ping");

    const getNodeColor = (val: number, type: string) => {
      if (type === 'core') return "#001C44";
      if (val > 20) return "#FF0000"; // Chatak Lal (Vibrant Red)
      if (val >= 10) return "#f97316"; // Medium
      return "#3b82f6"; // Low
    };

    node.on("click", (event, d) => {
      setSelectedNode(d as Node);
      
      const neighbors = new Set<string>();
      neighbors.add((d as Node).id);
      
      data.links.forEach(l => {
        if ((l.source as any).id === (d as Node).id) neighbors.add((l.target as any).id);
        if ((l.target as any).id === (d as Node).id) neighbors.add((l.source as any).id);
      });

      node.transition().duration(400).style("opacity", (n: any) => neighbors.has(n.id) ? 1 : 0.08);
      link.transition().duration(400)
        .style("stroke-opacity", (l: any) => (l.source.id === (d as any).id || l.target.id === (d as any).id) ? 0.8 : 0.03)
        .style("stroke", (l: any) => (l.source.id === (d as any).id || l.target.id === (d as any).id) ? "#10b981" : "#001C44");
    });

    svg.on("click", (event) => {
      if (event.target.tagName === "svg" || event.target.tagName === "circle" && d3.select(event.target).attr("class") === "grid-dot") {
        node.transition().duration(400).style("opacity", 1);
        link.transition().duration(400)
          .style("stroke-opacity", 0.2)
          .style("stroke", "#001C44");
        setSelectedNode(null);
      }
    });

    node.append("circle")
      .attr("r", d => {
        if ((d as any).type === 'core') return 32;
        return Math.sqrt((d as any).val) * 10;
      })
      .attr("fill", d => getNodeColor((d as any).val, (d as any).type))
      .attr("stroke", d => (d as any).type === 'core' ? "#10b981" : "white")
      .attr("stroke-width", 2.5)
      .style("filter", d => (d as any).val > 20 ? "drop-shadow(0 0 12px rgba(255, 0, 0, 0.6))" : "drop-shadow(0 8px 16px rgba(0, 28, 68, 0.15))")
      .attr("class", "transition-all duration-300 group-hover:scale-110");

    const textGroup = node.append("g")
      .attr("class", "pointer-events-none select-none");

    textGroup.append("text")
      .text(d => (d as any).label)
      .attr("text-anchor", "middle")
      .attr("y", d => {
        const radius = (d as any).type === 'core' ? 32 : Math.sqrt((d as any).val) * 10;
        return radius + 15;
      })
      .attr("fill", "#001C44")
      .attr("font-size", "11px")
      .attr("font-weight", "900")
      .attr("font-family", "JetBrains Mono")
      .attr("class", "uppercase tracking-[0.1em]");

    textGroup.append("text")
      .text(d => (d as any).type === 'core' ? "" : `${(d as any).val.toFixed(2)}%`)
      .attr("text-anchor", "middle")
      .attr("y", d => {
        const radius = (d as any).type === 'core' ? 32 : Math.sqrt((d as any).val) * 10;
        return radius + 28;
      })
      .attr("fill", "#64748b")
      .attr("font-size", "9px")
      .attr("font-family", "JetBrains Mono")
      .attr("font-weight", "bold");

    simulation.on("tick", () => {
      link
        .attr("x1", d => ((d as any).source as any).x)
        .attr("y1", d => ((d as any).source as any).y)
        .attr("x2", d => ((d as any).target as any).x)
        .attr("y2", d => ((d as any).target as any).y);

      node
        .attr("transform", d => `translate(${(d as any).x},${(d as any).y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => simulation.stop();
  }, [data]);

  if (!data) return (
     <div className="h-full flex items-center justify-center font-mono text-blue-900 text-xs animate-pulse uppercase tracking-widest">
       Initializing Neural Web...
     </div>
  );

  return (
    <div className="h-full flex flex-col gap-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-900/5 border border-blue-900/10 rounded-lg">
             <Network className="w-6 h-6 text-blue-900" />
          </div>
          <div>
             <h2 className="text-2xl font-black text-blue-950 italic uppercase tracking-tighter">Dependency Matrix</h2>
             <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-1 font-bold">Structural Capital Flow Analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[10px] font-mono text-emerald-600 uppercase tracking-widest">
             Vulnerability Score: <span className="text-blue-950 font-black">{(data.vendorLockInScore * 100).toFixed(1)}%</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        <div className="col-span-12 lg:col-span-8 glass-card relative overflow-hidden flex flex-col bg-white min-h-[500px] border-blue-900/10">
          <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
             <div className="text-[9px] font-bold text-blue-900 uppercase tracking-widest bg-blue-900/10 px-3 py-1 border border-blue-900/10 rounded-lg backdrop-blur-md">Live Node Topology</div>
             <div className="text-[10px] text-slate-400 font-mono italic font-black">Scroll to zoom • Drag nodes to reorganize</div>
          </div>
          
          <svg 
            ref={svgRef} 
            className="w-full flex-1 cursor-crosshair"
          />

          <div className="absolute bottom-6 left-6 flex flex-wrap gap-6 px-5 py-3 bg-white/80 backdrop-blur-md border border-blue-900/10 rounded-2xl shadow-sm z-10">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF0000] shadow-[0_0_15px_rgba(255,0,0,0.8)] animate-pulse" />
                <span className="text-[10px] font-mono text-blue-950 uppercase font-black">High_Lock {`[>20%]`}</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#f97316] shadow-[0_0_8px_rgba(249,115,22,0.3)]" />
                <span className="text-[10px] font-mono text-blue-950 uppercase font-black">Medium {`[10-20%]`}</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
                <span className="text-[10px] font-mono text-blue-950 uppercase font-black">Low_Risk {`[<10%]`}</span>
             </div>
             <div className="w-px h-3 bg-blue-900/10 mx-2" />
             <div className="flex items-center gap-2 opacity-60">
                <div className="w-3 h-3 rounded-full bg-blue-950 border-2 border-emerald-500" />
                <span className="text-[10px] font-mono text-blue-950 uppercase font-black">Core_Hedge</span>
             </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="glass-card p-6 flex flex-col gap-6 bg-white">
             <h3 className="text-[10px] font-bold text-blue-900 uppercase tracking-widest border-b border-blue-900/5 pb-4 flex items-center gap-2">
               <Cpu className="w-4 h-4" />
               Selected Node Telemetry
             </h3>
             
             {selectedNode ? (
               <motion.div 
                 key={selectedNode.id}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="flex flex-col gap-6"
               >
                 <div>
                    <div className="text-2xl font-black text-blue-950 tracking-tighter italic uppercase">{selectedNode.label}</div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase mt-1 font-bold">{selectedNode.type} Node Interface</div>
                 </div>

                 <div className="p-4 bg-slate-50 border border-blue-900/5 rounded-xl">
                    <div className="text-[9px] text-slate-500 uppercase font-mono mb-3">Redundancy Scalar</div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${selectedNode.val * 3}%` }}
                         className="h-full bg-blue-900" 
                       />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-blue-900 mt-2 uppercase font-black">
                       <span>Low_Risk</span>
                       <span>{(selectedNode.val * 3).toFixed(1)}% Redundancy</span>
                    </div>
                 </div>

                 <div className="bg-blue-900/[0.02] p-4 border border-blue-900/10 rounded-xl">
                    <div className="text-[9px] text-emerald-600 uppercase mb-2 flex items-center gap-2 font-black">
                       <Info className="w-3 h-3" /> Predictive Assessment
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-mono font-bold">
                      {selectedNode.type === 'ecosystem' 
                        ? "High strategic concentration detected. Recommend vendor diversification to mitigate platform lock-in risks."
                        : "Single-point dependency identified. Operational uptime relies heavily on external node stability."}
                    </p>
                 </div>
               </motion.div>
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center opacity-30 select-none">
                   <Activity className="w-10 h-10 mb-4 stroke-1 text-blue-500 animate-pulse" />
                   <p className="text-[10px] font-mono italic">Select a node to initiate<br/>structural deep-scan.</p>
                </div>
             )}
          </div>

          <div className="glass-card p-6 flex flex-col justify-between gap-6 border-emerald-500/20 bg-emerald-500/[0.02]">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                   <ShieldAlert className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                   <h4 className="text-[10px] font-bold text-blue-950 uppercase tracking-widest">Actionable Alerts</h4>
                   <p className="text-[10px] font-mono text-emerald-600 font-bold uppercase">Lock-in threshold critical</p>
                </div>
             </div>
             
             <p className="text-[11px] text-slate-400 leading-relaxed italic font-mono font-black uppercase">
                Concentration of capital within the <span className="text-blue-950 underline decoration-blue-950/20">AWS</span> and <span className="text-blue-950 underline decoration-blue-950/20">Azure</span> clusters is high.
             </p>
             
             <button 
               onClick={() => setShowPlan(true)}
               className="w-full py-4 bg-blue-900 text-white shadow-xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-800 transition-all rounded-xl cursor-none"
             >
                Generate Diversification Plan
             </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPlan && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPlan(false)}
              className="absolute inset-0 bg-blue-950/20 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white border border-blue-900/10 p-10 rounded-3xl glass-card shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-3xl font-black text-blue-950 italic tracking-tighter uppercase underline decoration-emerald-500 underline-offset-8">Diversification Directive</h3>
                  <p className="text-[10px] font-mono text-slate-400 mt-4 tracking-widest uppercase font-black">Sentinel Output // Strategic Redundancy v1.4</p>
                </div>
                <button 
                  onClick={() => setShowPlan(false)}
                  className="p-3 border border-blue-900/10 text-blue-900 hover:bg-blue-900 hover:text-white transition-all rounded-xl shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {data.diversificationPlan.map((plan, i) => (
                  <motion.div 
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 bg-slate-950/60 border border-blue-500/5 border-l-4 border-l-blue-500 rounded-2xl flex justify-between items-center group hover:bg-blue-600/10 transition-all"
                  >
                    <div>
                      <div className="text-[10px] font-bold text-blue-500 uppercase mb-1 tracking-widest">{plan.target}</div>
                      <div className="text-sm text-white font-medium italic">{plan.action}</div>
                    </div>
                    <div className="text-right">
                       <div className="text-2xl font-black text-blue-500 italic">-{ (plan.impact * 100).toFixed(0) }%</div>
                       <div className="text-[9px] text-slate-600 uppercase font-mono">Lock-in Reduction</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-12 flex gap-4">
                 <button className="flex-1 py-5 bg-blue-600 text-white font-black text-[11px] uppercase tracking-[0.2em] hover:bg-blue-500 transition-all rounded-xl cursor-none shadow-lg shadow-blue-500/30 border border-blue-400/30">
                   Execute Strategic Pivot
                 </button>
                 <button 
                   onClick={() => setShowPlan(false)}
                   className="px-10 py-5 glass border-blue-500/20 text-blue-500 font-black text-[11px] uppercase tracking-[0.2em] hover:bg-blue-600/10 transition-all rounded-xl cursor-none"
                  >
                    Abort
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
