import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Zap, Brain, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
interface FastSlowBrainMapProps {
  fastScore: number;
  fastBaseline: number;
  fastDelta: number;
  slowScore: number;
  slowBaseline: number;
  slowDelta: number;
}

// Generate nodes for left hemisphere (Fast)
const FAST_NODES = [
  // Frontal area
  { x: 55, y: 45, size: 2.5 },
  { x: 70, y: 35, size: 3 },
  { x: 85, y: 30, size: 2 },
  { x: 100, y: 28, size: 2.5 },
  { x: 115, y: 30, size: 2 },
  // Mid area
  { x: 45, y: 65, size: 3 },
  { x: 60, y: 55, size: 2.5 },
  { x: 75, y: 50, size: 3.5 },
  { x: 90, y: 45, size: 2 },
  { x: 105, y: 42, size: 3 },
  { x: 120, y: 45, size: 2.5 },
  // Central area
  { x: 40, y: 90, size: 2 },
  { x: 55, y: 80, size: 3 },
  { x: 70, y: 70, size: 2.5 },
  { x: 85, y: 65, size: 3 },
  { x: 100, y: 60, size: 2 },
  { x: 115, y: 58, size: 2.5 },
  { x: 130, y: 60, size: 2 },
  // Lower area
  { x: 50, y: 110, size: 2.5 },
  { x: 65, y: 100, size: 3 },
  { x: 80, y: 90, size: 2 },
  { x: 95, y: 82, size: 3 },
  { x: 110, y: 78, size: 2.5 },
  { x: 125, y: 80, size: 2 },
  // Temporal
  { x: 35, y: 115, size: 2 },
  { x: 45, y: 130, size: 2.5 },
  { x: 60, y: 125, size: 2 },
  { x: 75, y: 115, size: 2.5 },
];

// Generate nodes for right hemisphere (Slow)
const SLOW_NODES = [
  // Frontal area
  { x: 245, y: 45, size: 3.5 },
  { x: 230, y: 35, size: 4 },
  { x: 215, y: 30, size: 3 },
  { x: 200, y: 28, size: 3.5 },
  { x: 185, y: 30, size: 3 },
  // Mid area
  { x: 255, y: 65, size: 4 },
  { x: 240, y: 55, size: 3.5 },
  { x: 225, y: 50, size: 4.5 },
  { x: 210, y: 45, size: 3 },
  { x: 195, y: 42, size: 4 },
  { x: 180, y: 45, size: 3.5 },
  // Central area
  { x: 260, y: 90, size: 3 },
  { x: 245, y: 80, size: 4 },
  { x: 230, y: 70, size: 3.5 },
  { x: 215, y: 65, size: 4 },
  { x: 200, y: 60, size: 3 },
  { x: 185, y: 58, size: 3.5 },
  { x: 170, y: 60, size: 3 },
  // Lower area
  { x: 250, y: 110, size: 3.5 },
  { x: 235, y: 100, size: 4 },
  { x: 220, y: 90, size: 3 },
  { x: 205, y: 82, size: 4 },
  { x: 190, y: 78, size: 3.5 },
  { x: 175, y: 80, size: 3 },
  // Temporal
  { x: 265, y: 115, size: 3 },
  { x: 255, y: 130, size: 3.5 },
  { x: 240, y: 125, size: 3 },
  { x: 225, y: 115, size: 3.5 },
];

// Generate connections between nodes
function generateConnections(nodes: typeof FAST_NODES, density: number = 0.3) {
  const connections: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = Math.sqrt(
        Math.pow(nodes[i].x - nodes[j].x, 2) + 
        Math.pow(nodes[i].y - nodes[j].y, 2)
      );
      if (dist < 40 && Math.random() < density) {
        connections.push({
          x1: nodes[i].x,
          y1: nodes[i].y,
          x2: nodes[j].x,
          y2: nodes[j].y
        });
      }
    }
  }
  return connections;
}

