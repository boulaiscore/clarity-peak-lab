import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Zap, Brain, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";

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
  const connections: { x1: number; y1: number; x2: number; y2: number; length: number }[] = [];
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
          y2: nodes[j].y,
          length: dist
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
  const [activeNodes, setActiveNodes] = useState<{fast: number[], slow: number[]}>({ fast: [], slow: [] });

  const fastConnections = useMemo(() => generateConnections(FAST_NODES, 0.5), []);
  const slowConnections = useMemo(() => generateConnections(SLOW_NODES, 0.5), []);

  // Continuous animation with faster update for smoother effect
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(p => (p + 2) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Random node activation for "thinking" effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Activate random fast nodes (more frequent for System 1)
      const newFastActive = Array.from({ length: 4 }, () => 
        Math.floor(Math.random() * FAST_NODES.length)
      );
      // Activate random slow nodes (less frequent for System 2)
      const newSlowActive = Array.from({ length: 2 }, () => 
        Math.floor(Math.random() * SLOW_NODES.length)
      );
      setActiveNodes({ fast: newFastActive, slow: newSlowActive });
    }, 400);
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
    <div className="py-2">
      <h3 className="label-uppercase text-center mb-3">Dual-Process Integration</h3>
      
      {/* SVG Brain Map - Split Brain */}
      <div className="relative h-[220px] w-full overflow-hidden rounded-xl">
        <svg 
          viewBox="0 0 300 160" 
          className="w-full h-full"
          style={{ background: "radial-gradient(ellipse at center, hsl(var(--muted)/0.3) 0%, transparent 100%)" }}
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
            stroke="hsl(var(--border))"
            strokeWidth="1.5"
            opacity="0.3"
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
            stroke="hsl(var(--border))"
            strokeWidth="1.5"
            opacity="0.3"
          />
          
          {/* Center division line */}
          <line
            x1="150" y1="25"
            x2="150" y2="130"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.3"
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
            {/* Fast connections with traveling pulse */}
            {fastConnections.map((conn, i) => {
              const pulseProgress = ((animationPhase * 3 + i * 40) % 360) / 360;
              return (
                <g key={`fast-conn-${i}`}>
                  {/* Base connection */}
                  <line
                    x1={conn.x1}
                    y1={conn.y1}
                    x2={conn.x2}
                    y2={conn.y2}
                    stroke="url(#fastGradient)"
                    strokeWidth="0.8"
                    opacity={0.3 + Math.sin((animationPhase * 2 + i * 20) * Math.PI / 180) * 0.2}
                  />
                  {/* Traveling pulse dot */}
                  <circle
                    cx={conn.x1 + (conn.x2 - conn.x1) * pulseProgress}
                    cy={conn.y1 + (conn.y2 - conn.y1) * pulseProgress}
                    r={1}
                    fill="#fbbf24"
                    opacity={0.8}
                  />
                </g>
              );
            })}
            
            {/* Fast nodes with activation effect */}
            {FAST_NODES.map((node, i) => {
              const isActive = activeNodes.fast.includes(i);
              const baseSize = node.size + Math.sin((animationPhase * 2 + i * 35) * Math.PI / 180) * 0.5;
              return (
                <g key={`fast-node-${i}`}>
                  {/* Outer glow ring when active */}
                  {isActive && (
                    <>
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={baseSize * 3}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="0.5"
                        opacity="0.3"
                      >
                        <animate
                          attributeName="r"
                          values={`${baseSize * 1.5};${baseSize * 4};${baseSize * 1.5}`}
                          dur="0.6s"
                          repeatCount="1"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.6;0;0.6"
                          dur="0.6s"
                          repeatCount="1"
                        />
                      </circle>
                    </>
                  )}
                  {/* Main node */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isActive ? baseSize * 1.5 : baseSize}
                    fill="url(#fastGradient)"
                    opacity={isActive ? 1 : 0.7 + Math.sin((animationPhase * 1.5 + i * 30) * Math.PI / 180) * 0.3}
                  >
                    {isActive && (
                      <animate
                        attributeName="r"
                        values={`${baseSize * 1.5};${baseSize * 1.8};${baseSize * 1.5}`}
                        dur="0.3s"
                        repeatCount="1"
                      />
                    )}
                  </circle>
                  {/* Spark effect */}
                  {Math.sin((animationPhase + i * 60) * Math.PI / 180) > 0.95 && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.size * 2.5}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="0.5"
                      opacity="0.6"
                    />
                  )}
                </g>
              );
            })}
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
            {/* Slow connections with wave effect */}
            {slowConnections.map((conn, i) => {
              const waveOffset = ((animationPhase + i * 25) % 360) / 360;
              const waveOpacity = 0.3 + Math.sin(waveOffset * Math.PI * 2) * 0.4;
              return (
                <g key={`slow-conn-${i}`}>
                  {/* Base connection with breathing effect */}
                  <line
                    x1={conn.x1}
                    y1={conn.y1}
                    x2={conn.x2}
                    y2={conn.y2}
                    stroke="url(#slowGradient)"
                    strokeWidth={1.2 + Math.sin((animationPhase + i * 30) * Math.PI / 180) * 0.4}
                    opacity={waveOpacity}
                  />
                </g>
              );
            })}
            
            {/* Slow nodes with deep pulse */}
            {SLOW_NODES.map((node, i) => {
              const isActive = activeNodes.slow.includes(i);
              const baseSize = node.size + Math.sin((animationPhase * 0.8 + i * 40) * Math.PI / 180) * 0.6;
              return (
                <g key={`slow-node-${i}`}>
                  {/* Concentric rings when active */}
                  {isActive && (
                    <>
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={baseSize * 2}
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="0.8"
                        opacity="0.4"
                      >
                        <animate
                          attributeName="r"
                          values={`${baseSize};${baseSize * 4};${baseSize}`}
                          dur="1.2s"
                          repeatCount="1"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.5;0;0.5"
                          dur="1.2s"
                          repeatCount="1"
                        />
                      </circle>
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={baseSize * 1.5}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="0.5"
                        opacity="0.3"
                      >
                        <animate
                          attributeName="r"
                          values={`${baseSize * 0.8};${baseSize * 3};${baseSize * 0.8}`}
                          dur="1s"
                          repeatCount="1"
                        />
                      </circle>
                    </>
                  )}
                  {/* Main node */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isActive ? baseSize * 1.3 : baseSize}
                    fill="url(#slowGradient)"
                    opacity={isActive ? 1 : 0.7 + Math.sin((animationPhase * 0.7 + i * 25) * Math.PI / 180) * 0.3}
                  />
                </g>
              );
            })}
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

      {/* Three Evaluation Bands: Fast, Slow, Balance */}
      {(() => {
        // Band classification for individual scores (0-100)
        const getScoreBand = (score: number, type: "fast" | "slow") => {
          const labels = type === "fast" 
            ? { high: "Sharp", mid: "Reactive", low: "Building" }
            : { high: "Deep", mid: "Analytical", low: "Building" };
          
          if (score >= 70) return {
            band: labels.high,
            color: type === "fast" ? "text-amber-400" : "text-cyan-400",
            comment: type === "fast" 
              ? "Quick pattern recognition and intuitive responses."
              : "Strong deliberate reasoning and analysis."
          };
          if (score >= 50) return {
            band: labels.mid,
            color: type === "fast" ? "text-amber-300" : "text-cyan-300",
            comment: type === "fast"
              ? "Developing rapid intuition."
              : "Growing analytical depth."
          };
          return {
            band: labels.low,
            color: "text-muted-foreground",
            comment: type === "fast"
              ? "Intuitive responses need training."
              : "Deliberate reasoning needs practice."
          };
        };
        
        // Balance evaluation (difference between systems)
        const diff = Math.abs(fastScore - slowScore);
        const getBalanceBand = () => {
          if (diff <= 10) return {
            band: "Balanced",
            color: "text-emerald-400",
            comment: "Both systems work in harmony."
          };
          if (diff <= 25) return {
            band: "Slight tilt",
            color: "text-blue-400",
            comment: fastScore > slowScore 
              ? "Intuition slightly leads analysis."
              : "Analysis slightly leads intuition."
          };
          return {
            band: "Imbalanced",
            color: "text-amber-400",
            comment: fastScore > slowScore
              ? "Intuition dominates. Train deliberate reasoning."
              : "Analysis dominates. Train rapid pattern recognition."
          };
        };
        
        const fastBand = getScoreBand(fastScore, "fast");
        const slowBand = getScoreBand(slowScore, "slow");
        const balanceBand = getBalanceBand();
        
        return (
          <div className="mt-3 space-y-2">
            {/* Fast Band */}
            <motion.div 
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/15"
            >
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-amber-400/70" />
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground">System 1</span>
                </div>
                <span className={cn("text-[10px] font-semibold", fastBand.color)}>{fastBand.band}</span>
              </div>
              <p className="text-[9px] text-muted-foreground/70 leading-relaxed">{fastBand.comment}</p>
            </motion.div>
            
            {/* Slow Band */}
            <motion.div 
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/15"
            >
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5">
                  <Brain className="w-3 h-3 text-cyan-400/70" />
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground">System 2</span>
                </div>
                <span className={cn("text-[10px] font-semibold", slowBand.color)}>{slowBand.band}</span>
              </div>
              <p className="text-[9px] text-muted-foreground/70 leading-relaxed">{slowBand.comment}</p>
            </motion.div>
            
            {/* Balance Band */}
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-2 rounded-lg bg-muted/30 border border-border/30"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Balance</span>
                <span className={cn("text-[10px] font-semibold", balanceBand.color)}>{balanceBand.band}</span>
              </div>
              <p className="text-[9px] text-muted-foreground/70 leading-relaxed">{balanceBand.comment}</p>
            </motion.div>
          </div>
        );
      })()}

      {/* Scientific disclaimer */}
      <p className="text-[8px] text-muted-foreground/60 text-center leading-relaxed mt-2">
        Functional cognitive systems based on Kahneman's dual-process theory.
      </p>
    </div>
  );
}