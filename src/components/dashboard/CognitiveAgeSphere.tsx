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
    const baseRadius = 105;

    // Vitality factor: negative delta (younger brain) = more vitality
    // Normalize from 0 (delta >= 0) to 1 (delta <= -10)
    const vitalityFactor = Math.min(1, Math.max(0, -delta / 10));

    // Colors matching the current design - adjust based on vitality
    const connectionColor = { 
      h: 210, 
      s: 90, 
      l: (isDarkMode ? 55 : 45) + vitalityFactor * 15 
    };
    const nodeColor = { 
      h: 35, 
      s: 100, 
      l: 60 + vitalityFactor * 10 
    };

    // Create nodes arranged around the perimeter
    const nodes: Node[] = [];
    const nodeCount = 130;
    
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2 + Math.random() * 0.3;
      const radiusVariation = 0.55 + Math.random() * 0.45;
      const r = baseRadius * radiusVariation;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      
      nodes.push({
        x,
        y,
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        radius: 1.2 + Math.random() * 1.8,
        pulsePhase: Math.random() * Math.PI * 2,
        connections: [],
      });
    }

    // Create connections between nodes
    const connectionDistance = 85;
    nodes.forEach((node, i) => {
      nodes.forEach((other, j) => {
        if (i >= j) return;
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < connectionDistance && Math.random() < 0.8) {
          node.connections.push(j);
        }
      });
    });

    let animationId: number;
    let time = 0;

    // Generate organic blob shape points - subtle variation
    const blobPoints = 6;
    const blobSeeds = Array.from({ length: blobPoints }, () => ({
      amplitude: 2 + Math.random() * 3,
      phase: Math.random() * Math.PI * 2,
      speed: 0.2 + Math.random() * 0.2,
    }));

    const getBlobRadius = (angle: number, t: number) => {
      let wobble = 0;
      blobSeeds.forEach((seed, i) => {
        wobble += Math.sin(angle * (i + 2) + t * seed.speed + seed.phase) * seed.amplitude;
      });
      // Add slow breathing pulse
      const breathe = Math.sin(t * 0.4) * 2;
      return baseRadius + wobble * 0.4 + breathe;
    };

    // Helper to check if a point is inside the blob shape
    const isInsideBlob = (px: number, py: number, t: number, margin: number = 0) => {
      const dx = px - centerX;
      const dy = py - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const blobR = getBlobRadius(angle, t) - margin;
      return dist < blobR;
    };

    const draw = () => {
      time += 0.012;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const segments = 120;

      // Build the blob path
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const r = getBlobRadius(angle, time);
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      // Inner fill gradient - subtle glow near edges
      const innerFill = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, baseRadius
      );
      innerFill.addColorStop(0, `hsla(${connectionColor.h}, ${connectionColor.s}%, ${connectionColor.l}%, 0)`);
      innerFill.addColorStop(0.5, `hsla(${connectionColor.h}, ${connectionColor.s}%, ${connectionColor.l}%, ${isDarkMode ? 0.02 : 0.01})`);
      innerFill.addColorStop(0.8, `hsla(${connectionColor.h}, ${connectionColor.s}%, ${connectionColor.l}%, ${isDarkMode ? 0.05 : 0.03})`);
      innerFill.addColorStop(1, `hsla(${connectionColor.h}, ${connectionColor.s}%, ${connectionColor.l + 10}%, ${isDarkMode ? 0.08 : 0.05})`);
      ctx.fillStyle = innerFill;
      ctx.fill();
      
      // Sharp, well-defined border stroke - NO blur
      ctx.strokeStyle = `hsla(${connectionColor.h}, ${connectionColor.s}%, ${connectionColor.l + 20}%, ${isDarkMode ? 0.6 : 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Update node positions and constrain to blob shape
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        const dx = node.baseX - node.x;
        const dy = node.baseY - node.y;
        node.vx += dx * 0.006;
        node.vy += dy * 0.006;
        node.vx *= 0.985;
        node.vy *= 0.985;
        
        // Strictly constrain nodes inside the blob with margin
        if (!isInsideBlob(node.x, node.y, time, 8)) {
          // Push back towards center
          const ndx = node.x - centerX;
          const ndy = node.y - centerY;
          const dist = Math.sqrt(ndx * ndx + ndy * ndy);
          const angle = Math.atan2(ndy, ndx);
          const maxR = getBlobRadius(angle, time) - 10;
          if (dist > maxR) {
            node.x = centerX + Math.cos(angle) * maxR;
            node.y = centerY + Math.sin(angle) * maxR;
            node.vx *= -0.3;
            node.vy *= -0.3;
          }
        }
      });

      // Draw connections - sharp crisp lines with vitality-based intensity
      ctx.lineCap = 'round';
      const basePulseSpeed = 0.7 + vitalityFactor * 0.5;
      const basePulseAmplitude = 0.1 + vitalityFactor * 0.15;
      const baseOpacity = 0.7 + vitalityFactor * 0.25;
      const travelPulseProbability = 0.15 + vitalityFactor * 0.25;

      nodes.forEach((node, i) => {
        // Skip if node is outside blob
        if (!isInsideBlob(node.x, node.y, time, 3)) return;
        
        node.connections.forEach((j) => {
          const other = nodes[j];
          // Skip if other node is outside blob
          if (!isInsideBlob(other.x, other.y, time, 3)) return;
          
          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          const pulse = 0.2 + Math.sin(time * basePulseSpeed + node.pulsePhase) * basePulseAmplitude;
          const opacity = Math.max(0, pulse * (1 - dist / connectionDistance)) * (1 + vitalityFactor * 0.5);
          
          const midX = (node.x + other.x) / 2;
          const midY = (node.y + other.y) / 2;
          const perpX = -dy / dist;
          const perpY = dx / dist;
          const curveIntensity = (Math.sin(i * 1.7 + j * 0.9) * 8) + (Math.sin(time * 0.25 + i) * 2);
          const ctrlX = midX + perpX * curveIntensity;
          const ctrlY = midY + perpY * curveIntensity;
          
          // Skip if control point is outside blob
          if (!isInsideBlob(ctrlX, ctrlY, time, 3)) return;
          
          // Single sharp connection line - brighter with more vitality
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.quadraticCurveTo(ctrlX, ctrlY, other.x, other.y);
          ctx.strokeStyle = `hsla(${connectionColor.h}, ${connectionColor.s}%, ${connectionColor.l + 15}%, ${opacity * baseOpacity})`;
          ctx.lineWidth = 0.8 + vitalityFactor * 0.3;
          ctx.stroke();

          // Traveling pulse - only if inside blob
          if (Math.random() < travelPulseProbability) {
            const pulsePos = (time * (0.2 + vitalityFactor * 0.15) + i * 0.12) % 1;
            const t = pulsePos;
            const px = (1-t)*(1-t)*node.x + 2*(1-t)*t*ctrlX + t*t*other.x;
            const py = (1-t)*(1-t)*node.y + 2*(1-t)*t*ctrlY + t*t*other.y;
            
            // Only draw pulse if inside blob
            if (isInsideBlob(px, py, time, 5)) {
              const pulseSize = 1.2 + vitalityFactor * 0.6;
              ctx.beginPath();
              ctx.arc(px, py, pulseSize, 0, Math.PI * 2);
              ctx.fillStyle = `hsla(${nodeColor.h}, ${nodeColor.s}%, ${nodeColor.l + 20 + vitalityFactor * 10}%, ${opacity * (0.9 + vitalityFactor * 0.1)})`;
              ctx.fill();
            }
          }
        });
      });

      // Draw nodes - crisp defined dots with vitality-based intensity
      const nodePulseSpeed = 0.7 + vitalityFactor * 0.4;
      const nodePulseAmplitude = 0.1 + vitalityFactor * 0.1;

      nodes.forEach((node) => {
        // Only draw nodes that are inside the blob
        if (!isInsideBlob(node.x, node.y, time, 3)) return;
        
        const pulse = Math.sin(time * nodePulseSpeed + node.pulsePhase);
        const currentRadius = node.radius * (0.95 + pulse * nodePulseAmplitude);
        const glowIntensity = (0.8 + pulse * 0.2) * (1 + vitalityFactor * 0.2);

        // Sharp bright dot - brighter with vitality
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${nodeColor.h}, ${nodeColor.s}%, ${nodeColor.l + 15}%, ${Math.min(1, 0.95 * glowIntensity)})`;
        ctx.fill();

        // White hot center point
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(50, 100%, ${96 + vitalityFactor * 4}%, ${Math.min(1, 0.98 * glowIntensity)})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [theme, delta]);

  // Calculate comparison text vs real age
  const getComparisonText = () => {
    if (!chronologicalAge) return null;
    const diff = chronologicalAge - cognitiveAge;
    const absDiff = Math.abs(Math.round(diff));
    
    if (absDiff === 0) {
      return { text: "Same as your real age", color: "text-muted-foreground" };
    } else if (diff > 0) {
      return { text: `${absDiff}y younger than your real age`, color: "text-emerald-500" };
    } else {
      return { text: `${absDiff}y older than your real age`, color: "text-amber-500" };
    }
  };
  
  const comparison = getComparisonText();

  return (
    <div className="py-2">
      <h3 className="label-uppercase text-center mb-6">Cognitive Age</h3>
      
      <div className="relative flex flex-col items-center justify-center mt-2">
        {/* Main sphere container */}
        <div className="relative">
          {/* Canvas for neural network */}
          <canvas
            ref={canvasRef}
            width={250}
            height={250}
            className="absolute -inset-[25px]"
          />

          {/* Content overlay - age centered */}
          <div className="relative w-[200px] h-[200px] rounded-full flex flex-col items-center justify-center">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-semibold text-foreground number-display">
                {Math.round(animatedAge)}
              </span>
              <span className="text-sm text-muted-foreground">years</span>
            </div>
          </div>
        </div>
        
        {/* Comparison text below circle */}
        {comparison && (
          <p className={`text-sm font-medium mt-4 ${comparison.color}`}>
            {comparison.text}
          </p>
        )}
      </div>
    </div>
  );
}
