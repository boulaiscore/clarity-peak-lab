// Reusable drill completion screen with results summary
import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Clock, Zap } from 'lucide-react';

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

export const DrillCompletionScreen: React.FC<DrillCompletionScreenProps> = ({
  title,
  score,
  stats,
  onContinue,
}) => {
  const getScoreColor = () => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreLabel = () => {
    if (score >= 90) return 'Excellent!';
    if (score >= 70) return 'Great job!';
    if (score >= 50) return 'Good effort';
    return 'Keep practicing';
  };

  return (
    <motion.div
      className="min-h-screen bg-background flex flex-col items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Trophy icon */}
      <motion.div
        className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
      >
        <Trophy className="w-10 h-10 text-primary" />
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
            className="stroke-primary"
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
        className="w-full max-w-xs py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg"
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
