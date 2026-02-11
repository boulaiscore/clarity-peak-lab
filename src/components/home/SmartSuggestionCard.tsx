/**
 * SmartSuggestionCard - Renders a prioritized suggestion CTA
 * Premium unified neutral style - no colored gradients
 */

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
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

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 + index * 0.04 }}
      className="mb-4"
    >
      <button
        onClick={() => navigate(suggestion.route)}
        className="w-full p-3.5 rounded-xl bg-muted/15 border border-border/20 hover:border-border/40 transition-all active:scale-[0.98] text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
            <div className="relative">
              <Icon className="w-4 h-4 text-muted-foreground" />
              {IconSecondary && (
                <IconSecondary className="w-4 h-4 absolute inset-0 text-muted-foreground" />
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-foreground">
                {suggestion.headline}
              </h3>
            </div>
            <p className="text-[10px] text-muted-foreground">{suggestion.body}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
        </div>
        
        {/* Optional progress bar */}
        {suggestion.progress !== undefined && (
          <div className="mt-2.5 h-1 bg-muted/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-foreground/30 rounded-full"
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
