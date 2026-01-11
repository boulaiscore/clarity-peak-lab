import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/hooks/useTheme";

interface CognitiveAgeSphereCompactProps {
  cognitiveAge: number;
  delta: number;
}

export function CognitiveAgeSphereCompact({ cognitiveAge, delta }: CognitiveAgeSphereCompactProps) {
  const [animatedAge, setAnimatedAge] = useState(cognitiveAge);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const duration = 1200;
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

  // Particle animation with theme-aware colors
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Theme-aware particle colors
    const isDark = theme === "dark";
    
    const particleColor = isDark 
      ? { h: 165, s: 82, l: 51 }  // Vibrant teal for dark mode
      : { h: 165, s: 65, l: 35 }; // Deeper, more saturated teal for light mode

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    const particleCount = 40;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 55;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius * 0.8;
      particles.push({
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        size: Math.random() * 1.5 + 0.5,
        alpha: isDark ? (Math.random() * 0.5 + 0.2) : (Math.random() * 0.7 + 0.3),
      });
    }

    let animationId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

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

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particleColor.h}, ${particleColor.s}%, ${particleColor.l}%, ${p.alpha})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [theme]);

  const isImproved = delta < 0;
  const deltaYears = Math.abs(delta);

  const deltaText = isImproved
    ? `${deltaYears.toFixed(0)}y younger`
    : delta > 0
      ? `${deltaYears.toFixed(0)}y older`
      : "at baseline";

  return (
    <div className="relative flex items-center justify-center">
      <div className="relative">
        {/* Glow - theme aware */}
        <div className="absolute inset-0 rounded-full bg-gradient-radial from-primary/20 via-primary/5 to-transparent blur-xl scale-150 dark:from-primary/15 dark:via-primary/5" />

        {/* Canvas */}
        <canvas ref={canvasRef} width={130} height={130} className="absolute inset-0" />

        {/* Circle */}
        <div className="relative w-[130px] h-[130px] rounded-full border border-primary/40 dark:border-primary/30 flex flex-col items-center justify-center bg-background/30 dark:bg-transparent">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">
            Cognitive Age
          </span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-3xl font-semibold text-foreground">{Math.round(animatedAge)}</span>
            <span className="text-xs text-muted-foreground">y</span>
          </div>
          <span
            className={`text-[10px] font-medium mt-0.5 ${
              isImproved ? "text-primary" : delta > 0 ? "text-warning" : "text-muted-foreground"
            }`}
          >
            {deltaText}
          </span>
        </div>
      </div>
    </div>
  );
}
