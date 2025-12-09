import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Zap, Brain, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface FastSlowBrainMapProps {
  fastScore: number;
  fastDelta: number;
  slowScore: number;
  slowDelta: number;
}

// SVG neural network node positions
const FAST_NODES = [
  { x: 80, y: 60, size: 3 },
  { x: 120, y: 45, size: 2.5 },
  { x: 160, y: 55, size: 3.5 },
  { x: 200, y: 40, size: 2 },
  { x: 240, y: 50, size: 3 },
  { x: 280, y: 65, size: 2.5 },
  { x: 100, y: 90, size: 2 },
  { x: 140, y: 85, size: 3 },
  { x: 180, y: 75, size: 2.5 },
  { x: 220, y: 80, size: 3 },
  { x: 260, y: 85, size: 2 },
  { x: 70, y: 120, size: 2.5 },
  { x: 110, y: 115, size: 3 },
  { x: 150, y: 105, size: 2 },
  { x: 190, y: 110, size: 3.5 },
  { x: 230, y: 100, size: 2.5 },
  { x: 270, y: 115, size: 2 },
  { x: 290, y: 95, size: 3 },
];

const SLOW_NODES = [
  { x: 130, y: 130, size: 5 },
  { x: 170, y: 125, size: 6 },
  { x: 210, y: 135, size: 5.5 },
  { x: 150, y: 160, size: 6.5 },
  { x: 190, y: 155, size: 7 },
  { x: 230, y: 150, size: 5 },
  { x: 140, y: 185, size: 5 },
  { x: 180, y: 180, size: 6 },
  { x: 220, y: 175, size: 5.5 },
  { x: 160, y: 210, size: 4.5 },
  { x: 200, y: 205, size: 5 },
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
      if (dist < 80 && Math.random() < density) {
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

export function FastSlowBrainMap({ fastScore, fastDelta, slowScore, slowDelta }: FastSlowBrainMapProps) {
  const [fastPulse, setFastPulse] = useState(false);
  const [slowGlow, setSlowGlow] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  const fastConnections = useMemo(() => generateConnections(FAST_NODES, 0.35), []);
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

  // Calculate opacity based on scores
  const fastOpacity = 0.4 + (fastScore / 100) * 0.6;
  const slowOpacity = 0.4 + (slowScore / 100) * 0.6;

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
      {/* SVG Brain Map */}
      <div className="relative h-[280px] w-full overflow-hidden">
        <svg 
          viewBox="0 0 360 240" 
          className="w-full h-full"
          style={{ background: "radial-gradient(ellipse at center, #0a0d12 0%, #05070B 100%)" }}
        >
          <defs>
            {/* Fast network gradient - teal/cyan */}
            <linearGradient id="fastGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
            
            {/* Slow network gradient - violet/purple */}
            <linearGradient id="slowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
            
            {/* Glow filters */}
            <filter id="fastGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            <filter id="slowGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Pulse animation for fast network */}
            <radialGradient id="fastPulseGradient">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8">
                <animate attributeName="stopOpacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite"/>
              </stop>
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0"/>
            </radialGradient>
          </defs>

          {/* Background brain silhouette outline */}
          <ellipse 
            cx="180" cy="130" rx="130" ry="100" 
            fill="none" 
            stroke="#1a1f2e" 
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.4"
          />
          
          {/* SLOW NETWORK (inner, larger nodes) */}
          <g 
            opacity={slowOpacity} 
            filter="url(#slowGlow)"
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
                strokeWidth="1.5"
                opacity={0.4 + Math.sin((animationPhase + i * 30) * Math.PI / 180) * 0.2}
              />
            ))}
            
            {/* Slow nodes */}
            {SLOW_NODES.map((node, i) => (
              <circle
                key={`slow-node-${i}`}
                cx={node.x}
                cy={node.y}
                r={node.size + Math.sin((animationPhase + i * 40) * Math.PI / 180) * 0.5}
                fill="url(#slowGradient)"
                opacity={0.7 + Math.sin((animationPhase + i * 25) * Math.PI / 180) * 0.3}
              />
            ))}
          </g>

          {/* FAST NETWORK (outer, smaller nodes) */}
          <g 
            opacity={fastOpacity} 
            filter="url(#fastGlow)"
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
                opacity={0.3 + Math.sin((animationPhase * 1.5 + i * 20) * Math.PI / 180) * 0.3}
              />
            ))}
            
            {/* Fast nodes with faster animation */}
            {FAST_NODES.map((node, i) => (
              <g key={`fast-node-${i}`}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.size + Math.sin((animationPhase * 1.8 + i * 35) * Math.PI / 180) * 0.3}
                  fill="url(#fastGradient)"
                  opacity={0.6 + Math.sin((animationPhase * 1.5 + i * 30) * Math.PI / 180) * 0.4}
                />
                {/* Occasional spark effect */}
                {Math.sin((animationPhase + i * 60) * Math.PI / 180) > 0.95 && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.size * 2}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="0.5"
                    opacity="0.6"
                  />
                )}
              </g>
            ))}
          </g>

          {/* Labels */}
          <text x="85" y="35" fill="#22d3ee" fontSize="9" fontWeight="500" opacity="0.8">FAST</text>
          <text x="170" y="225" fill="#a78bfa" fontSize="9" fontWeight="500" opacity="0.8">SLOW</text>
        </svg>

        {/* Pulse overlay when fast delta positive */}
        {fastPulse && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-cyan-500/5 animate-ping" style={{ animationDuration: "2s" }} />
          </div>
        )}

        {/* Breathing glow when slow delta positive */}
        {slowGlow && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div 
              className="w-32 h-32 rounded-full bg-violet-500/10 animate-pulse" 
              style={{ animationDuration: "3s" }} 
            />
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-px bg-border/20">
        {/* Fast Thinking Card */}
        <div className="p-4 bg-[#08090d]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Fast Thinking
            </span>
          </div>
          
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-semibold text-foreground">{fastScore}</span>
            <div className="flex items-center gap-1">
              <DeltaIndicator delta={fastDelta} />
              <span className="text-xs"><DeltaText delta={fastDelta} /></span>
            </div>
          </div>
          
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Intuitive, rapid, pattern-based responses. Driven by selective attention and perceptual efficiency.
          </p>
        </div>

        {/* Slow Thinking Card */}
        <div className="p-4 bg-[#08090d]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Slow Thinking
            </span>
          </div>
          
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-semibold text-foreground">{slowScore}</span>
            <div className="flex items-center gap-1">
              <DeltaIndicator delta={slowDelta} />
              <span className="text-xs"><DeltaText delta={slowDelta} /></span>
            </div>
          </div>
          
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Deliberate, rule-based reasoning. Powered by executive control and structured thinking.
          </p>
        </div>
      </div>

      {/* Scientific disclaimer */}
      <div className="px-4 py-2 bg-[#05070B] border-t border-border/10">
        <p className="text-[8px] text-muted-foreground/60 text-center leading-relaxed">
          Fast and Slow Thinking Networks represent functional cognitive systems based on Kahneman's dual-process theory. 
          This visualization is derived from your training data, not from neuroimaging.
        </p>
      </div>
    </div>
  );
}
