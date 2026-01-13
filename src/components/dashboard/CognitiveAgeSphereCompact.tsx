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
  const isDark = theme === "dark";

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

    // Theme-aware particle colors - Blue theme
    const isDark = theme === "dark";
    
    const particleColor = isDark 
      ? { h: 210, s: 90, l: 55 }  // Vibrant blue for dark mode
      : { h: 210, s: 75, l: 45 }; // Deep blue for light mode

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
        {/* Glow - Blue theme */}
        <div 
          className="absolute inset-0 rounded-full blur-2xl scale-[1.6]"
          style={{
            background: isDark 
              ? 'radial-gradient(circle, hsla(210, 90%, 55%, 0.25) 0%, hsla(210, 90%, 55%, 0.08) 40%, transparent 70%)'
              : 'radial-gradient(circle, hsla(210, 75%, 45%, 0.2) 0%, hsla(210, 75%, 45%, 0.06) 40%, transparent 70%)'
          }}
        />

        {/* Animated rotating ring - Blue */}
        <svg 
          className="absolute inset-0 w-[130px] h-[130px] animate-spin-slow"
          viewBox="0 0 130 130"
        >
          <circle
            cx="65"
            cy="65"
            r="62"
            fill="none"
            stroke={isDark ? 'hsla(210, 90%, 55%, 0.35)' : 'hsla(210, 75%, 45%, 0.4)'}
            strokeWidth="1"
            strokeDasharray="8 12"
          />
        </svg>

        {/* Second rotating ring - opposite direction - Blue */}
        <svg 
          className="absolute inset-0 w-[130px] h-[130px] animate-spin-slow-reverse"
          viewBox="0 0 130 130"
        >
          <circle
            cx="65"
            cy="65"
            r="58"
            fill="none"
            stroke={isDark ? 'hsla(210, 90%, 55%, 0.2)' : 'hsla(210, 75%, 45%, 0.25)'}
            strokeWidth="0.5"
            strokeDasharray="4 20"
          />
        </svg>

        {/* Orbiting dots - Blue */}
        <div className="absolute inset-0 w-[130px] h-[130px] animate-spin-slower">
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: isDark ? 'hsla(210, 90%, 55%, 0.6)' : 'hsla(210, 75%, 45%, 0.7)',
              boxShadow: '0 0 6px hsla(210, 90%, 55%, 0.5)'
            }}
          />
        </div>
        <div className="absolute inset-0 w-[130px] h-[130px] animate-spin-slower" style={{ animationDelay: '-5s' }}>
          <div 
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
            style={{ backgroundColor: isDark ? 'hsla(210, 90%, 55%, 0.4)' : 'hsla(210, 75%, 45%, 0.5)' }}
          />
        </div>
        <div className="absolute inset-0 w-[130px] h-[130px] animate-spin-slower" style={{ animationDelay: '-10s' }}>
          <div 
            className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-1 rounded-full"
            style={{ backgroundColor: isDark ? 'hsla(210, 90%, 55%, 0.5)' : 'hsla(210, 75%, 45%, 0.6)' }}
          />
        </div>

        {/* Canvas for inner particles */}
        <canvas ref={canvasRef} width={130} height={130} className="absolute inset-0" />

        {/* Inner circle with content */}
        <div className="relative w-[130px] h-[130px] rounded-full flex flex-col items-center justify-center bg-background/20 dark:bg-transparent">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">
            Cognitive Age
          </span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-3xl font-semibold text-foreground">{Math.round(animatedAge)}</span>
            <span className="text-xs text-muted-foreground">y</span>
          </div>
          <span
            className="text-[10px] font-medium mt-0.5"
            style={{
              color: isImproved 
                ? 'hsl(210, 90%, 55%)' 
                : delta > 0 
                  ? 'hsl(var(--warning))' 
                  : 'hsl(var(--muted-foreground))'
            }}
          >
            {deltaText}
          </span>
        </div>
      </div>
    </div>
  );
}
