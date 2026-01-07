// Reusable drill completion screen with results summary and confetti celebration
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Target, Clock, Zap, Sparkles } from 'lucide-react';

interface DrillCompletionScreenProps {
  title: string;
  score: number;
  stats: {
    hits: number;
    misses: number;
    falseAlarms?: number;
    avgReactionTime?: number;
  };
  onContinue: () => void;
}

// Confetti particle component
function ConfettiParticle({ delay, x }: { delay: number; x: number }) {
  const colors = ['#22c55e', '#3b82f6', '#eab308', '#ec4899', '#8b5cf6', '#f97316'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = 8 + Math.random() * 8;
  const duration = 2 + Math.random() * 1.5;
  
  return (
    <motion.div
      className="absolute rounded-sm"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        left: `${x}%`,
        top: -20,
      }}
      initial={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
      animate={{
        y: [0, 600],
        opacity: [1, 1, 0],
        rotate: [0, 360 + Math.random() * 360],
        scale: [1, 0.8],
        x: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 200],
      }}
      transition={{
        duration,
        delay,
        ease: 'easeOut',
      }}
    />
  );
}

// Confetti burst component
function ConfettiBurst() {
  const [particles, setParticles] = useState<{ id: number; delay: number; x: number }[]>([]);
  
  useEffect(() => {
    const newParticles = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        delay: Math.random() * 0.5,
        x: Math.random() * 100,
      });
    }
    setParticles(newParticles);
  }, []);
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <ConfettiParticle key={p.id} delay={p.delay} x={p.x} />
      ))}
    </div>
  );
}

export const DrillCompletionScreen: React.FC<DrillCompletionScreenProps> = ({
  title,
  score,
  stats,
  onContinue,
}) => {
  const isHighScore = score >= 80;
  const accuracy = stats.hits + stats.misses > 0 
    ? Math.round((stats.hits / (stats.hits + stats.misses)) * 100) 
    : 0;

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreLabel = () => {
    if (score >= 90) return 'Excellent!';
    if (score >= 80) return 'Great job!';
    if (score >= 70) return 'Well done!';
    if (score >= 50) return 'Good effort';
    return 'Keep practicing';
  };

  return (
    <motion.div
      className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Confetti for high scores */}
      {isHighScore && <ConfettiBurst />}

      {/* Celebration glow for high scores */}
      {isHighScore && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-green-500/10 via-transparent to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* Trophy icon with celebration effect */}
      <motion.div
        className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 relative ${
          isHighScore ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/20' : 'bg-primary/20'
        }`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
      >
        <Trophy className={`w-10 h-10 ${isHighScore ? 'text-green-400' : 'text-primary'}`} />
        {isHighScore && (
          <motion.div
            className="absolute -top-1 -right-1"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            <Sparkles className="w-6 h-6 text-amber-400" />
          </motion.div>
        )}
      </motion.div>

      {/* Title */}
      <motion.h2
        className="text-xl font-bold text-foreground mb-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {title} Complete
      </motion.h2>

      <motion.p
        className={`text-sm font-medium mb-6 ${getScoreColor()}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {getScoreLabel()}
      </motion.p>

      {/* Score circle */}
      <motion.div
        className="relative w-32 h-32 mb-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 150, delay: 0.4 }}
      >
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            strokeWidth="8"
            fill="none"
            className="stroke-muted"
          />
          <motion.circle
            cx="64"
            cy="64"
            r="56"
            strokeWidth="8"
            fill="none"
            className={isHighScore ? 'stroke-green-500' : 'stroke-primary'}
            strokeLinecap="round"
            initial={{ strokeDasharray: '0 352' }}
            animate={{ strokeDasharray: `${(score / 100) * 352} 352` }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${getScoreColor()}`}>{score}</span>
          <span className="text-xs text-muted-foreground">SCORE</span>
        </div>
      </motion.div>

      {/* Accuracy display */}
      <motion.div
        className="mb-4 px-4 py-2 rounded-full bg-muted/30 border border-border/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <span className="text-sm text-muted-foreground">Accuracy: </span>
        <span className={`text-sm font-bold ${getScoreColor()}`}>{accuracy}%</span>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        className="grid grid-cols-3 gap-4 w-full max-w-xs mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <div className="flex items-center justify-center mb-1">
            <Target className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-xl font-bold text-foreground">{stats.hits}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Hits</p>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="w-4 h-4 rounded-full border-2 border-amber-400" />
          </div>
          <p className="text-xl font-bold text-foreground">{stats.misses}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Missed</p>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <div className="flex items-center justify-center mb-1">
            {stats.avgReactionTime !== undefined ? (
              <Clock className="w-4 h-4 text-blue-400" />
            ) : (
              <Zap className="w-4 h-4 text-red-400" />
            )}
          </div>
          <p className="text-xl font-bold text-foreground">
            {stats.avgReactionTime !== undefined 
              ? `${stats.avgReactionTime}` 
              : stats.falseAlarms ?? 0}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase">
            {stats.avgReactionTime !== undefined ? 'ms RT' : 'Wrong'}
          </p>
        </div>
      </motion.div>

      {/* Continue button */}
      <motion.button
        className={`w-full max-w-xs py-4 rounded-xl font-semibold text-lg ${
          isHighScore 
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
            : 'bg-primary text-primary-foreground'
        }`}
        whileTap={{ scale: 0.98 }}
        onClick={onContinue}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        Continue
      </motion.button>
    </motion.div>
  );
};

export default DrillCompletionScreen;
