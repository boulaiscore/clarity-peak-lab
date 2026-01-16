import { motion } from "framer-motion";
import { Activity, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNeuralResetTrigger } from "@/hooks/useNeuralReset";
import { cn } from "@/lib/utils";

interface NeuralResetPromptProps {
  isPostSession?: boolean;
  className?: string;
}

/**
 * Contextual prompt for Neural Reset
 * Shows only when trigger conditions are met (high activity + low stability)
 */
export function NeuralResetPrompt({ isPostSession = false, className }: NeuralResetPromptProps) {
  const navigate = useNavigate();
  const { shouldShow, copy, cta, isLoading } = useNeuralResetTrigger(isPostSession);
  
  if (isLoading || !shouldShow) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("w-full", className)}
    >
      <button
        onClick={() => navigate("/neural-reset")}
        className={cn(
          "w-full p-4 rounded-xl border transition-all duration-200",
          "bg-card/80 border-border/50 hover:border-border active:scale-[0.99]",
          "text-left"
        )}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-foreground/70" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-foreground">Neural Reset</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              {copy}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-foreground/60 uppercase tracking-wide">
                {cta}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
}
