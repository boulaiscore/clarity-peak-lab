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
    const sphereRadius = 95; // Increased radius

    // Colors matching the reference image
    // Blue for connections
    const connectionColor = { h: 210, s: 90, l: isDarkMode ? 55 : 45 };
    // Warm orange/amber for node cores
    const nodeColor = { h: 35, s: 100, l: 60 };

    // Create nodes arranged around the perimeter (center stays empty)
    const nodes: Node[] = [];
    const nodeCount = 55;
    
    // Create nodes distributed around the outer ring only
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2 + Math.random() * 0.3;
      // Keep nodes in outer ring area (60-100% of radius)
      const radiusVariation = 0.6 + Math.random() * 0.4;
      const r = sphereRadius * radiusVariation;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      
      nodes.push({
        x,
        y,
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        radius: 1.5 + Math.random() * 2,
        pulsePhase: Math.random() * Math.PI * 2,
        connections: [],
      });
    }

    // Create many connections between nodes - dense neural network
    const connectionDistance = 90;
    nodes.forEach((node, i) => {
      nodes.forEach((other, j) => {
        if (i >= j) return;
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < connectionDistance && Math.random() < 0.85) {
          node.connections.push(j);
        }
      });
    });

    let animationId: number;
    let time = 0;

    const draw = () => {
      time += 0.015;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw irregular organic sphere border
      const segments = 60;
      
      // Outer glow with subtle irregular shape
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        // Subtle organic wobble using sine waves
        const wobble1 = Math.sin(angle * 3 + time * 0.5) * 2;
        const wobble2 = Math.sin(angle * 5 + time * 0.3) * 1;
        const pulseWobble = Math.sin(time * 0.5) * 1.5;
        const r = sphereRadius + wobble1 + wobble2 + pulseWobble;
        
        const x = centerX + Math.cos(angle) * (r + 15);
        const y = centerY + Math.sin(angle) * (r + 15);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      
      // Outer glow gradient
      const outerGlow = ctx.createRadialGradient(
        centerX, centerY, sphereRadius - 15,
        centerX, centerY, sphereRadius + 30
      );
      outerGlow.addColorStop(0, `hsla(${connectionColor.h}, ${connectionColor.s}%, ${connectionColor.l}%, 0)`);
      outerGlow.addColorStop(0.4, `hsla(${connectionColor.h}, ${connectionColor.s}%, ${connectionColor.l}%, ${isDarkMode ? 0.12 : 0.08})`);
      outerGlow.addColorStop(0.7, `hsla(${connectionColor.h}, ${connectionColor.s}%, ${connectionColor.l}%, ${isDarkMode ? 0.06 : 0.04})`);
      outerGlow.addColorStop(1, `hsla(${connectionColor.h}, ${connectionColor.s}%, ${connectionColor.l}%, 0)`);
      ctx.fillStyle = outerGlow;
      ctx.fill();

      // Irregular sphere border ring
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        // Same subtle wobble for consistency
        const wobble1 = Math.sin(angle * 3 + time * 0.5) * 2;
        const wobble2 = Math.sin(angle * 5 + time * 0.3) * 1;
        const pulseWobble = Math.sin(time * 0.5) * 1.5;
        const r = sphereRadius + wobble1 + wobble2 + pulseWobble;
        
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `hsla(${connectionColor.h}, ${connectionColor.s}%, ${connectionColor.l}%, ${isDarkMode ? 0.15 : 0.1})`;
      ctx.lineWidth = 4;
      ctx.filter = 'blur(3px)';
      ctx.stroke();
      
      // Second softer pass
      ctx.strokeStyle = `hsla(${connectionColor.h}, ${connectionColor.s}%, ${connectionColor.l}%, ${isDarkMode ? 0.08 : 0.05})`;
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.filter = 'none';

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

      // Draw connections first (behind nodes) - curved blue filaments
      ctx.lineCap = 'round';
      nodes.forEach((node, i) => {
        node.connections.forEach((j) => {
          const other = nodes[j];
          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Pulsing opacity on connections
          const pulse = 0.15 + Math.sin(time * 0.8 + node.pulsePhase) * 0.1;
          const opacity = Math.max(0, pulse * (1 - dist / connectionDistance));
          
          // Calculate control point for curved line (perpendicular offset)
          const midX = (node.x + other.x) / 2;
          const midY = (node.y + other.y) / 2;
          const perpX = -dy / dist;
          const perpY = dx / dist;
          // Add some variation to curve direction and intensity
          const curveIntensity = (Math.sin(i * 1.7 + j * 0.9) * 15) + (Math.sin(time * 0.3 + i) * 5);
          const ctrlX = midX + perpX * curveIntensity;
          const ctrlY = midY + perpY * curveIntensity;
          
          // Draw curved connection line
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.quadraticCurveTo(ctrlX, ctrlY, other.x, other.y);
          ctx.strokeStyle = `hsla(${connectionColor.h}, ${connectionColor.s}%, ${connectionColor.l}%, ${opacity * 0.5})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
          
          // Add second layer for glow effect
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.quadraticCurveTo(ctrlX, ctrlY, other.x, other.y);
          ctx.strokeStyle = `hsla(${connectionColor.h}, ${connectionColor.s}%, ${connectionColor.l + 20}%, ${opacity * 0.2})`;
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Add traveling pulse effect along some connections
          if (Math.random() < 0.25) {
            const pulsePos = (time * 0.25 + i * 0.15) % 1;
            // Calculate point along quadratic curve
            const t = pulsePos;
            const px = (1-t)*(1-t)*node.x + 2*(1-t)*t*ctrlX + t*t*other.x;
            const py = (1-t)*(1-t)*node.y + 2*(1-t)*t*ctrlY + t*t*other.y;
            
            const pulseGradient = ctx.createRadialGradient(px, py, 0, px, py, 2);
            pulseGradient.addColorStop(0, `hsla(${nodeColor.h}, ${nodeColor.s}%, ${nodeColor.l}%, ${opacity * 0.5})`);
            pulseGradient.addColorStop(1, `hsla(${nodeColor.h}, ${nodeColor.s}%, ${nodeColor.l}%, 0)`);
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fillStyle = pulseGradient;
            ctx.fill();
          }
        });
      });

      // Draw nodes (neurons) - warm orange/amber glow with slower pulse
      nodes.forEach((node) => {
        const pulse = Math.sin(time * 0.8 + node.pulsePhase);
        const currentRadius = node.radius * (0.8 + pulse * 0.3);
        const glowIntensity = 0.5 + pulse * 0.4;

        // Outer glow (large, soft) - orange tint
        const outerNodeGlow = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, currentRadius * 5
        );
        outerNodeGlow.addColorStop(0, `hsla(${nodeColor.h}, ${nodeColor.s}%, ${nodeColor.l}%, ${0.2 * glowIntensity})`);
        outerNodeGlow.addColorStop(0.5, `hsla(${nodeColor.h}, ${nodeColor.s}%, ${nodeColor.l - 10}%, ${0.08 * glowIntensity})`);
        outerNodeGlow.addColorStop(1, `hsla(${nodeColor.h}, ${nodeColor.s}%, ${nodeColor.l}%, 0)`);
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius * 5, 0, Math.PI * 2);
        ctx.fillStyle = outerNodeGlow;
        ctx.fill();

        // Middle glow
        const middleGlow = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, currentRadius * 2.5
        );
        middleGlow.addColorStop(0, `hsla(${nodeColor.h}, ${nodeColor.s}%, ${nodeColor.l + 15}%, ${0.5 * glowIntensity})`);
        middleGlow.addColorStop(0.5, `hsla(${nodeColor.h}, ${nodeColor.s}%, ${nodeColor.l}%, ${0.25 * glowIntensity})`);
        middleGlow.addColorStop(1, `hsla(${nodeColor.h}, ${nodeColor.s}%, ${nodeColor.l}%, 0)`);
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = middleGlow;
        ctx.fill();

        // Inner bright core - white/yellow hot
        const coreGlow = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, currentRadius
        );
        coreGlow.addColorStop(0, `hsla(45, 100%, 95%, ${0.9 * glowIntensity})`);
        coreGlow.addColorStop(0.4, `hsla(${nodeColor.h}, 100%, 75%, ${0.7 * glowIntensity})`);
        coreGlow.addColorStop(1, `hsla(${nodeColor.h}, ${nodeColor.s}%, ${nodeColor.l}%, 0)`);
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = coreGlow;
        ctx.fill();

        // White hot center point
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(50, 100%, 98%, ${0.85 * glowIntensity})`;
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
