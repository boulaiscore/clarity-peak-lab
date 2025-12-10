import { useEffect, useRef } from "react";

interface NeuralGrowthAnimationProps {
  cognitiveAgeDelta: number;
  overallCognitiveScore: number;
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

export function NeuralGrowthAnimation({ cognitiveAgeDelta, overallCognitiveScore }: NeuralGrowthAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Map metrics to visual intensity
  const isYounger = cognitiveAgeDelta < 0;
  const intensity = Math.min(1, Math.max(0.2, overallCognitiveScore / 100));
  const nodeCount = Math.floor(15 + intensity * 25);
  const connectionDensity = 0.3 + intensity * 0.4;
  const glowIntensity = isYounger ? 0.8 : 0.4;

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

    let animationId: number;
    let time = 0;

    const draw = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Draw connections
      nodes.forEach((node, i) => {
        node.connections.forEach((j) => {
          const other = nodes[j];
          const bothActive = node.active && other.active;

          // Pulsing effect on connections
          const pulse = Math.sin(time * 2 + node.pulsePhase) * 0.3 + 0.7;
          const alpha = bothActive ? 0.15 * pulse * glowIntensity : 0.05;

          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `hsla(165, 82%, 51%, ${alpha})`;
          ctx.lineWidth = bothActive ? 1.5 : 0.5;
          ctx.stroke();
        });
      });

      // Draw nodes
      nodes.forEach((node) => {
        // Move nodes slightly
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off boundaries
        const margin = 20;
        if (node.x < margin || node.x > width - margin) node.vx *= -1;
        if (node.y < margin || node.y > height - margin) node.vy *= -1;

        // Pulse effect
        const pulse = Math.sin(time * 3 + node.pulsePhase) * 0.4 + 0.6;
        const nodeIntensity = node.active ? pulse * glowIntensity : 0.3;

        // Glow
        if (node.active) {
          const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 4);
          gradient.addColorStop(0, `hsla(165, 82%, 51%, ${nodeIntensity * 0.5})`);
          gradient.addColorStop(1, "transparent");
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 4, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        // Node core
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * (node.active ? pulse : 0.7), 0, Math.PI * 2);
        ctx.fillStyle = node.active ? `hsla(165, 82%, ${50 + pulse * 20}%, ${nodeIntensity})` : "hsla(0, 0%, 40%, 0.4)";
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [nodeCount, connectionDensity, glowIntensity, intensity]);

  const statusText =
    overallCognitiveScore >= 75
      ? "High strategic clarity"
      : overallCognitiveScore >= 50
        ? "Developing strategic capacity"
        : "Building cognitive foundation";

  return (
    <div className="p-5 rounded-2xl bg-card border border-border/30">
      <h3 className="label-uppercase text-center mb-3">Cognitive Network</h3>
      
      <div className="relative flex justify-center">
        <canvas ref={canvasRef} width={200} height={160} className="opacity-90" />
      </div>
      
      <div className="mt-3 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-2xl font-bold text-primary">{overallCognitiveScore}</span>
          <span className="text-[10px] text-muted-foreground/60 uppercase">/ 100</span>
        </div>
        <p className="text-[11px] text-primary font-medium">{statusText}</p>
        <p className="text-[9px] text-muted-foreground/60 mt-1 leading-relaxed">
          Strategic thinking density. More connections = sharper decision-making.
        </p>
      </div>
    </div>
  );
}
