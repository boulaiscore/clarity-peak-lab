import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/hooks/useTheme";

interface CognitiveAgeSphereProps {
  cognitiveAge: number;
  delta: number;
  chronologicalAge?: number;
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
  targetRadius?: number;
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

  // Dense particle animation with organic pulsing border like WHOOP
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDarkMode = theme === "dark";
    
    // Blue color palette
    const particleColor = isDarkMode 
      ? { h: 210, s: 90, l: 55 }
      : { h: 210, s: 75, l: 45 };

    const particles: Particle[] = [];
    const particleCount = 200; // Much denser like WHOOP
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = 90;

    // Initialize particles - concentrate near the border, leave center empty
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      // Use a distribution that favors the outer ring (50%-95% of radius)
      const minRadius = baseRadius * 0.5;
      const maxRadius = baseRadius * 0.95;
      const r = minRadius + Math.random() * (maxRadius - minRadius);
      const baseAlpha = isDarkMode 
        ? (Math.random() * 0.6 + 0.2) 
        : (Math.random() * 0.8 + 0.3);
      
      particles.push({
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2.5 + 0.8,
        alpha: baseAlpha,
        baseAlpha,
        pulseOffset: Math.random() * Math.PI * 2,
        targetRadius: r, // Store target radius to keep particles in their ring
      });
    }

    // Organic border particles
    const borderParticles: Particle[] = [];
    const borderCount = 80;
    for (let i = 0; i < borderCount; i++) {
      const angle = (i / borderCount) * Math.PI * 2;
      const baseAlpha = isDarkMode ? 0.7 : 0.8;
      borderParticles.push({
        x: centerX + Math.cos(angle) * baseRadius,
        y: centerY + Math.sin(angle) * baseRadius,
        vx: 0,
        vy: 0,
        size: Math.random() * 2 + 1.5,
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
      const pulseRadius = baseRadius + Math.sin(time * 0.3) * 3;
      
      // Draw border glow
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius + 8, 0, Math.PI * 2);
      const glowGradient = ctx.createRadialGradient(
        centerX, centerY, pulseRadius - 5,
        centerX, centerY, pulseRadius + 15
      );
      glowGradient.addColorStop(0, `hsla(${particleColor.h}, ${particleColor.s}%, ${particleColor.l}%, 0)`);
      glowGradient.addColorStop(0.5, `hsla(${particleColor.h}, ${particleColor.s}%, ${particleColor.l}%, ${isDarkMode ? 0.15 : 0.1})`);
      glowGradient.addColorStop(1, `hsla(${particleColor.h}, ${particleColor.s}%, ${particleColor.l}%, 0)`);
      ctx.fillStyle = glowGradient;
      ctx.fill();

      // Draw organic border with varying thickness
      borderParticles.forEach((p, i) => {
        const angle = (i / borderCount) * Math.PI * 2;
        const wobble = Math.sin(time * 0.5 + p.pulseOffset * 3) * 4;
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
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particleColor.h}, ${particleColor.s}%, ${particleColor.l}%, ${p.alpha * 0.2})`;
        ctx.fill();
      });

      // Draw inner particles
      particles.forEach((p) => {
        // Move particle with slight drift
        p.x += p.vx;
        p.y += p.vy;

        // Gentle randomization of velocity
        p.vx += (Math.random() - 0.5) * 0.05;
        p.vy += (Math.random() - 0.5) * 0.05;
        p.vx *= 0.98;
        p.vy *= 0.98;

        // Keep particles in their ring zone (near border, away from center)
        const dx = p.x - centerX;
        const dy = p.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = baseRadius * 0.45; // Inner boundary - keep center empty
        const maxDist = pulseRadius - 5;
        
        // Push back if too close to center
        if (dist < minDist) {
          const angle = Math.atan2(dy, dx);
          const pushOut = (minDist - dist) * 0.15;
          p.x += Math.cos(angle) * pushOut;
          p.y += Math.sin(angle) * pushOut;
          p.vx *= 0.5;
          p.vy *= 0.5;
        }
        
        // Push back if too close to border
        if (dist > maxDist * 0.92) {
          const angle = Math.atan2(dy, dx);
          const pushBack = (dist - maxDist * 0.85) * 0.1;
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
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particleColor.h}, ${particleColor.s}%, ${particleColor.l}%, ${p.alpha * 0.15})`;
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
    ? `${deltaYears.toFixed(0)}y younger than baseline`
    : delta > 0
    ? `${deltaYears.toFixed(0)}y older than baseline`
    : "at baseline";

  return (
    <div className="relative flex flex-col items-center justify-center py-6">
      {/* Main sphere container */}
      <div className="relative">
        {/* Outer ambient glow */}
        <div 
          className="absolute inset-0 rounded-full blur-3xl scale-[2]"
          style={{
            background: isDark 
              ? 'radial-gradient(circle, hsla(210, 90%, 55%, 0.25) 0%, hsla(210, 90%, 55%, 0.08) 40%, transparent 65%)'
              : 'radial-gradient(circle, hsla(210, 75%, 45%, 0.2) 0%, hsla(210, 75%, 45%, 0.06) 40%, transparent 65%)'
          }}
        />

        {/* Canvas for particles and organic border */}
        <canvas
          ref={canvasRef}
          width={220}
          height={220}
          className="absolute -inset-[10px]"
        />

        {/* Content overlay */}
        <div className="relative w-[200px] h-[200px] rounded-full flex flex-col items-center justify-center">
          <span className="label-uppercase mb-1">Cognitive Age</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-semibold text-foreground number-display">
              {Math.round(animatedAge)}
            </span>
            <span className="text-sm text-muted-foreground">years</span>
          </div>
          <span
            className="text-sm font-medium mt-1"
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
