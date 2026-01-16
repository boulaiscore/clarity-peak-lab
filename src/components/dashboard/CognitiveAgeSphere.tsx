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

    // Primary color for the network
    const primaryColor = { h: 165, s: 82, l: isDarkMode ? 55 : 45 };
    // Accent glow color (warmer for node centers)
    const glowColor = { h: 45, s: 100, l: 70 };

    // Create nodes arranged in a spherical pattern
    const nodes: Node[] = [];
    const nodeCount = 25;
    
    // Create nodes distributed around a sphere
    for (let i = 0; i < nodeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radiusVariation = 0.5 + Math.random() * 0.5;
      const r = sphereRadius * radiusVariation;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      
      nodes.push({
        x,
        y,
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: 2 + Math.random() * 3,
        pulsePhase: Math.random() * Math.PI * 2,
        connections: [],
      });
    }

    // Create connections between nearby nodes
    const connectionDistance = 60;
    nodes.forEach((node, i) => {
      nodes.forEach((other, j) => {
        if (i >= j) return;
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < connectionDistance && Math.random() < 0.6) {
          node.connections.push(j);
        }
      });
    });

    let animationId: number;
    let time = 0;

    const draw = () => {
      time += 0.015;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update node positions with gentle floating
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        // Pull back towards base position
        const dx = node.baseX - node.x;
        const dy = node.baseY - node.y;
        node.vx += dx * 0.01;
        node.vy += dy * 0.01;

        // Damping
        node.vx *= 0.98;
        node.vy *= 0.98;
      });

      // Draw connections first (behind nodes)
      nodes.forEach((node, i) => {
        node.connections.forEach((j) => {
          const other = nodes[j];
          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Pulsing opacity on connections
          const pulse = 0.15 + Math.sin(time * 2 + node.pulsePhase) * 0.1;
          const opacity = Math.max(0, pulse * (1 - dist / connectionDistance));
          
          // Draw connection line
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `hsla(${primaryColor.h}, ${primaryColor.s}%, ${primaryColor.l}%, ${opacity})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();

          // Add traveling pulse effect along some connections
          if (Math.random() < 0.02) {
            const pulsePos = (time * 0.5 + i * 0.1) % 1;
            const px = node.x + dx * pulsePos;
            const py = node.y + dy * pulsePos;
            
            const pulseGradient = ctx.createRadialGradient(px, py, 0, px, py, 4);
            pulseGradient.addColorStop(0, `hsla(${glowColor.h}, ${glowColor.s}%, ${glowColor.l}%, 0.6)`);
            pulseGradient.addColorStop(1, `hsla(${glowColor.h}, ${glowColor.s}%, ${glowColor.l}%, 0)`);
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fillStyle = pulseGradient;
            ctx.fill();
          }
        });
      });

      // Draw nodes (neurons)
      nodes.forEach((node) => {
        const pulse = Math.sin(time * 2 + node.pulsePhase);
        const currentRadius = node.radius * (0.8 + pulse * 0.3);
        const glowIntensity = 0.5 + pulse * 0.3;

        // Outer glow (large, soft)
        const outerGlow = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, currentRadius * 8
        );
        outerGlow.addColorStop(0, `hsla(${primaryColor.h}, ${primaryColor.s}%, ${primaryColor.l}%, ${0.2 * glowIntensity})`);
        outerGlow.addColorStop(0.3, `hsla(${primaryColor.h}, ${primaryColor.s}%, ${primaryColor.l}%, ${0.1 * glowIntensity})`);
        outerGlow.addColorStop(1, `hsla(${primaryColor.h}, ${primaryColor.s}%, ${primaryColor.l}%, 0)`);
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius * 8, 0, Math.PI * 2);
        ctx.fillStyle = outerGlow;
        ctx.fill();

        // Middle glow (medium, brighter)
        const middleGlow = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, currentRadius * 4
        );
        middleGlow.addColorStop(0, `hsla(${primaryColor.h}, ${primaryColor.s}%, ${primaryColor.l + 10}%, ${0.5 * glowIntensity})`);
        middleGlow.addColorStop(0.5, `hsla(${primaryColor.h}, ${primaryColor.s}%, ${primaryColor.l}%, ${0.2 * glowIntensity})`);
        middleGlow.addColorStop(1, `hsla(${primaryColor.h}, ${primaryColor.s}%, ${primaryColor.l}%, 0)`);
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius * 4, 0, Math.PI * 2);
        ctx.fillStyle = middleGlow;
        ctx.fill();

        // Inner bright core
        const coreGlow = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, currentRadius * 1.5
        );
        coreGlow.addColorStop(0, `hsla(${primaryColor.h}, ${primaryColor.s - 20}%, ${Math.min(95, primaryColor.l + 30)}%, ${0.9 * glowIntensity})`);
        coreGlow.addColorStop(0.4, `hsla(${primaryColor.h}, ${primaryColor.s}%, ${primaryColor.l + 15}%, ${0.7 * glowIntensity})`);
        coreGlow.addColorStop(1, `hsla(${primaryColor.h}, ${primaryColor.s}%, ${primaryColor.l}%, 0)`);
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = coreGlow;
        ctx.fill();

        // White hot center
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${primaryColor.h}, 30%, 95%, ${0.8 * glowIntensity})`;
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
