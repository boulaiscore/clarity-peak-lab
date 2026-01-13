import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/hooks/useTheme";

interface CognitiveAgeSphereCompactProps {
  cognitiveAge: number;
  delta: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  pulseOffset: number;
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

  // Dense particle animation with organic pulsing border like WHOOP
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isDarkMode = theme === "dark";
    
    // Blue color palette
    const particleColor = isDarkMode 
      ? { h: 210, s: 90, l: 55 }
      : { h: 210, s: 75, l: 45 };

    const particles: Particle[] = [];
    const particleCount = 120; // Dense particles
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = 58;

    // Initialize particles - fill the entire sphere
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * baseRadius * 0.95;
      const baseAlpha = isDarkMode 
        ? (Math.random() * 0.6 + 0.2) 
        : (Math.random() * 0.8 + 0.3);
      
      particles.push({
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.8 + 0.5,
        alpha: baseAlpha,
        baseAlpha,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    // Organic border particles
    const borderParticles: Particle[] = [];
    const borderCount = 50;
    for (let i = 0; i < borderCount; i++) {
      const angle = (i / borderCount) * Math.PI * 2;
      const baseAlpha = isDarkMode ? 0.7 : 0.8;
      borderParticles.push({
        x: centerX + Math.cos(angle) * baseRadius,
        y: centerY + Math.sin(angle) * baseRadius,
        vx: 0,
        vy: 0,
        size: Math.random() * 1.5 + 1,
        alpha: baseAlpha,
        baseAlpha,
        pulseOffset: angle,
      });
    }

    let animationId: number;
    let time = 0;

    const draw = () => {
      time += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw organic pulsing border
      const pulseRadius = baseRadius + Math.sin(time * 0.3) * 2;
      
      // Draw border glow
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius + 6, 0, Math.PI * 2);
      const glowGradient = ctx.createRadialGradient(
        centerX, centerY, pulseRadius - 3,
        centerX, centerY, pulseRadius + 10
      );
      glowGradient.addColorStop(0, `hsla(${particleColor.h}, ${particleColor.s}%, ${particleColor.l}%, 0)`);
      glowGradient.addColorStop(0.5, `hsla(${particleColor.h}, ${particleColor.s}%, ${particleColor.l}%, ${isDarkMode ? 0.12 : 0.08})`);
      glowGradient.addColorStop(1, `hsla(${particleColor.h}, ${particleColor.s}%, ${particleColor.l}%, 0)`);
      ctx.fillStyle = glowGradient;
      ctx.fill();

      // Draw organic border with varying thickness
      borderParticles.forEach((p, i) => {
        const angle = (i / borderCount) * Math.PI * 2;
        const wobble = Math.sin(time * 0.5 + p.pulseOffset * 3) * 2.5;
        const radiusVariation = pulseRadius + wobble;
        
        p.x = centerX + Math.cos(angle + Math.sin(time * 0.2) * 0.02) * radiusVariation;
        p.y = centerY + Math.sin(angle + Math.sin(time * 0.2) * 0.02) * radiusVariation;
        
        const pulseFactor = 0.5 + Math.sin(time * 0.6 + p.pulseOffset) * 0.3;
        p.alpha = p.baseAlpha * pulseFactor;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.8 + Math.sin(time * 0.4 + p.pulseOffset) * 0.3), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particleColor.h}, ${particleColor.s}%, ${particleColor.l}%, ${p.alpha})`;
        ctx.fill();
        
        // Glow for border particles
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particleColor.h}, ${particleColor.s}%, ${particleColor.l}%, ${p.alpha * 0.15})`;
        ctx.fill();
      });

      // Draw inner particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Gentle randomization of velocity
        p.vx += (Math.random() - 0.5) * 0.04;
        p.vy += (Math.random() - 0.5) * 0.04;
        p.vx *= 0.98;
        p.vy *= 0.98;

        // Keep within organic boundary
        const dx = p.x - centerX;
        const dy = p.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const currentRadius = pulseRadius - 3;
        
        if (dist > currentRadius * 0.92) {
          const angle = Math.atan2(dy, dx);
          const pushBack = (dist - currentRadius * 0.85) * 0.1;
          p.x -= Math.cos(angle) * pushBack;
          p.y -= Math.sin(angle) * pushBack;
          p.vx *= 0.5;
          p.vy *= 0.5;
        }

        // Pulsing alpha
        const pulseFactor = 0.7 + Math.sin(time * 1.5 + p.pulseOffset) * 0.3;
        p.alpha = p.baseAlpha * pulseFactor;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particleColor.h}, ${particleColor.s}%, ${particleColor.l}%, ${p.alpha})`;
        ctx.fill();

        // Subtle glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particleColor.h}, ${particleColor.s}%, ${particleColor.l}%, ${p.alpha * 0.12})`;
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
        {/* Outer ambient glow */}
        <div 
          className="absolute inset-0 rounded-full blur-2xl scale-[1.8]"
          style={{
            background: isDark 
              ? 'radial-gradient(circle, hsla(210, 90%, 55%, 0.2) 0%, hsla(210, 90%, 55%, 0.06) 40%, transparent 65%)'
              : 'radial-gradient(circle, hsla(210, 75%, 45%, 0.15) 0%, hsla(210, 75%, 45%, 0.04) 40%, transparent 65%)'
          }}
        />

        {/* Canvas for particles and organic border */}
        <canvas 
          ref={canvasRef} 
          width={140} 
          height={140} 
          className="absolute -inset-[5px]" 
        />

        {/* Content overlay */}
        <div className="relative w-[130px] h-[130px] rounded-full flex flex-col items-center justify-center">
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
