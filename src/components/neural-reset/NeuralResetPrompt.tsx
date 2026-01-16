import { motion } from "framer-motion";
import { Activity } from "lucide-react";
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
          "w-full p-2.5 rounded-lg border transition-all duration-200",
          "text-left active:scale-[0.99]",
          isRecommended
            ? "bg-muted/40 border-muted-foreground/20 hover:border-muted-foreground/30"
            : "bg-card/30 border-border/30 hover:border-border/50"
        )}
      >
        <div className="flex items-center gap-2">
          <Activity className={cn(
            "w-3.5 h-3.5 shrink-0",
            isRecommended ? "text-muted-foreground" : "text-muted-foreground/50"
          )} />
          <span className={cn(
            "text-[11px] font-medium",
            isRecommended ? "text-foreground/80" : "text-muted-foreground"
          )}>
            Neural Reset
          </span>
          {isRecommended && (
            <span className="text-[8px] px-1.5 py-0.5 bg-muted/50 rounded text-muted-foreground/70 font-medium">
              Suggested
            </span>
          )}
          <span className="text-[9px] text-muted-foreground/50 ml-auto">
            {isRecommended ? "Activity high" : "Not needed"}
          </span>
        </div>
      </button>
    </motion.div>
  );
}
