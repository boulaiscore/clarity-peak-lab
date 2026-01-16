import { motion } from "framer-motion";
import { Activity, ChevronRight, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNeuralResetTrigger } from "@/hooks/useNeuralReset";
import { cn } from "@/lib/utils";

interface NeuralResetPromptProps {
  className?: string;
}

/**
 * Neural Reset Button
 * Always visible as a fixed option
 * Highlighted when trigger conditions are met (high activity + low stability)
 */
export function NeuralResetPrompt({ className }: NeuralResetPromptProps) {
  const navigate = useNavigate();
  const { shouldShow, copy, isLoading } = useNeuralResetTrigger();
  
  // Always show, but style differently when conditions are met
  const isRecommended = shouldShow && !isLoading;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("w-full", className)}
    >
      <button
        onClick={() => navigate("/neural-reset")}
        className={cn(
          "w-full p-3 rounded-xl border transition-all duration-200",
          "text-left active:scale-[0.99]",
          isRecommended
            ? "bg-foreground/5 border-foreground/20 hover:border-foreground/30"
            : "bg-card/50 border-border/40 hover:border-border/60"
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
            isRecommended ? "bg-foreground/10" : "bg-muted/50"
          )}>
            <Activity className={cn(
              "w-4 h-4",
              isRecommended ? "text-foreground/70" : "text-muted-foreground"
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className={cn(
                "text-[13px] font-semibold",
                isRecommended ? "text-foreground" : "text-foreground/80"
              )}>
                Neural Reset
              </h3>
              {isRecommended && (
                <span className="flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 bg-foreground/10 rounded text-foreground/60 font-medium uppercase tracking-wider">
                  <Zap className="w-2 h-2" />
                  Suggested
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {isRecommended 
                ? copy 
                : "Activity stable. Not needed now."}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
        </div>
      </button>
    </motion.div>
  );
}
