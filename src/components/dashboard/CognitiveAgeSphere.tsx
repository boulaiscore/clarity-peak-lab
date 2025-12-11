import { useEffect, useRef, useState } from "react";

interface CognitiveAgeSphereProps {
  cognitiveAge: number;
  delta: number;
  chronologicalAge?: number;
}

export function CognitiveAgeSphere({ cognitiveAge, delta, chronologicalAge }: CognitiveAgeSphereProps) {
  const [animatedAge, setAnimatedAge] = useState(cognitiveAge);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    const particleCount = 60;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 80;

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius * 0.8;
      particles.push({
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.3,
      });
    }

    let animationId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw particles
      particles.forEach((p) => {
        // Move particle
        p.x += p.vx;
        p.y += p.vy;

        // Keep within circle
        const dx = p.x - centerX;
        const dy = p.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > radius * 0.85) {
          const angle = Math.atan2(dy, dx);
          p.x = centerX + Math.cos(angle) * radius * 0.8;
          p.y = centerY + Math.sin(angle) * radius * 0.8;
          p.vx = -p.vx * 0.5;
          p.vy = -p.vy * 0.5;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(165, 82%, 51%, ${p.alpha})`;
        ctx.fill();

        // Subtle glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(165, 82%, 51%, ${p.alpha * 0.2})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, []);

  // Determine if cognitive age is better (lower) than chronological
  const isImproved = delta < 0;
  const deltaYears = Math.abs(delta);
  
  const deltaText = isImproved
    ? `${deltaYears.toFixed(0)}y younger than baseline`
    : delta > 0
    ? `${deltaYears.toFixed(0)}y older than baseline`
    : "at baseline";

  return (
    <div className="relative flex flex-col items-center justify-center py-6">
      {/* Main sphere container */}
      <div className="relative">
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-radial from-primary/20 via-primary/5 to-transparent blur-2xl scale-150 animate-glow" />

        {/* Canvas for particles */}
        <canvas
          ref={canvasRef}
          width={200}
          height={200}
          className="absolute inset-0"
        />

        {/* Main circle */}
        <div className="relative w-[200px] h-[200px] rounded-full border border-primary/30 flex flex-col items-center justify-center animate-glow-pulse">
          {/* Inner border ring */}
          <div className="absolute inset-2 rounded-full border border-primary/10" />
          
          <span className="label-uppercase mb-1">Cognitive Age</span>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-semibold text-foreground number-display">
              {Math.round(animatedAge)}
            </span>
            <span className="text-lg text-muted-foreground">years</span>
          </div>
          <span
            className={`text-sm font-medium mt-1 ${
              isImproved ? "text-primary" : delta > 0 ? "text-warning" : "text-muted-foreground"
            }`}
          >
            {deltaText}
          </span>
        </div>
      </div>

      {/* Chronological age reference */}
      {chronologicalAge && (
        <p className="text-muted-foreground text-xs text-center mt-4">
          Chronological age: {chronologicalAge} years
        </p>
      )}

      {/* Description */}
      <p className="text-muted-foreground text-xs text-center mt-2 max-w-[280px]">
        Your brain's functional age based on reasoning speed, clarity, decision quality, and focus.
      </p>

      {/* Disclaimer */}
      <div className="mt-4 px-3 py-2 rounded-lg bg-card/50 border border-border/30">
        <p className="text-[9px] text-muted-foreground/60 text-center uppercase tracking-wider">
          Cognitive performance index · Not a medical measurement
        </p>
      </div>
    </div>
  );
}
