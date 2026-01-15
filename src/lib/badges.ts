// Cognitive Badge & Level System

import { Award, Zap, Brain, Target, Lightbulb, Sparkles, Trophy, Flame, Star, Crown, Shield, TrendingUp } from "lucide-react";

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: "progress" | "milestone" | "streak" | "mastery" | "special";
  icon: typeof Award;
  iconColor: string;
  bgColor: string;
  requirement: (metrics: BadgeMetrics) => boolean;
}

export interface BadgeMetrics {
  totalSessions: number;
  fastThinking: number;
  slowThinking: number;
  focus: number;
  reasoning: number;
  creativity: number;
  baselineFastThinking?: number;
  baselineSlowThinking?: number;
  baselineFocus?: number;
  baselineReasoning?: number;
  baselineCreativity?: number;
  cognitiveLevel: number;
  experiencePoints: number;
  consecutiveDays?: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  badge_name: string;
  badge_description: string | null;
  badge_category: string;
  earned_at: string;
  created_at: string;
}

// Level definitions
export const LEVELS = [
  { level: 1, name: "Novice", minXP: 0, maxXP: 100, color: "text-slate-400" },
  { level: 2, name: "Learner", minXP: 100, maxXP: 250, color: "text-emerald-400" },
  { level: 3, name: "Practitioner", minXP: 250, maxXP: 500, color: "text-blue-400" },
  { level: 4, name: "Adept", minXP: 500, maxXP: 1000, color: "text-violet-400" },
  { level: 5, name: "Expert", minXP: 1000, maxXP: 2000, color: "text-amber-400" },
  { level: 6, name: "Master", minXP: 2000, maxXP: 4000, color: "text-orange-400" },
  { level: 7, name: "Grandmaster", minXP: 4000, maxXP: 8000, color: "text-rose-400" },
  { level: 8, name: "Elite", minXP: 8000, maxXP: 15000, color: "text-cyan-400" },
  { level: 9, name: "Legend", minXP: 15000, maxXP: 30000, color: "text-yellow-400" },
  { level: 10, name: "Transcendent", minXP: 30000, maxXP: Infinity, color: "text-primary" },
];

// XP rewards
export const XP_REWARDS = {
  sessionComplete: 10,
  perfectSession: 25,
  dailyStreak: 15,
  badgeEarned: 50,
  levelUp: 100,
};

// Calculate level from XP
export function getLevelFromXP(xp: number): { level: number; name: string; progress: number; xpToNext: number; color: string } {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) {
      const current = LEVELS[i];
      const xpInLevel = xp - current.minXP;
      const xpForLevel = current.maxXP - current.minXP;
      const progress = Math.min(100, (xpInLevel / xpForLevel) * 100);
      const xpToNext = Math.max(0, current.maxXP - xp);
      return {
        level: current.level,
        name: current.name,
        progress,
        xpToNext,
        color: current.color,
      };
    }
  }
  return { level: 1, name: "Novice", progress: 0, xpToNext: 100, color: "text-slate-400" };
}

// Calculate improvement percentage from baseline
// Returns 0 if baseline is undefined, null, or 0 (no valid baseline to compare)
export function calculateImprovement(current: number, baseline?: number | null): number {
  if (baseline === undefined || baseline === null || baseline === 0) return 0;
  return Math.round(((current - baseline) / baseline) * 100);
}

// Check if a valid baseline exists for improvement comparison
export function hasValidBaseline(baseline?: number | null): boolean {
  return baseline !== undefined && baseline !== null && baseline > 0;
}

