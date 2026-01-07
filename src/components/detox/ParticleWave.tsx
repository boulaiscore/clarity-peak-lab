import { useMemo } from "react";
import { motion } from "framer-motion";

interface ParticleWaveProps {
  className?: string;
}

export function ParticleWave({ className = "" }: ParticleWaveProps) {
  // Generate particles positioned in a wave pattern
  const particles = useMemo(() => {
    const count = 60;
    const result = [];
    
    for (let i = 0; i < count; i++) {
      const progress = i / (count - 1);
      const x = 10 + progress * 80; // 10% to 90% of width
      const baseY = 50 + Math.sin(progress * Math.PI * 2) * 15; // Wave pattern
      
      result.push({
        id: i,
        x,
        baseY,
        size: 2 + Math.random() * 3,
        delay: i * 0.02,
        amplitude: 8 + Math.random() * 12,
        duration: 2 + Math.random() * 1.5,
      });
    }
    
    return result;
  }, []);

  // Connecting lines between nearby particles
  const connections = useMemo(() => {
    const result = [];
    for (let i = 0; i < particles.length - 1; i++) {
      if (i % 3 === 0) { // Only connect every 3rd particle
        result.push({
          id: i,
          x1: particles[i].x,
          y1: particles[i].baseY,
          x2: particles[i + 1].x,
          y2: particles[i + 1].baseY,
        });
      }
    }
    return result;
  }, [particles]);

  return (
    <div className={`relative w-full h-48 overflow-hidden ${className}`}>
      <svg 
        viewBox="0 0 100 100" 
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
      >
        <defs>
          <radialGradient id="particleGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          </radialGradient>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(180, 70%, 50%)" stopOpacity="0.1" />
            <stop offset="50%" stopColor="hsl(180, 70%, 50%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(180, 70%, 50%)" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Connecting lines */}
        {connections.map((conn) => (
          <motion.line
            key={`line-${conn.id}`}
            x1={`${conn.x1}%`}
            y1={`${conn.y1}%`}
            x2={`${conn.x2}%`}
            y2={`${conn.y2}%`}
            stroke="url(#lineGradient)"
            strokeWidth="0.15"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: conn.id * 0.05,
            }}
          />
        ))}

        {/* Particles */}
        {particles.map((particle) => (
          <motion.circle
            key={particle.id}
            cx={`${particle.x}%`}
            r={particle.size * 0.3}
            fill="url(#particleGradient)"
            initial={{ cy: `${particle.baseY}%`, opacity: 0.4 }}
            animate={{
              cy: [
                `${particle.baseY}%`,
                `${particle.baseY - particle.amplitude}%`,
                `${particle.baseY}%`,
                `${particle.baseY + particle.amplitude * 0.5}%`,
                `${particle.baseY}%`,
              ],
              opacity: [0.4, 0.9, 0.6, 0.8, 0.4],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: particle.delay,
            }}
          />
        ))}

        {/* Glow effect layer */}
        {particles.filter((_, i) => i % 5 === 0).map((particle) => (
          <motion.circle
            key={`glow-${particle.id}`}
            cx={`${particle.x}%`}
            r={particle.size * 0.8}
            fill="none"
            stroke="hsl(180, 70%, 50%)"
            strokeWidth="0.3"
            initial={{ cy: `${particle.baseY}%`, opacity: 0 }}
            animate={{
              cy: [
                `${particle.baseY}%`,
                `${particle.baseY - particle.amplitude}%`,
                `${particle.baseY}%`,
              ],
              opacity: [0, 0.4, 0],
            }}
            transition={{
              duration: particle.duration * 0.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: particle.delay + 0.1,
            }}
          />
        ))}
      </svg>
    </div>
  );
}
