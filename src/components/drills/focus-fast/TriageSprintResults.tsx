import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap, Target, TrendingDown, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TriageSprintResultsProps {
  results: {
    score: number;
    hits: number;
    misses?: number;
    falseAlarms: number;
    correctRejects?: number;
    xpAwarded: number;
    hitRate: number;
    falseAlarmRate: number;
    lureErrorRate: number;
    rtMean: number;
    rtP50: number;
    rtP90?: number;
    degradationSlope: number;
    isPerfect: boolean;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  onContinue: () => void;
}

export const TriageSprintResults: React.FC<TriageSprintResultsProps> = ({
  results,
  difficulty,
  onContinue,
}) => {
  // Determine performance level
  const getPerformanceLevel = () => {
    if (results.isPerfect) return { label: 'Perfect', color: 'text-amber-400', icon: Trophy };
    if (results.hitRate >= 0.8 && results.falseAlarmRate <= 0.1) return { label: 'Excellent', color: 'text-green-400', icon: Zap };
    if (results.hitRate >= 0.65) return { label: 'Good', color: 'text-blue-400', icon: Target };
    return { label: 'Keep Practicing', color: 'text-muted-foreground', icon: Target };
  };
  
  const performance = getPerformanceLevel();
  const PerformanceIcon = performance.icon;
  
  // Determine stability level
  const getStabilityLabel = () => {
    if (results.degradationSlope <= 0.05) return { label: 'Stable', color: 'text-green-400' };
    if (results.degradationSlope <= 0.15) return { label: 'Slight Drop', color: 'text-yellow-400' };
    return { label: 'Strong Drop', color: 'text-red-400' };
  };
  
  const stability = getStabilityLabel();
  
  // Determine CTA based on weakest area
  const getCTA = () => {
    if (results.falseAlarmRate > 0.15) {
      return { text: 'Train Precision (AE)', icon: AlertTriangle, desc: 'High false alarm rate — focus on accuracy' };
    }
    if (results.rtMean > 700 && results.hitRate > 0.7) {
      return { text: 'Train Speed (AE)', icon: Clock, desc: 'Accurate but slow — increase response speed' };
    }
    if (results.degradationSlope > 0.15) {
      return { text: 'Train Stability (AE)', icon: TrendingDown, desc: 'Performance dropped over time — build endurance' };
    }
    return { text: 'Continue Training', icon: Zap, desc: 'Keep building your attentional efficiency' };
  };
  
  const cta = getCTA();
  const CTAIcon = cta.icon;

  return (
    <motion.div
      className="flex flex-col items-center p-6 min-h-[500px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Performance badge */}
      <motion.div
        className="flex flex-col items-center mb-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 ${
          results.isPerfect ? 'bg-amber-500/20' : 'bg-primary/20'
        }`}>
          <PerformanceIcon className={`w-10 h-10 ${performance.color}`} />
        </div>
        <h2 className={`text-2xl font-bold ${performance.color}`}>{performance.label}</h2>
        {results.isPerfect && (
          <motion.p 
            className="text-amber-400/80 text-sm mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            +10 XP Bonus
          </motion.p>
        )}
      </motion.div>
      
      {/* Score and XP */}
      <motion.div
        className="flex gap-8 mb-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-center">
          <p className="text-4xl font-bold text-foreground">{results.score}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Score</p>
        </div>
        <div className="text-center">
          <p className="text-4xl font-bold text-primary">+{results.xpAwarded}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">XP</p>
        </div>
      </motion.div>
      
      {/* 3 Key Insights */}
      <motion.div
        className="w-full max-w-xs space-y-3 mb-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {/* Precision */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/30">
          <div className="flex items-center gap-3">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Precision</span>
          </div>
          <span className={`text-sm font-medium ${
            results.falseAlarmRate <= 0.05 ? 'text-green-400' :
            results.falseAlarmRate <= 0.15 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {Math.round((1 - results.falseAlarmRate) * 100)}%
          </span>
        </div>
        
        {/* Speed */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/30">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Speed</span>
          </div>
          <span className={`text-sm font-medium ${
            results.rtP50 <= 400 ? 'text-green-400' :
            results.rtP50 <= 600 ? 'text-yellow-400' : 'text-muted-foreground'
          }`}>
            {results.rtP50}ms
          </span>
        </div>
        
        {/* Stability */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/30">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Stability</span>
          </div>
          <span className={`text-sm font-medium ${stability.color}`}>
            {stability.label}
          </span>
        </div>
      </motion.div>
      
      {/* Detailed stats (collapsible in future) */}
      <motion.div
        className="w-full max-w-xs grid grid-cols-2 gap-2 mb-8 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex justify-between p-2 rounded-lg bg-muted/10">
          <span className="text-muted-foreground">Hits</span>
          <span className="text-green-400">{results.hits}</span>
        </div>
        <div className="flex justify-between p-2 rounded-lg bg-muted/10">
          <span className="text-muted-foreground">False Alarms</span>
          <span className="text-red-400">{results.falseAlarms}</span>
        </div>
        <div className="flex justify-between p-2 rounded-lg bg-muted/10">
          <span className="text-muted-foreground">Hit Rate</span>
          <span>{Math.round(results.hitRate * 100)}%</span>
        </div>
        <div className="flex justify-between p-2 rounded-lg bg-muted/10">
          <span className="text-muted-foreground">Lure Errors</span>
          <span>{Math.round(results.lureErrorRate * 100)}%</span>
        </div>
      </motion.div>
      
      {/* CTA insight */}
      <motion.div
        className="w-full max-w-xs p-4 rounded-xl bg-primary/10 border border-primary/20 mb-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-start gap-3">
          <CTAIcon className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-foreground text-sm">{cta.text}</p>
            <p className="text-xs text-muted-foreground mt-1">{cta.desc}</p>
          </div>
        </div>
      </motion.div>
      
      {/* Continue button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Button
          onClick={onContinue}
          className="px-10 py-6 text-lg font-semibold"
          variant="default"
        >
          Continue
        </Button>
      </motion.div>
      
      <p className="text-xs text-muted-foreground mt-4 capitalize">
        {difficulty} difficulty
      </p>
    </motion.div>
  );
};
