import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SCIExplanation } from "./SCIExplanation";
import type { SCIBreakdown } from "@/lib/cognitiveNetworkScore";

interface NeuralGrowthAnimationProps {
  cognitiveAgeDelta: number;
  overallCognitiveScore: number;
  sciBreakdown?: SCIBreakdown | null;
  statusText?: string;
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

export function NeuralGrowthAnimation({ 
  cognitiveAgeDelta, 
  overallCognitiveScore, 
  sciBreakdown,
  statusText: customStatusText 
}: NeuralGrowthAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Map metrics to visual intensity - more dramatic scaling based on score
  const isYounger = cognitiveAgeDelta < 0;
  const intensity = Math.min(1, Math.max(0.2, overallCognitiveScore / 100));
  const nodeCount = Math.floor(15 + intensity * 25);
  const connectionDensity = 0.3 + intensity * 0.4;
  const glowIntensity = isYounger ? 0.8 : 0.4;
  
  // Dynamic animation parameters based on score
  const pulseSpeed = 1 + (overallCognitiveScore / 100) * 3; // 1x to 4x speed
  const glowRadius = 3 + (overallCognitiveScore / 100) * 3; // 3 to 6 multiplier
  const nodePulseAmplitude = 0.2 + (overallCognitiveScore / 100) * 0.5; // 0.2 to 0.7
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
      // Create nodes in a more organic, brain-like distribution
      const angle = Math.random() * Math.PI * 2;
      const radiusVariation = 0.4 + Math.random() * 0.5;
      const baseRadius = 60;

      // Create two hemispheres
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

    // Initialize particles array (only used when score >= 75)
    const particles: Particle[] = [];
    const maxParticles = 20;
    let particleSpawnTimer = 0;

    let animationId: number;
    let time = 0;

    const spawnParticle = () => {
      if (particles.length >= maxParticles) return;
      
      // Spawn from a random active node
      const activeNodes = nodes.filter(n => n.active);
      if (activeNodes.length === 0) return;
      
      const sourceNode = activeNodes[Math.floor(Math.random() * activeNodes.length)];
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1;
      
      particles.push({
        x: sourceNode.x,
        y: sourceNode.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5, // Slight upward bias
        life: 1,
        maxLife: 60 + Math.random() * 40,
        size: 1 + Math.random() * 2,
        hue: 155 + Math.random() * 30, // Teal to cyan range
      });
    };

    const draw = () => {
      time += 0.02 * pulseSpeed; // Speed scales with score
      ctx.clearRect(0, 0, width, height);

      // Spawn particles when score >= 75
      if (showParticles) {
        particleSpawnTimer++;
        if (particleSpawnTimer > 8) { // Spawn every ~8 frames
          spawnParticle();
          particleSpawnTimer = 0;
        }
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.01; // Slight upward drift
        p.life--;
        
        if (p.life <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
          particles.splice(i, 1);
          continue;
        }
        
        const lifeRatio = p.life / p.maxLife;
        const alpha = lifeRatio * 0.8;
        const currentSize = p.size * (0.5 + lifeRatio * 0.5);
        
        // Draw particle glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize * 3);
        gradient.addColorStop(0, `hsla(${p.hue}, 82%, 65%, ${alpha * 0.6})`);
        gradient.addColorStop(0.5, `hsla(${p.hue}, 82%, 55%, ${alpha * 0.3})`);
        gradient.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw particle core
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

          // Pulsing effect on connections - more intense with higher score
          const pulse = Math.sin(time * 2 + node.pulsePhase) * connectionPulseAmplitude + (1 - connectionPulseAmplitude / 2);
          const alpha = bothActive ? (0.1 + intensity * 0.2) * pulse * glowIntensity : 0.05;

          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `hsla(165, 82%, 51%, ${alpha})`;
          ctx.lineWidth = bothActive ? 1 + intensity * 1.5 : 0.5;
          ctx.stroke();
        });
      });

      // Draw nodes
      nodes.forEach((node) => {
        // Move nodes slightly - faster movement with higher score
        node.x += node.vx * (0.8 + intensity * 0.4);
        node.y += node.vy * (0.8 + intensity * 0.4);

        // Bounce off boundaries
        const margin = 20;
        if (node.x < margin || node.x > width - margin) node.vx *= -1;
        if (node.y < margin || node.y > height - margin) node.vy *= -1;

        // Pulse effect - more dramatic amplitude with higher score
        const pulse = Math.sin(time * 3 + node.pulsePhase) * nodePulseAmplitude + (1 - nodePulseAmplitude / 2);
        const nodeIntensity = node.active ? pulse * glowIntensity * (0.8 + intensity * 0.4) : 0.3;

        // Glow - larger radius with higher score
        if (node.active) {
          const dynamicGlowRadius = node.radius * glowRadius;
          const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, dynamicGlowRadius);
          gradient.addColorStop(0, `hsla(165, 82%, 51%, ${nodeIntensity * (0.4 + intensity * 0.3)})`);
          gradient.addColorStop(0.5, `hsla(165, 82%, 51%, ${nodeIntensity * 0.2})`);
          gradient.addColorStop(1, "transparent");
          ctx.beginPath();
          ctx.arc(node.x, node.y, dynamicGlowRadius, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        // Node core - more vibrant with higher score
        const corePulse = node.active ? pulse * (0.9 + intensity * 0.3) : 0.7;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * corePulse, 0, Math.PI * 2);
        ctx.fillStyle = node.active 
          ? `hsla(165, 82%, ${45 + pulse * 25 + intensity * 10}%, ${nodeIntensity})` 
          : "hsla(0, 0%, 40%, 0.4)";
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [nodeCount, connectionDensity, glowIntensity, intensity, pulseSpeed, glowRadius, nodePulseAmplitude, connectionPulseAmplitude, showParticles]);

  // Phase-based status and description
  const getPhaseInfo = (score: number) => {
    if (score >= 80) return { 
      phase: "Elite cognitive integration",
      description: "Your cognitive network is highly integrated and stable."
    };
    if (score >= 65) return { 
      phase: "High strategic clarity",
      description: "Your skills are consolidating into a coherent network."
    };
    if (score >= 50) return { 
      phase: "Developing strategic capacity",
      description: "Your network is building momentum through consistent effort."
    };
    if (score >= 35) return { 
      phase: "Building cognitive foundation",
      description: "Your cognitive skills are developing, connections are forming."
    };
    return { 
      phase: "Early activation phase",
      description: "Your cognitive skills are activating, but the network is not yet stable."
    };
  };

  const phaseInfo = getPhaseInfo(overallCognitiveScore);
  const statusText = customStatusText || phaseInfo.phase;

  // Component status helpers
  const getComponentStatus = (score: number) => {
    if (score >= 50) return { label: "Active", color: "text-primary" };
    if (score >= 20) return { label: "Developing", color: "text-amber-400" };
    return { label: "Missing", color: "text-muted-foreground/60" };
  };

  const performanceStatus = sciBreakdown ? getComponentStatus(sciBreakdown.cognitivePerformance.score) : { label: "—", color: "text-muted-foreground/60" };
  const engagementStatus = sciBreakdown ? getComponentStatus(sciBreakdown.behavioralEngagement.score) : { label: "—", color: "text-muted-foreground/60" };
  const recoveryStatus = sciBreakdown ? getComponentStatus(sciBreakdown.recoveryFactor.score) : { label: "—", color: "text-muted-foreground/60" };

  return (
    <div className="py-2">
      <h3 className="label-uppercase text-center mb-3">Cognitive Network</h3>
      
      <div className="relative flex justify-center">
        <canvas ref={canvasRef} width={200} height={160} className="opacity-90" />
      </div>
      
      <div className="mt-3 text-center">
        {/* Score */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-2xl font-bold text-primary">{overallCognitiveScore}</span>
          <span className="text-[10px] text-muted-foreground/60 uppercase">/ 100</span>
        </div>
        <p className="text-[11px] text-primary font-medium">{statusText}</p>
        
        {/* Phase Description */}
        <p className="text-[10px] text-muted-foreground mt-1.5 px-4 leading-relaxed">
          {phaseInfo.description}
        </p>
        
        {/* Status Breakdown - What's shaping your network */}
        {sciBreakdown && (
          <div className="mt-3 pt-3 border-t border-border/20">
            <p className="text-[9px] text-muted-foreground/70 uppercase tracking-wide mb-2">
              What's shaping your network
            </p>
            <div className="space-y-1.5 text-left px-3">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Performance</span>
                <span className={performanceStatus.color}>{performanceStatus.label}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Engagement</span>
                <span className={engagementStatus.color}>{engagementStatus.label}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Recovery</span>
                <span className={recoveryStatus.color}>{recoveryStatus.label}</span>
              </div>
            </div>
            
            {/* Synthesis Line */}
            <p className="text-[9px] text-muted-foreground/70 mt-3 px-2 italic">
              The network grows when training, consistency, and recovery work together.
            </p>
          </div>
        )}
        
        {/* Current Components - 3-column grid */}
        {sciBreakdown && (
          <div className="mt-3 pt-3 border-t border-border/20">
            <div className="grid grid-cols-3 gap-2 text-[9px]">
              <div className="text-center">
                <div className="text-muted-foreground/60 uppercase mb-0.5">Performance</div>
                <div className="font-semibold text-primary">{sciBreakdown.cognitivePerformance.score}</div>
                <div className="text-muted-foreground/50 text-[8px] mt-0.5">Skill activation</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground/60 uppercase mb-0.5">Engagement</div>
                <div className="font-semibold text-blue-400">{sciBreakdown.behavioralEngagement.score}</div>
                <div className="text-muted-foreground/50 text-[8px] mt-0.5">Consistency</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground/60 uppercase mb-0.5">Recovery</div>
                <div className="font-semibold text-purple-400">{sciBreakdown.recoveryFactor.score}</div>
                <div className="text-muted-foreground/50 text-[8px] mt-0.5">Restoration</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Action Guidance */}
        <div className="mt-3 pt-3 border-t border-border/20 text-left px-3">
          <p className="text-[9px] text-muted-foreground/70 uppercase tracking-wide mb-2">
            To strengthen your network
          </p>
          <ul className="text-[10px] text-muted-foreground space-y-1">
            <li>• Train to activate skills</li>
            <li>• Add consistency across the week</li>
            <li>• Prioritize recovery for consolidation</li>
          </ul>
        </div>
        
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
              <DialogTitle className="text-base">Cognitive Network</DialogTitle>
              <p className="text-xs text-muted-foreground">
                How your cognitive skills integrate and stabilize over time.
              </p>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(85vh-80px)] pr-2">
              <SCIExplanation sciBreakdown={sciBreakdown} />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