export function FastSlowBrainMap({ fastScore, fastBaseline, fastDelta, slowScore, slowBaseline, slowDelta }: FastSlowBrainMapProps) {
  const [fastPulse, setFastPulse] = useState(false);
  const [slowGlow, setSlowGlow] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  const fastConnections = useMemo(() => generateConnections(FAST_NODES, 0.5), []);
  const slowConnections = useMemo(() => generateConnections(SLOW_NODES, 0.5), []);

  // Continuous subtle animation
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(p => (p + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Trigger animations when deltas change
  useEffect(() => {
    if (fastDelta > 0) {
      setFastPulse(true);
      setTimeout(() => setFastPulse(false), 2000);
    }
  }, [fastDelta]);

  useEffect(() => {
    if (slowDelta > 0) {
      setSlowGlow(true);
      setTimeout(() => setSlowGlow(false), 3000);
    }
  }, [slowDelta]);

  // Calculate opacity and scale based on scores
  const fastOpacity = 0.5 + (fastScore / 100) * 0.5;
  const slowOpacity = 0.5 + (slowScore / 100) * 0.5;
  
  // Scale factor: scores 0-100 map to 0.7-1.1 scale
  const fastScale = 0.7 + (fastScore / 100) * 0.4;
  const slowScale = 0.7 + (slowScore / 100) * 0.4;

  const DeltaIndicator = ({ delta }: { delta: number }) => {
    if (delta > 0) return <TrendingUp className="w-3 h-3 text-green-400" />;
    if (delta < 0) return <TrendingDown className="w-3 h-3 text-red-400" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  const DeltaText = ({ delta }: { delta: number }) => {
    if (delta > 0) return <span className="text-green-400">+{delta}</span>;
    if (delta < 0) return <span className="text-red-400">{delta}</span>;
    return <span className="text-muted-foreground">0</span>;
  };

  return (
    <div className="rounded-2xl bg-[#05070B] border border-border/30 overflow-hidden">
      {/* SVG Brain Map - Split Brain */}
      <div className="relative h-[220px] w-full overflow-hidden">
        <svg 
          viewBox="0 0 300 160" 
          className="w-full h-full"
          style={{ background: "radial-gradient(ellipse at center, #0a0d12 0%, #05070B 100%)" }}
        >
          <defs>
            {/* Fast network gradient - amber/orange */}
            <linearGradient id="fastGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            
            {/* Slow network gradient - cyan/teal */}
            <linearGradient id="slowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
            
            {/* Glow filters */}
            <filter id="fastGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            <filter id="slowGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Brain outline - Left hemisphere (Fast) */}
          <path
            d="M 150 25 
               Q 130 20, 100 25 
               Q 60 35, 40 60 
               Q 25 85, 30 110 
               Q 35 130, 55 140 
               Q 80 150, 110 145 
               Q 140 140, 150 130"
            fill="none"
            stroke="#1a1f2e"
            strokeWidth="1.5"
            opacity="0.5"
          />
          
          {/* Brain outline - Right hemisphere (Slow) */}
          <path
            d="M 150 25 
               Q 170 20, 200 25 
               Q 240 35, 260 60 
               Q 275 85, 270 110 
               Q 265 130, 245 140 
               Q 220 150, 190 145 
               Q 160 140, 150 130"
            fill="none"
            stroke="#1a1f2e"
            strokeWidth="1.5"
            opacity="0.5"
          />
          
          {/* Center division line */}
          <line
            x1="150" y1="25"
            x2="150" y2="130"
            stroke="#1a1f2e"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.4"
          />

          {/* LEFT HEMISPHERE - FAST NETWORK */}
          <g 
            opacity={fastOpacity} 
            filter="url(#fastGlow)"
            transform={`translate(75, 85) scale(${fastScale}) translate(-75, -85)`}
            className={cn(
              "transition-all duration-500",
              fastPulse && "animate-pulse"
            )}
          >
            {/* Fast connections */}
            {fastConnections.map((conn, i) => (
              <line
                key={`fast-conn-${i}`}
                x1={conn.x1}
                y1={conn.y1}
                x2={conn.x2}
                y2={conn.y2}
                stroke="url(#fastGradient)"
                strokeWidth="0.8"
                opacity={0.4 + Math.sin((animationPhase * 1.5 + i * 20) * Math.PI / 180) * 0.3}
              />
            ))}
            
            {/* Fast nodes */}
            {FAST_NODES.map((node, i) => (
              <g key={`fast-node-${i}`}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.size + Math.sin((animationPhase * 1.8 + i * 35) * Math.PI / 180) * 0.3}
                  fill="url(#fastGradient)"
                  opacity={0.7 + Math.sin((animationPhase * 1.5 + i * 30) * Math.PI / 180) * 0.3}
                />
                {/* Spark effect */}
                {Math.sin((animationPhase + i * 60) * Math.PI / 180) > 0.97 && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.size * 2.5}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="0.5"
                    opacity="0.5"
                  />
                )}
              </g>
            ))}
          </g>

          {/* RIGHT HEMISPHERE - SLOW NETWORK */}
          <g 
            opacity={slowOpacity} 
            filter="url(#slowGlow)"
            transform={`translate(225, 85) scale(${slowScale}) translate(-225, -85)`}
            className={cn(
              "transition-all duration-1000",
              slowGlow && "animate-pulse"
            )}
          >
            {/* Slow connections */}
            {slowConnections.map((conn, i) => (
              <line
                key={`slow-conn-${i}`}
                x1={conn.x1}
                y1={conn.y1}
                x2={conn.x2}
                y2={conn.y2}
                stroke="url(#slowGradient)"
                strokeWidth="1.2"
                opacity={0.4 + Math.sin((animationPhase + i * 30) * Math.PI / 180) * 0.25}
              />
            ))}
            
            {/* Slow nodes */}
            {SLOW_NODES.map((node, i) => (
              <circle
                key={`slow-node-${i}`}
                cx={node.x}
                cy={node.y}
                r={node.size + Math.sin((animationPhase + i * 40) * Math.PI / 180) * 0.4}
                fill="url(#slowGradient)"
                opacity={0.7 + Math.sin((animationPhase + i * 25) * Math.PI / 180) * 0.3}
              />
            ))}
          </g>

          {/* Labels */}
          <text x="70" y="155" fill="#fbbf24" fontSize="8" fontWeight="600" textAnchor="middle" opacity="0.9">
            FAST
          </text>
          <text x="230" y="155" fill="#22d3ee" fontSize="8" fontWeight="600" textAnchor="middle" opacity="0.9">
            SLOW
          </text>
        </svg>

        {/* Score overlays on brain - show baseline values */}
        <div className="absolute inset-0 flex pointer-events-none">
          {/* Fast baseline */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span className="text-3xl font-bold text-amber-400 drop-shadow-lg">{fastBaseline}</span>
            </div>
          </div>
          {/* Slow baseline */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span className="text-3xl font-bold text-cyan-400 drop-shadow-lg">{slowBaseline}</span>
            </div>
          </div>
        </div>

        {/* Pulse overlay when fast delta positive */}
        {fastPulse && (
          <div className="absolute left-0 top-0 w-1/2 h-full pointer-events-none">
            <div className="absolute inset-0 bg-amber-500/5 animate-ping" style={{ animationDuration: "2s" }} />
          </div>
        )}

        {/* Breathing glow when slow delta positive */}
        {slowGlow && (
          <div className="absolute right-0 top-0 w-1/2 h-full pointer-events-none flex items-center justify-center">
            <div 
              className="w-24 h-24 rounded-full bg-cyan-500/10 animate-pulse" 
              style={{ animationDuration: "3s" }} 
            />
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-px bg-border/20">
        {/* Fast Thinking Card */}
        <div className="p-3.5 bg-[#08090d]">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center">
              <Zap className="w-3 h-3 text-amber-400" />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              System 1
            </span>
            <div className="flex items-center gap-1 ml-auto">
              <DeltaIndicator delta={fastDelta} />
              <span className="text-[10px]"><DeltaText delta={fastDelta} /></span>
            </div>
          </div>
          
          <p className="text-[9px] text-muted-foreground leading-relaxed">
            Pattern recognition, intuition
          </p>
        </div>

        {/* Slow Thinking Card */}
        <div className="p-3.5 bg-[#08090d]">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-md bg-cyan-500/10 flex items-center justify-center">
              <Brain className="w-3 h-3 text-cyan-400" />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              System 2
            </span>
            <div className="flex items-center gap-1 ml-auto">
              <DeltaIndicator delta={slowDelta} />
              <span className="text-[10px]"><DeltaText delta={slowDelta} /></span>
            </div>
          </div>
          
          <p className="text-[9px] text-muted-foreground leading-relaxed">
            Structured reasoning, analysis
          </p>
        </div>
      </div>

      {/* Scientific disclaimer with Info button */}
      <div className="px-4 py-2 bg-[#05070B] border-t border-border/10 flex items-center justify-center gap-2">
        <p className="text-[8px] text-muted-foreground/60 text-center leading-relaxed">
          Functional cognitive systems based on Kahneman's dual-process theory.
        </p>
        <Popover>
          <PopoverTrigger asChild>
            <button className="p-1 rounded-full hover:bg-border/20 transition-colors">
              <Info className="w-3 h-3 text-muted-foreground/60 hover:text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4 bg-[#0a0d12] border-border/30" align="center">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-foreground">Come calcoliamo i punteggi</h4>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-medium text-amber-400">Fast Thinking</span>
                </div>
                <ul className="text-[9px] text-muted-foreground space-y-0.5 ml-5">
                  <li>Focus Arena: <span className="text-amber-400">70%</span></li>
                  <li>Critical Reasoning: <span className="text-amber-400">20%</span></li>
                  <li>Creativity Hub: <span className="text-amber-400">50%</span></li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Brain className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] font-medium text-cyan-400">Slow Thinking</span>
                </div>
                <ul className="text-[9px] text-muted-foreground space-y-0.5 ml-5">
                  <li>Focus Arena: <span className="text-cyan-400">30%</span></li>
                  <li>Critical Reasoning: <span className="text-cyan-400">80%</span></li>
                  <li>Creativity Hub: <span className="text-cyan-400">50%</span></li>
                </ul>
              </div>
              
              <p className="text-[8px] text-muted-foreground/70 pt-1 border-t border-border/20">
                Formula: media pesata normalizzata delle 3 aree
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}