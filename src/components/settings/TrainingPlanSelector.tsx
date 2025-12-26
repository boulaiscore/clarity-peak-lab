import { useState } from "react";
import { motion } from "framer-motion";
import { TRAINING_PLANS, TrainingPlanId, TrainingPlan } from "@/lib/trainingPlans";
import { Leaf, Target, Flame, Check, Clock, BookOpen, Gamepad2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const PLAN_ICONS: Record<TrainingPlanId, typeof Leaf> = {
  light: Leaf,
  expert: Target,
  superhuman: Flame,
};

const PLAN_COLORS: Record<TrainingPlanId, { bg: string; border: string; text: string; icon: string }> = {
  light: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    icon: "text-emerald-400",
  },
  expert: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    icon: "text-blue-400",
  },
  superhuman: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    icon: "text-red-400",
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

  return (
    <div className="space-y-3">
      {(Object.keys(TRAINING_PLANS) as TrainingPlanId[]).map((planId) => {
        const plan = TRAINING_PLANS[planId];
        const Icon = PLAN_ICONS[planId];
        const colors = PLAN_COLORS[planId];
        const isSelected = selectedPlan === planId;
        const isExpanded = expandedPlan === planId;

        return (
          <motion.div
            key={planId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-xl border-2 transition-all overflow-hidden",
              isSelected ? colors.border : "border-border/30",
              isSelected ? colors.bg : "bg-card/50"
            )}
          >
            {/* Main Card - Clickable */}
            <button
              onClick={() => onSelectPlan(planId)}
              className="w-full p-4 text-left"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                  isSelected ? colors.bg : "bg-muted/30"
                )}>
                  <Icon className={cn("w-6 h-6", isSelected ? colors.icon : "text-muted-foreground")} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{plan.name}</h3>
                    {isSelected && (
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", colors.bg, colors.text)}>
                        Selected
                      </span>
                    )}
                  </div>
                  <p className={cn("text-xs font-medium mb-1", colors.text)}>{plan.tagline}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{plan.description}</p>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{plan.sessionDuration}/session</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Gamepad2 className="w-3 h-3" />
                      <span>{plan.sessionsPerWeek}x/week</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <BookOpen className="w-3 h-3" />
                      <span>{plan.contentPerWeek} content/week</span>
                    </div>
                  </div>
                </div>

                {/* Selection indicator */}
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                  isSelected ? `${colors.border} ${colors.bg}` : "border-border/50"
                )}>
                  {isSelected && <Check className={cn("w-3 h-3", colors.text)} />}
                </div>
              </div>
            </button>

            {/* Expand Details Button */}
            {showDetails && (
              <button
                onClick={() => toggleExpand(planId)}
                className="w-full px-4 py-2 flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-foreground border-t border-border/20 transition-colors"
              >
                {isExpanded ? (
                  <>
                    <span>Hide schedule</span>
                    <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <span>View weekly schedule</span>
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}

            {/* Expanded Details */}
            {showDetails && isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4 border-t border-border/20"
              >
                <div className="pt-3 space-y-3">
                  {/* Target Audience */}
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">For</p>
                    <div className="flex flex-wrap gap-1.5">
                      {plan.targetAudience.map((audience, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground">
                          {audience}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Weekly Schedule */}
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Weekly Schedule</p>
                    <div className="space-y-2">
                      {plan.sessions.map((session, i) => (
                        <div
                          key={session.id}
                          className="p-2.5 rounded-lg bg-muted/20 border border-border/20"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-medium">Session {i + 1}: {session.name}</span>
                            <span className="text-[9px] text-muted-foreground">{session.duration}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mb-1.5">{session.description}</p>
                          
                          <div className="flex items-center gap-2">
                            {/* Thinking Systems */}
                            <div className="flex items-center gap-1">
                              {session.thinkingSystems.map((sys) => (
                                <span
                                  key={sys}
                                  className={cn(
                                    "text-[8px] px-1.5 py-0.5 rounded font-medium",
                                    sys === "S1" ? "bg-amber-500/20 text-amber-400" : "bg-teal-500/20 text-teal-400"
                                  )}
                                >
                                  {sys}
                                </span>
                              ))}
                            </div>

                            {/* Content */}
                            {session.content && (
                              <span className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded",
                                session.content.required 
                                  ? "bg-primary/20 text-primary" 
                                  : "bg-muted/30 text-muted-foreground"
                              )}>
                                {session.content.required ? "📖 Required" : "📖 Optional"}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Content Types Allowed */}
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Content Types</p>
                    <div className="flex flex-wrap gap-1.5">
                      {plan.contentTypes.map((type) => (
                        <span key={type} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {type === "podcast" && "🎧 Podcast"}
                          {type === "reading" && "📄 Reading"}
                          {type === "book-extract" && "📚 Book"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
