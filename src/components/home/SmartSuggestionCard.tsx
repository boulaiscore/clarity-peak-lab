/**
 * SmartSuggestionCard - Renders a prioritized suggestion CTA
 * Premium UI with gradient backgrounds and micro-animations
 */

import { motion } from "framer-motion";
import { ChevronRight, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Suggestion } from "@/hooks/usePrioritizedSuggestions";
import { cn } from "@/lib/utils";

interface SmartSuggestionCardProps {
  suggestion: Suggestion;
  index?: number;
}

export function SmartSuggestionCard({ suggestion, index = 0 }: SmartSuggestionCardProps) {
  const navigate = useNavigate();
  const Icon = suggestion.icon;
  const IconSecondary = suggestion.iconSecondary;

  const getIconColor = () => {
    switch (suggestion.urgency) {
      case "critical": return "text-red-500";
      case "high": return "text-amber-500";
      case "medium": return "text-primary";
      case "low": return "text-muted-foreground";
    }
  };

  const getTextColor = () => {
    switch (suggestion.urgency) {
      case "critical": return "text-red-600 dark:text-red-400";
      case "high": return "text-amber-600 dark:text-amber-400";
      case "medium": return "text-primary";
      case "low": return "text-foreground";
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 + index * 0.04 }}
      className="mb-3"
    >
      <button
        onClick={() => navigate(suggestion.route)}
        className={cn(
          "w-full p-3.5 rounded-xl bg-gradient-to-br transition-all active:scale-[0.98] text-left",
          suggestion.colorClass
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            suggestion.urgency === "critical" ? "bg-red-500/15" :
            suggestion.urgency === "high" ? "bg-amber-500/15" :
            "bg-primary/15"
          )}>
            <div className="relative">
              <Icon className={cn("w-4 h-4", getIconColor())} />
              {IconSecondary && (
                <IconSecondary className={cn("w-4 h-4 absolute inset-0", getIconColor())} />
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={cn("text-sm font-medium", getTextColor())}>
                {suggestion.headline}
              </h3>
            </div>
            <p className="text-[10px] text-muted-foreground">{suggestion.body}</p>
          </div>
          <ChevronRight className={cn("w-4 h-4 opacity-60", getIconColor())} />
        </div>
        
        {/* Optional progress bar */}
        {suggestion.progress !== undefined && (
          <div className="mt-2.5 h-1 bg-primary/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, suggestion.progress)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        )}
      </button>
    </motion.section>
  );
}
