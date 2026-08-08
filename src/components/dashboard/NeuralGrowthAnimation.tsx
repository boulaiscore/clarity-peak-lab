import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Info, Zap, Target, Moon, ArrowRight, HelpCircle } from "lucide-react";
import { SystemOneMark } from "@/components/icons/ThinkingSystemIcons";
import { getStandardMetricStatus, type MetricLevel } from "@/lib/metricStatusLabels";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SCIBreakdown, BottleneckResult } from "@/lib/cognitiveNetworkScore";

interface NeuralGrowthAnimationProps {
  cognitiveAgeDelta: number;
  overallCognitiveScore: number;
  sciBreakdown?: SCIBreakdown | null;
  statusText?: string;
  bottleneck?: BottleneckResult | null;
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  connections: number[];
  pulsePhase: number;
  active: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

/**
 * Neural Strength Animation
 * Displays network activation with Intensity, Consistency, Recovery (gym metaphor)
 */
export function NeuralGrowthAnimation({ 
  cognitiveAgeDelta, 
  overallCognitiveScore, 
  sciBreakdown,
  statusText: customStatusText,
  bottleneck
}: NeuralGrowthAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  // Shared state-oriented language for the 0–100 Performance Network signal.
  const getScoreBand = (score: number): {
    band: string;
    range: string;
    color: string;
    bgColor: string;
    description: string;
  } => {
    if (score >= 80) return {
      band: "Strong",
      range: "80-100",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/20",
      description: "Strong current signal. Maintain it through balanced practice and recovery."
    };
    if (score >= 65) return {
      band: "Ready",
      range: "65-79",
      color: "text-primary",
      bgColor: "bg-primary/20",
      description: "Supportive current conditions for focused cognitive work."
    };
    if (score >= 50) return {
      band: "Steady",
      range: "50-64",
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      description: "A steady personal signal with room to move through practice and recovery."
    };
    if (score >= 35) return {
      band: "Building",
      range: "35-49",
      color: "text-amber-400",
      bgColor: "bg-amber-500/20",
      description: "A building phase in your current personal trend."
    };
    return {
      band: "Starting point",
      range: "0-34",
      color: "text-muted-foreground",
      bgColor: "bg-muted/20",
      description: "A current starting point, not a fixed limit. Consistency adds useful evidence."
    };
  };

  // Phase-based status (for backwards compatibility)
  const getPhaseInfo = (score: number) => {
    const band = getScoreBand(score);
    return { phase: band.band, description: band.description };
  };

  const getStateColor = (level: MetricLevel) => {
    if (level === "high") return "text-emerald-500";
    if (level === "good" || level === "moderate") return "text-primary";
    if (level === "low") return "text-amber-400";
    return "text-muted-foreground/60";
  };

  // Cognitive and Recovery components use the same qualitative scale as every 0–100 metric.
  const getStateStatus = (score: number) => {
    const status = getStandardMetricStatus(score);
    return { label: status.label, color: getStateColor(status.level) };
  };

  // Get Training Load status (from weekly games XP)
  const getTrainingLoadStatus = (score: number) => {
    if (score >= 70) return { label: "On target", color: "text-emerald-500" };
    if (score >= 40) return { label: "Building", color: "text-amber-400" };
    return { label: "Ready to begin", color: "text-muted-foreground/60" };
  };

  const scoreBand = getScoreBand(overallCognitiveScore);
  const phaseInfo = getPhaseInfo(overallCognitiveScore);
  const statusText = customStatusText || phaseInfo.phase;
  
  const thinkingStatus = sciBreakdown ? getStateStatus(sciBreakdown.cognitivePerformance.score) : { label: "—", color: "text-muted-foreground/60" };
  const trainingLoadStatus = sciBreakdown ? getTrainingLoadStatus(sciBreakdown.behavioralEngagement.score) : { label: "—", color: "text-muted-foreground/60" };
  const recoveryStatus = sciBreakdown ? getStateStatus(sciBreakdown.recoveryFactor.score) : { label: "—", color: "text-muted-foreground/60" };

  // Map metrics to visual intensity
  const isYounger = cognitiveAgeDelta < 0;
  const intensity = Math.min(1, Math.max(0.2, overallCognitiveScore / 100));
  const nodeCount = Math.floor(15 + intensity * 25);
  const connectionDensity = 0.3 + intensity * 0.4;
  const glowIntensity = isYounger ? 0.8 : 0.4;
  
  // Dynamic animation parameters based on score
  const pulseSpeed = 1 + (overallCognitiveScore / 100) * 3;
  const glowRadius = 3 + (overallCognitiveScore / 100) * 3;
  const nodePulseAmplitude = 0.2 + (overallCognitiveScore / 100) * 0.5;
  const connectionPulseAmplitude = 0.2 + (overallCognitiveScore / 100) * 0.5;
  const showParticles = overallCognitiveScore >= 75;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Initialize nodes in a brain-like shape
    const nodes: Node[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radiusVariation = 0.4 + Math.random() * 0.5;
      const baseRadius = 60;
      const hemisphere = Math.random() > 0.5 ? 1 : -1;
      const x = centerX + Math.cos(angle) * baseRadius * radiusVariation * (0.8 + Math.random() * 0.4);
      const y = centerY + Math.sin(angle) * baseRadius * radiusVariation * 0.7 + hemisphere * 10;

      nodes.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        radius: 1.5 + Math.random() * 2,
        connections: [],
        pulsePhase: Math.random() * Math.PI * 2,
        active: Math.random() < intensity,
      });
    }

    // Create connections
    nodes.forEach((node, i) => {
      nodes.forEach((other, j) => {
        if (i >= j) return;
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 50 && Math.random() < connectionDensity) {
          node.connections.push(j);
        }
      });
    });

    // Initialize particles array
    const particles: Particle[] = [];
    const maxParticles = 20;
    let particleSpawnTimer = 0;

    let animationId: number;
    let time = 0;
    let lastFrameAt = 0;
    const frameInterval = 1000 / 30;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const spawnParticle = () => {
      if (particles.length >= maxParticles) return;
      
      const activeNodes = nodes.filter(n => n.active);
      if (activeNodes.length === 0) return;
      
      const sourceNode = activeNodes[Math.floor(Math.random() * activeNodes.length)];
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1;
      
      particles.push({
        x: sourceNode.x,
        y: sourceNode.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        life: 1,
        maxLife: 60 + Math.random() * 40,
        size: 1 + Math.random() * 2,
        hue: 155 + Math.random() * 30,
      });
    };

    const draw = (frameAt = 0) => {
      if (!reduceMotion && frameAt - lastFrameAt < frameInterval) {
        animationId = requestAnimationFrame(draw);
        return;
      }
      lastFrameAt = frameAt;
      time += 0.02 * pulseSpeed;
      ctx.clearRect(0, 0, width, height);

      // Spawn particles when score >= 75
      if (showParticles) {
        particleSpawnTimer++;
        if (particleSpawnTimer > 8) {
          spawnParticle();
          particleSpawnTimer = 0;
        }
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.01;
        p.life--;
        
        if (p.life <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
          particles.splice(i, 1);
          continue;
        }
        
        const lifeRatio = p.life / p.maxLife;
        const alpha = lifeRatio * 0.8;
        const currentSize = p.size * (0.5 + lifeRatio * 0.5);
        
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize * 3);
        gradient.addColorStop(0, `hsla(${p.hue}, 82%, 65%, ${alpha * 0.6})`);
        gradient.addColorStop(0.5, `hsla(${p.hue}, 82%, 55%, ${alpha * 0.3})`);
        gradient.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 82%, 70%, ${alpha})`;
        ctx.fill();
      }

      // Draw connections
      nodes.forEach((node, i) => {
        node.connections.forEach((j) => {
          const other = nodes[j];
          const bothActive = node.active && other.active;
          const pulse = Math.sin(time * 2 + node.pulsePhase) * connectionPulseAmplitude + (1 - connectionPulseAmplitude / 2);

          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = bothActive
            ? `hsla(165, 82%, 55%, ${0.15 + pulse * 0.25})`
            : `hsla(165, 30%, 50%, ${0.05 + pulse * 0.1})`;
          ctx.lineWidth = bothActive ? 1.2 : 0.6;
          ctx.stroke();
        });
      });

      // Draw nodes
      nodes.forEach((node) => {
        const pulse = Math.sin(time * 3 + node.pulsePhase) * nodePulseAmplitude + (1 - nodePulseAmplitude / 2);
        const currentRadius = node.radius * (0.8 + pulse * 0.4);

        // Node update
        node.x += node.vx;
        node.y += node.vy;

        // Soft boundary
        const dx = node.x - centerX;
        const dy = node.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 80) {
          node.vx -= dx * 0.001;
          node.vy -= dy * 0.001;
        }

        // Damping
        node.vx *= 0.99;
        node.vy *= 0.99;

        // Glow for active nodes
        if (node.active) {
          const glowGradient = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, currentRadius * glowRadius
          );
          glowGradient.addColorStop(0, `hsla(165, 82%, 55%, ${0.4 * glowIntensity})`);
          glowGradient.addColorStop(0.5, `hsla(165, 82%, 55%, ${0.15 * glowIntensity})`);
          glowGradient.addColorStop(1, "transparent");
          ctx.beginPath();
          ctx.arc(node.x, node.y, currentRadius * glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = glowGradient;
          ctx.fill();
        }

        // Node core
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = node.active
          ? `hsla(165, 82%, 55%, ${0.7 + pulse * 0.3})`
          : `hsla(165, 30%, 50%, ${0.3 + pulse * 0.2})`;
        ctx.fill();
      });

      if (!reduceMotion) animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [nodeCount, connectionDensity, glowIntensity, intensity, pulseSpeed, glowRadius, nodePulseAmplitude, connectionPulseAmplitude, showParticles]);

  return (
    <div className="py-2">
      <div className="relative flex justify-center">
        <canvas ref={canvasRef} width={200} height={160} className="opacity-90" />
      </div>
      
      <div className="mt-3 text-center">
        {/* Score */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-2xl font-bold text-primary">{overallCognitiveScore}</span>
          <span className="text-[10px] text-muted-foreground/60 uppercase">/ 100</span>
        </div>
        
        {/* Scientific Band Badge */}
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <span className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded ${scoreBand.bgColor} ${scoreBand.color}`}>
            {scoreBand.band}
          </span>
          <span className="text-[9px] text-muted-foreground/50">
            ({scoreBand.range})
          </span>
        </div>
        
        {/* Phase Description */}
        <p className="text-[10px] text-muted-foreground mt-1 px-4 leading-relaxed">
          {phaseInfo.description}
        </p>
        
        {/* Status Breakdown - What's shaping your strength */}
        {sciBreakdown && (
          <div className="mt-2 pt-2 border-t border-border/20">
            <p className="text-[9px] text-muted-foreground/70 uppercase tracking-wide mb-1.5">
              What's shaping today's signal
            </p>
            <div className="space-y-1 text-left px-3 pb-3">
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5">
                  <SystemOneMark className="w-3.5 h-3.5 text-primary/70" strokeWidth={1.4} />
                  <span className="text-muted-foreground">Fast + Slow Thinking</span>
                </div>
                <span className={thinkingStatus.color}>{thinkingStatus.label}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5">
                  <Target className="w-3 h-3 text-blue-400/60" />
                  <span className="text-muted-foreground">Cognitive Load</span>
                </div>
                <span className={trainingLoadStatus.color}>{trainingLoadStatus.label}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5">
                  <Moon className="w-3 h-3 text-purple-400/60" />
                  <span className="text-muted-foreground">Recovery</span>
                </div>
                <span className={recoveryStatus.color}>{recoveryStatus.label}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Most actionable lever in the current signal */}
        {bottleneck && bottleneck.potentialGain > 0 && (
          <div className="-mt-1 pt-2 border-t border-border/20">
            {/* Section Header */}
            <div className="flex items-center gap-1.5 mb-2 px-2">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-[9px] uppercase tracking-wider text-amber-400/90 font-semibold">
                Current opportunity
              </span>
            </div>
            
            <div 
              className={`mx-2 p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${
                bottleneck.variable === "recovery"
                  ? "bg-purple-500/5 border-purple-500/30 hover:border-purple-500/50"
                  : bottleneck.variable === "training"
                    ? "bg-blue-500/5 border-blue-500/30 hover:border-blue-500/50"
                    : "bg-primary/5 border-primary/30 hover:border-primary/50"
              }`}
              onClick={() => {
                if (bottleneck.variable === "thinking" || bottleneck.variable === "training") {
                  navigate("/neuro-lab");
                } else {
                  navigate("/app?tab=detox");
                }
              }}
            >
              {/* Clear, non-judgmental explanation and action */}
              <div className="flex items-start gap-2 mb-3">
                <div className={`p-1.5 rounded-full ${
                  bottleneck.variable === "recovery"
                    ? "bg-purple-500/20"
                    : bottleneck.variable === "training"
                      ? "bg-blue-500/20"
                      : "bg-primary/20"
                }`}>
                  {bottleneck.variable === "thinking" && <SystemOneMark className="w-4 h-4 text-primary" strokeWidth={1.4} />}
                  {bottleneck.variable === "training" && <Target className="w-4 h-4 text-blue-400" />}
                  {bottleneck.variable === "recovery" && <Moon className="w-4 h-4 text-purple-400" />}
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-medium text-foreground leading-snug">
                    {bottleneck.variable === "recovery" 
                      ? "Recovery is the clearest lever today."
                      : bottleneck.variable === "training"
                        ? "Recent practice is below your selected weekly rhythm."
                        : "One performance signal has more room to build."}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {bottleneck.variable === "recovery"
                      ? "Complete Detox or Walking sessions to boost it."
                      : bottleneck.variable === "training"
                        ? "Play more games to earn XP and level up."
                        : "Train in NeuroLab to sharpen your thinking."}
                  </p>
                </div>
              </div>
              
              {/* Progress Bar - Current vs Target */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-[9px] mb-1">
                  <span className="text-muted-foreground">Current</span>
                  <span className="text-muted-foreground">Scale: 0–100</span>
                </div>
                <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      bottleneck.variable === "recovery"
                        ? "bg-purple-400"
                        : bottleneck.variable === "training"
                          ? "bg-blue-400"
                          : "bg-primary"
                    }`}
                    style={{ width: `${Math.min(100, bottleneck.currentScore)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-[11px] font-bold ${
                    bottleneck.variable === "recovery"
                      ? "text-purple-400"
                      : bottleneck.variable === "training"
                        ? "text-blue-400"
                        : "text-primary"
                  }`}>
                    {bottleneck.currentScore}
                  </span>
                  <span className="text-[9px] text-muted-foreground/60">Personal trend</span>
                </div>
              </div>
              
              {/* Effort hint - contextual guidance */}
              <p className="text-[9px] text-muted-foreground/60 text-center mb-3 italic">
                {bottleneck.variable === "recovery"
                  ? "Detox & walking contribute 20% of your total score"
                  : bottleneck.variable === "training"
                    ? "Games XP this week contributes 30% of your total score"
                    : "Skill scores contribute 50% of your total score"}
              </p>
              
              {/* CTA Button */}
              <button
                onClick={() => navigate(bottleneck.variable === "recovery" ? "/detox-session" : "/neuro-lab")}
                className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  bottleneck.variable === "recovery"
                    ? "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                    : bottleneck.variable === "training"
                      ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                      : "bg-primary/20 text-primary hover:bg-primary/30"
                }`}
              >
                {bottleneck.variable === "recovery" 
                  ? "Start Detox Session"
                  : "Go to Lab"}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
        
        
        {/* Interpretation guardrail */}
        <p className="text-[9px] text-muted-foreground/50 mt-4 px-4 italic">
          A personal trend from practice, consistency and recovery — not an intelligence measure.
        </p>
        
        {/* Learn More button opens detailed explanation */}
        <Dialog>
          <DialogTrigger asChild>
            <button className="mt-3 inline-flex items-center gap-1 text-[10px] text-muted-foreground/70 hover:text-primary transition-colors">
              <Info className="w-3 h-3" />
              Learn more
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-sm max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="text-base">Performance Network</DialogTitle>
              <p className="text-xs text-muted-foreground">
                How your reasoning and intuition grow over time.
              </p>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(85vh-80px)] pr-2">
              <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <p>
                  Performance Network (SCI) blends four sub-skills — Focus Stability, Fast Thinking,
                  Reasoning Accuracy and Slow Thinking — weighted by their contribution to your
                  Reasoning Quality.
                </p>
                {sciBreakdown && (
                  <ul className="space-y-1.5">
                    <li className="flex justify-between"><span>Focus Stability</span><span className="text-foreground">{Math.round(sciBreakdown.cognitivePerformance.components.AE)}</span></li>
                    <li className="flex justify-between"><span>Fast Thinking</span><span className="text-foreground">{Math.round(sciBreakdown.cognitivePerformance.components.RA)}</span></li>
                    <li className="flex justify-between"><span>Reasoning Accuracy</span><span className="text-foreground">{Math.round(sciBreakdown.cognitivePerformance.components.CT)}</span></li>
                    <li className="flex justify-between"><span>Slow Thinking</span><span className="text-foreground">{Math.round(sciBreakdown.cognitivePerformance.components.IN)}</span></li>
                  </ul>
                )}
                <p>
                  Train consistently across both System 1 and System 2 games to grow this score.
                </p>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