// All available badges
export const BADGES: Badge[] = [
  // Progress badges (first achievements)
  {
    id: "first_session",
    name: "First Steps",
    description: "Complete your first training session",
    category: "progress",
    icon: Star,
    iconColor: "text-amber-400",
    bgColor: "bg-amber-500/15",
    requirement: (m) => m.totalSessions >= 1,
  },
  {
    id: "ten_sessions",
    name: "Committed",
    description: "Complete 10 training sessions",
    category: "progress",
    icon: Flame,
    iconColor: "text-orange-400",
    bgColor: "bg-orange-500/15",
    requirement: (m) => m.totalSessions >= 10,
  },
  {
    id: "fifty_sessions",
    name: "Dedicated",
    description: "Complete 50 training sessions",
    category: "progress",
    icon: Trophy,
    iconColor: "text-yellow-400",
    bgColor: "bg-yellow-500/15",
    requirement: (m) => m.totalSessions >= 50,
  },
  {
    id: "hundred_sessions",
    name: "Century Mind",
    description: "Complete 100 training sessions",
    category: "progress",
    icon: Crown,
    iconColor: "text-primary",
    bgColor: "bg-primary/15",
    requirement: (m) => m.totalSessions >= 100,
  },

  // Improvement badges (compared to baseline)
  // IMPORTANT: These require a valid baseline to be set first
  {
    id: "fast_improvement_10",
    name: "S1 Calibration I",
    description: "System 1 processing calibrated 10% above baseline",
    category: "milestone",
    icon: Zap,
    iconColor: "text-amber-400",
    bgColor: "bg-amber-500/15",
    requirement: (m) => hasValidBaseline(m.baselineFastThinking) && calculateImprovement(m.fastThinking, m.baselineFastThinking) >= 10,
  },
  {
    id: "fast_improvement_25",
    name: "S1 Calibration II",
    description: "System 1 processing calibrated 25% above baseline",
    category: "milestone",
    icon: Zap,
    iconColor: "text-amber-400",
    bgColor: "bg-amber-500/15",
    requirement: (m) => hasValidBaseline(m.baselineFastThinking) && calculateImprovement(m.fastThinking, m.baselineFastThinking) >= 25,
  },
  {
    id: "slow_improvement_10",
    name: "S2 Calibration I",
    description: "System 2 processing calibrated 10% above baseline",
    category: "milestone",
    icon: Brain,
    iconColor: "text-teal-400",
    bgColor: "bg-teal-500/15",
    requirement: (m) => hasValidBaseline(m.baselineSlowThinking) && calculateImprovement(m.slowThinking, m.baselineSlowThinking) >= 10,
  },
  {
    id: "slow_improvement_25",
    name: "S2 Calibration II",
    description: "System 2 processing calibrated 25% above baseline",
    category: "milestone",
    icon: Brain,
    iconColor: "text-teal-400",
    bgColor: "bg-teal-500/15",
    requirement: (m) => hasValidBaseline(m.baselineSlowThinking) && calculateImprovement(m.slowThinking, m.baselineSlowThinking) >= 25,
  },
  {
    id: "focus_improvement_10",
    name: "Attention Calibration",
    description: "Focus metrics calibrated 10% above baseline",
    category: "milestone",
    icon: Target,
    iconColor: "text-emerald-400",
    bgColor: "bg-emerald-500/15",
    requirement: (m) => hasValidBaseline(m.baselineFocus) && calculateImprovement(m.focus, m.baselineFocus) >= 10,
  },
  {
    id: "reasoning_improvement_10",
    name: "Reasoning Calibration",
    description: "Reasoning metrics calibrated 10% above baseline",
    category: "milestone",
    icon: Lightbulb,
    iconColor: "text-blue-400",
    bgColor: "bg-blue-500/15",
    requirement: (m) => hasValidBaseline(m.baselineReasoning) && calculateImprovement(m.reasoning, m.baselineReasoning) >= 10,
  },
  {
    id: "creativity_improvement_10",
    name: "Divergent Calibration",
    description: "Creativity metrics calibrated 10% above baseline",
    category: "milestone",
    icon: Sparkles,
    iconColor: "text-violet-400",
    bgColor: "bg-violet-500/15",
    requirement: (m) => hasValidBaseline(m.baselineCreativity) && calculateImprovement(m.creativity, m.baselineCreativity) >= 10,
  },

  // Mastery badges (score thresholds)
  {
    id: "fast_master",
    name: "Speed Master",
    description: "Reach 80+ Fast Thinking score",
    category: "mastery",
    icon: Zap,
    iconColor: "text-amber-400",
    bgColor: "bg-amber-500/15",
    requirement: (m) => m.fastThinking >= 80,
  },
  {
    id: "slow_master",
    name: "Sage",
    description: "Reach 80+ Slow Thinking score",
    category: "mastery",
    icon: Brain,
    iconColor: "text-teal-400",
    bgColor: "bg-teal-500/15",
    requirement: (m) => m.slowThinking >= 80,
  },
  {
    id: "balanced_mind",
    name: "Balanced Mind",
    description: "Reach 70+ in both Fast and Slow Thinking",
    category: "mastery",
    icon: Shield,
    iconColor: "text-primary",
    bgColor: "bg-primary/15",
    requirement: (m) => m.fastThinking >= 70 && m.slowThinking >= 70,
  },
  {
    id: "all_rounder",
    name: "Renaissance Mind",
    description: "Reach 65+ in all cognitive areas",
    category: "mastery",
    icon: Crown,
    iconColor: "text-primary",
    bgColor: "bg-primary/15",
    requirement: (m) => 
      m.fastThinking >= 65 && 
      m.slowThinking >= 65 && 
      m.focus >= 65 && 
      m.reasoning >= 65 && 
      m.creativity >= 65,
  },

  // Level badges
  {
    id: "level_5",
    name: "Expert Status",
    description: "Reach Level 5 (Expert)",
    category: "special",
    icon: TrendingUp,
    iconColor: "text-amber-400",
    bgColor: "bg-amber-500/15",
    requirement: (m) => m.cognitiveLevel >= 5,
  },
  {
    id: "level_10",
    name: "Transcendent",
    description: "Reach Level 10 (Maximum)",
    category: "special",
    icon: Crown,
    iconColor: "text-primary",
    bgColor: "bg-primary/15",
    requirement: (m) => m.cognitiveLevel >= 10,
  },
];

// Maximum badges that can be earned in a single session
const MAX_BADGES_PER_SESSION = 2;

// Check which badges a user has earned (limited to prevent badge spam)
export function checkEarnedBadges(metrics: BadgeMetrics, existingBadgeIds: string[]): Badge[] {
  const eligibleBadges = BADGES.filter(badge => 
    !existingBadgeIds.includes(badge.id) && badge.requirement(metrics)
  );
  
  // Prioritize: progress > milestone > mastery > special
  // Then limit to MAX_BADGES_PER_SESSION
  const priorityOrder: Record<string, number> = {
    progress: 1,
    milestone: 2,
    mastery: 3,
    special: 4,
    streak: 5,
  };
  
  const sorted = eligibleBadges.sort((a, b) => 
    (priorityOrder[a.category] || 99) - (priorityOrder[b.category] || 99)
  );
  
  return sorted.slice(0, MAX_BADGES_PER_SESSION);
}

// Get badge by ID
export function getBadgeById(badgeId: string): Badge | undefined {
  return BADGES.find(b => b.id === badgeId);
}
