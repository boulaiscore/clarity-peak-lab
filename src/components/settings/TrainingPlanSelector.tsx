import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TRAINING_PLANS, TrainingPlanId, TrainingPlan } from "@/lib/trainingPlans";
import { Leaf, Target, Flame, Check, Clock, ChevronDown, ChevronUp, Zap, Brain, Timer, Lock, Unlock, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const PLAN_ICONS: Record<TrainingPlanId, typeof Leaf> = {
  light: Leaf,
  expert: Target,
  superhuman: Flame,
};

const PLAN_COLORS: Record<TrainingPlanId, { bg: string; border: string; text: string; icon: string; accent: string }> = {
  light: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    icon: "text-emerald-400",
    accent: "bg-emerald-500/20",
  },
  expert: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    icon: "text-blue-400",
    accent: "bg-blue-500/20",
  },
  superhuman: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    icon: "text-red-400",
    accent: "bg-red-500/20",
  },
};

interface TrainingPlanSelectorProps {
  selectedPlan: TrainingPlanId;
  onSelectPlan: (plan: TrainingPlanId) => void;
  showDetails?: boolean;
}

export function TrainingPlanSelector({ selectedPlan, onSelectPlan, showDetails = true }: TrainingPlanSelectorProps) {
  const [expandedPlan, setExpandedPlan] = useState<TrainingPlanId | null>(null);

  const toggleExpand = (planId: TrainingPlanId) => {
    setExpandedPlan(expandedPlan === planId ? null : planId);
  };

  const plans = Object.values(TRAINING_PLANS) as TrainingPlan[];

  return (
    <div className="space-y-3">
      {/* Period explanation */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/30">
        <Timer className="w-3.5 h-3.5 text-muted-foreground" />
        <p className="text-[10px] text-muted-foreground">
          Progress is tracked on a <span className="font-medium text-foreground">rolling 7-day window</span>, not calendar weeks.
        </p>
      </div>

      {plans.map((plan) => {
        const Icon = PLAN_ICONS[plan.id];
        const colors = PLAN_COLORS[plan.id];
        const isSelected = selectedPlan === plan.id;
        const isExpanded = expandedPlan === plan.id;

        return (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "rounded-xl border transition-all duration-200",
              isSelected
                ? `${colors.bg} ${colors.border} ring-1 ring-${plan.color}-500/30`
                : "bg-muted/20 border-border/30 hover:bg-muted/30"
            )}
          >
            {/* Main Card - Always Visible */}
            <div className="p-4">
              {/* Header: Icon + Name + Daily Time */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colors.accent)}>
                    <Icon className={cn("w-5 h-5", colors.icon)} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{plan.name}</h3>
                    <p className="text-[10px] text-muted-foreground">{plan.tagline}</p>
                  </div>
                </div>
                <div className={cn("px-2.5 py-1 rounded-lg text-center", colors.accent)}>
                  <span className={cn("text-sm font-bold", colors.text)}>{plan.dailyEstimate.total}</span>
                  <p className="text-[8px] text-muted-foreground">per day</p>
                </div>
              </div>

              {/* What You Do - 3 Clear Bullets */}
              <div className="mb-3">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5">What you do</p>
                <ul className="space-y-1">
                  {plan.whatYouDo.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className={cn("w-1 h-1 rounded-full mt-1.5 flex-shrink-0", colors.text.replace("text-", "bg-"))} />
                      <span className="text-[11px] text-foreground/90 leading-tight">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Who It's For */}
              <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-muted/30">
                <p className="text-[10px] text-muted-foreground">
                  <span className="font-medium text-foreground">Best for:</span> {plan.forWhom}
                </p>
              </div>

              {/* S2 Gating Info - Key Insight */}
              <TooltipProvider>
                <div className="flex items-center gap-2 mb-3 px-2.5 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <Lock className="w-3 h-3 text-violet-400 flex-shrink-0" />
                  <p className="text-[10px] text-violet-300 flex-1">
                    S2 games require <span className="font-medium">{plan.gatingExplainer.s2Requirement}</span>
                  </p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-violet-400/50 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px] text-xs">
                      <p className="font-medium mb-1">How S2 games unlock:</p>
                      <ul className="text-[10px] space-y-0.5 text-muted-foreground">
                        <li>• S1 games (Focus, Creativity Fast) are always available</li>
                        <li>• S2 games (Reasoning, Insight) need Recovery</li>
                        <li>• {plan.gatingExplainer.prerequisiteForS2}</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>

              {/* Quick Stats Row */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center px-2 py-1.5 rounded-lg bg-muted/30">
                  <p className={cn("text-xs font-semibold", colors.text)}>{plan.xpTargetWeek}</p>
                  <p className="text-[8px] text-muted-foreground">Max XP/week</p>
                </div>
                <div className="text-center px-2 py-1.5 rounded-lg bg-muted/30">
                  <p className={cn("text-xs font-semibold", colors.text)}>{Math.round(plan.detox.weeklyMinutes / 60)}h</p>
                  <p className="text-[8px] text-muted-foreground">Recovery/week</p>
                </div>
                <div className="text-center px-2 py-1.5 rounded-lg bg-muted/30">
                  <p className={cn("text-xs font-semibold", colors.text)}>{plan.contentPerWeek}</p>
                  <p className="text-[8px] text-muted-foreground">Tasks/week</p>
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex gap-2">
                <button
                  onClick={() => onSelectPlan(plan.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all",
                    isSelected
                      ? `${colors.bg} ${colors.text} border ${colors.border}`
                      : "bg-muted/50 text-foreground hover:bg-muted"
                  )}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Selected
                    </>
                  ) : (
                    "Select Plan"
                  )}
                </button>
                {showDetails && (
                  <button
                    onClick={() => toggleExpand(plan.id)}
                    className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 text-xs text-muted-foreground transition-all"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    Details
                  </button>
                )}
              </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {showDetails && isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-2 border-t border-border/30">
                    {/* Time Breakdown */}
                    <div className="mb-4">
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-2">Daily time breakdown</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 rounded-lg bg-muted/20 text-center">
                          <Zap className="w-3 h-3 text-amber-400 mx-auto mb-1" />
                          <p className="text-[10px] font-medium">{plan.dailyEstimate.games}</p>
                          <p className="text-[8px] text-muted-foreground">Games</p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/20 text-center">
                          <Leaf className="w-3 h-3 text-green-400 mx-auto mb-1" />
                          <p className="text-[10px] font-medium">{plan.dailyEstimate.recovery}</p>
                          <p className="text-[8px] text-muted-foreground">Recovery</p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/20 text-center">
                          <Brain className="w-3 h-3 text-purple-400 mx-auto mb-1" />
                          <p className="text-[10px] font-medium">{plan.dailyEstimate.tasks}</p>
                          <p className="text-[8px] text-muted-foreground">Tasks</p>
                        </div>
                      </div>
                    </div>

                    {/* How Gating Works */}
                    <div className="mb-4">
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-2">How game access works</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10">
                          <Unlock className="w-3 h-3 text-emerald-400" />
                          <p className="text-[10px] text-emerald-300">
                            <span className="font-medium">S1 games</span> (Focus, Creativity Fast) — always available
                          </p>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-violet-500/10">
                          <Lock className="w-3 h-3 text-violet-400" />
                          <p className="text-[10px] text-violet-300">
                            <span className="font-medium">S2 games</span> (Reasoning, Insight) — require {plan.gatingExplainer.s2Requirement}
                          </p>
                        </div>
                      </div>
                      <p className="text-[9px] text-muted-foreground/70 mt-2 italic">
                        {plan.gatingExplainer.prerequisiteForS2}
                      </p>
                    </div>

                    {/* Session Templates */}
                    <div className="mb-4">
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-2">Session templates</p>
                      <div className="space-y-1.5">
                        {plan.sessions.map((session) => (
                          <div
                            key={session.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/20"
                          >
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-[8px] px-1.5 py-0.5 rounded font-medium",
                                session.thinkingSystems.includes("S2")
                                  ? "bg-violet-500/20 text-violet-400"
                                  : "bg-amber-500/20 text-amber-400"
                              )}>
                                {session.thinkingSystems.join(" + ")}
                              </span>
                              <span className="text-[10px] font-medium">{session.name}</span>
                            </div>
                            <span className="text-[9px] text-muted-foreground">{session.duration}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Weekly Caps */}
                    <div className="p-2.5 rounded-lg bg-muted/20 border border-border/20">
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-2">Weekly caps</p>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">S2 games max:</span>
                          <span className="font-medium">{plan.gamesGating.s2MaxPerWeek}/week</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Insight games max:</span>
                          <span className="font-medium">{plan.gamesGating.insightMaxPerWeek}/week</span>
                        </div>
                      </div>
                    </div>

                    {/* Philosophy */}
                    <div className="mt-3 pt-3 border-t border-border/20">
                      <p className="text-[9px] text-muted-foreground/60 italic text-center">
                        {plan.philosophy}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}