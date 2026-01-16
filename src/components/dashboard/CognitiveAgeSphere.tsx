import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/hooks/useTheme";

interface CognitiveAgeSphereProps {
  cognitiveAge: number;
  delta: number;
  chronologicalAge?: number;
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulsePhase: number;
  connections: number[];
  baseX: number;
  baseY: number;
}

export function CognitiveAgeSphere({ cognitiveAge, delta, chronologicalAge }: CognitiveAgeSphereProps) {
  const [animatedAge, setAnimatedAge] = useState(cognitiveAge);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const duration = 1500;
    const start = performance.now();
    const startAge = animatedAge;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedAge(startAge + (cognitiveAge - startAge) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [cognitiveAge]);

  // Neural network animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDarkMode = theme === "dark";
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const sphereRadius = 85;

    // Colors matching the reference image
    // Cyan/teal for connections
    const connectionColor = { h: 195, s: 80, l: isDarkMode ? 60 : 50 };
    // Warm orange/amber for node cores
    const nodeColor = { h: 35, s: 100, l: 60 };

    // Create nodes arranged in a spherical pattern
    const nodes: Node[] = [];
    const nodeCount = 30;
    
    // Create nodes distributed around a sphere
    for (let i = 0; i < nodeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radiusVariation = 0.4 + Math.random() * 0.55;
      const r = sphereRadius * radiusVariation;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      
      nodes.push({
        x,
        y,
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        radius: 2 + Math.random() * 2.5,
        pulsePhase: Math.random() * Math.PI * 2,
        connections: [],
      });
    }

    // Create connections between nearby nodes
    const connectionDistance = 55;
    nodes.forEach((node, i) => {
      nodes.forEach((other, j) => {
        if (i >= j) return;
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < connectionDistance && Math.random() < 0.5) {
          node.connections.push(j);
        }
      });
    });

    let animationId: number;
    let time = 0;

    const draw = () => {
      time += 0.015;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw outer sphere border (pulsing)
      const pulseRadius = sphereRadius + Math.sin(time * 0.5) * 2;
      
      // Outer glow ring
      const outerGlow = ctx.createRadialGradient(
        centerX, centerY, pulseRadius - 15,
        centerX, centerY, pulseRadius + 20
      );
      outerGlow.addColorStop(0, `hsla(${connectionColor.h}, ${connectionColor.s}%, ${connectionColor.l}%, 0)`);
      outerGlow.addColorStop(0.5, `hsla(${connectionColor.h}, ${connectionColor.s}%, ${connectionColor.l}%, ${isDarkMode ? 0.15 : 0.1})`);
      outerGlow.addColorStop(0.8, `hsla(${connectionColor.h}, ${connectionColor.s}%, ${connectionColor.l}%, ${isDarkMode ? 0.08 : 0.05})`);
      outerGlow.addColorStop(1, `hsla(${connectionColor.h}, ${connectionColor.s}%, ${connectionColor.l}%, 0)`);
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius + 15, 0, Math.PI * 2);
      ctx.fillStyle = outerGlow;
      ctx.fill();

      // Sphere border ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${connectionColor.h}, ${connectionColor.s}%, ${connectionColor.l}%, ${isDarkMode ? 0.4 : 0.3})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Update node positions with gentle floating
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        // Pull back towards base position
        const dx = node.baseX - node.x;
        const dy = node.baseY - node.y;
        node.vx += dx * 0.008;
        node.vy += dy * 0.008;

        // Damping
        node.vx *= 0.98;
        node.vy *= 0.98;
      });

      // Draw connections first (behind nodes) - cyan/teal color
      nodes.forEach((node, i) => {
        node.connections.forEach((j) => {
          const other = nodes[j];
          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Pulsing opacity on connections
          const pulse = 0.2 + Math.sin(time * 1.5 + node.pulsePhase) * 0.15;
          const opacity = Math.max(0, pulse * (1 - dist / connectionDistance));
          
          // Draw connection line with glow
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `hsla(${connectionColor.h}, ${connectionColor.s}%, ${connectionColor.l}%, ${opacity * 0.8})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Add traveling pulse effect along connections
          const pulsePos = (time * 0.3 + i * 0.2) % 1;
          const px = node.x + dx * pulsePos;
          const py = node.y + dy * pulsePos;
          
          const pulseGradient = ctx.createRadialGradient(px, py, 0, px, py, 3);
          pulseGradient.addColorStop(0, `hsla(${nodeColor.h}, ${nodeColor.s}%, ${nodeColor.l}%, ${opacity * 0.5})`);
          pulseGradient.addColorStop(1, `hsla(${nodeColor.h}, ${nodeColor.s}%, ${nodeColor.l}%, 0)`);
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = pulseGradient;
          ctx.fill();
        });
      });

      // Draw nodes (neurons) - warm orange/amber glow
      nodes.forEach((node) => {
        const pulse = Math.sin(time * 2 + node.pulsePhase);
        const currentRadius = node.radius * (0.85 + pulse * 0.25);
        const glowIntensity = 0.6 + pulse * 0.3;

        // Outer glow (large, soft) - orange tint
        const outerNodeGlow = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, currentRadius * 6
        );
        outerNodeGlow.addColorStop(0, `hsla(${nodeColor.h}, ${nodeColor.s}%, ${nodeColor.l}%, ${0.25 * glowIntensity})`);
        outerNodeGlow.addColorStop(0.4, `hsla(${nodeColor.h}, ${nodeColor.s}%, ${nodeColor.l - 10}%, ${0.1 * glowIntensity})`);
        outerNodeGlow.addColorStop(1, `hsla(${nodeColor.h}, ${nodeColor.s}%, ${nodeColor.l}%, 0)`);
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius * 6, 0, Math.PI * 2);
        ctx.fillStyle = outerNodeGlow;
        ctx.fill();

        // Middle glow
        const middleGlow = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, currentRadius * 3
        );
        middleGlow.addColorStop(0, `hsla(${nodeColor.h}, ${nodeColor.s}%, ${nodeColor.l + 15}%, ${0.6 * glowIntensity})`);
        middleGlow.addColorStop(0.5, `hsla(${nodeColor.h}, ${nodeColor.s}%, ${nodeColor.l}%, ${0.3 * glowIntensity})`);
        middleGlow.addColorStop(1, `hsla(${nodeColor.h}, ${nodeColor.s}%, ${nodeColor.l}%, 0)`);
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius * 3, 0, Math.PI * 2);
        ctx.fillStyle = middleGlow;
        ctx.fill();

        // Inner bright core - white/yellow hot
        const coreGlow = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, currentRadius * 1.2
        );
        coreGlow.addColorStop(0, `hsla(45, 100%, 95%, ${0.95 * glowIntensity})`);
        coreGlow.addColorStop(0.3, `hsla(${nodeColor.h}, 100%, 75%, ${0.8 * glowIntensity})`);
        coreGlow.addColorStop(1, `hsla(${nodeColor.h}, ${nodeColor.s}%, ${nodeColor.l}%, 0)`);
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = coreGlow;
        ctx.fill();

        // White hot center point
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(50, 100%, 98%, ${0.9 * glowIntensity})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [theme]);

  // Calculate delta text
  const deltaYears = Math.abs(delta);
  const deltaText = delta < 0
    ? `${deltaYears.toFixed(0)}y younger than baseline`
    : delta > 0
    ? `${deltaYears.toFixed(0)}y older than baseline`
    : "at baseline";

  return (
    <div className="py-2">
      <h3 className="label-uppercase text-center mb-3">Cognitive Age</h3>
      
      <div className="relative flex flex-col items-center justify-center">
        {/* Main sphere container */}
        <div className="relative">
          {/* Canvas for neural network */}
          <canvas
            ref={canvasRef}
            width={220}
            height={220}
            className="absolute -inset-[10px]"
          />

          {/* Content overlay */}
          <div className="relative w-[200px] h-[200px] rounded-full flex flex-col items-center justify-center">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-semibold text-foreground number-display">
                {Math.round(animatedAge)}
              </span>
              <span className="text-sm text-muted-foreground">years</span>
            </div>
            <span className="text-sm font-medium mt-1 text-muted-foreground">
              {deltaText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
