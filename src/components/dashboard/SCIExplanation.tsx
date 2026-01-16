import { useState } from "react";
import { ChevronDown, ChevronUp, Zap, Target, Moon, TrendingUp, TrendingDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { SCIBreakdown } from "@/lib/cognitiveNetworkScore";

interface SCIExplanationProps {
  sciBreakdown?: SCIBreakdown | null;
}

/**
 * Neural Strength Explanation - Gym Metaphor
 * Uses Performance, Training Load, Recovery terminology (already familiar from NeuroLab)
 * Emphasizes neuronal potentiation like muscle building with rigorous formulas
 */
export function SCIExplanation({ sciBreakdown }: SCIExplanationProps) {
  const [isFormulaOpen, setIsFormulaOpen] = useState(false);
  const [isGrowthOpen, setIsGrowthOpen] = useState(false);

  return (
    <div className="space-y-4 text-left">
      {/* Subtitle */}
      <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
        How strong your reasoning and intuition are becoming.
      </p>

      {/* Intro Block - Gym Metaphor */}
      <div className="p-3 rounded-lg bg-muted/30 border border-border/20">
        <p className="text-[11px] text-foreground/90 leading-relaxed mb-2">
          Your neurons strengthen through training, just like muscles.
        </p>
        <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">
          Neural Strength represents how <span className="text-foreground/80">powerful</span> your reasoning and intuition are.
        </p>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Like muscles, neurons strengthen through: <span className="text-foreground/80">performance</span>, <span className="text-foreground/80">training load</span>, and <span className="text-foreground/80">recovery</span>.
        </p>
      </div>

      {/* Component Cards */}
      {sciBreakdown && (
        <div className="space-y-2">
          {/* Performance (50%) */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-primary/70" />
                <span className="text-[11px] font-medium text-foreground">Performance</span>
                <span className="text-[9px] text-muted-foreground/60">(50%)</span>
              </div>
              <span className="text-sm font-bold text-primary">{sciBreakdown.cognitivePerformance.score}</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-1.5">
              Average of your cognitive metrics: focus, reasoning, intuition.
            </p>
            <div className="text-[9px] text-muted-foreground/70 space-y-0.5">
              <p><span className="text-emerald-500">↑</span> Training games in NeuroLab</p>
              <p><span className="text-red-400">↓</span> Days without training (metrics decay)</p>
            </div>
            <p className="text-[9px] text-primary/70 mt-1.5 font-mono">
              = (AE + RA + CT + IN + S2) / 5
            </p>
          </div>

          {/* Training Load (30%) */}
          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-400/70" />
                <span className="text-[11px] font-medium text-foreground">Training Load</span>
                <span className="text-[9px] text-muted-foreground/60">(30%)</span>
              </div>
              <span className="text-sm font-bold text-blue-400">{sciBreakdown.behavioralEngagement.score}</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-1.5">
              Weekly XP from Games relative to your target.
            </p>
            <div className="text-[9px] text-muted-foreground/70 space-y-0.5">
              <p><span className="text-emerald-500">↑</span> Complete games in NeuroLab</p>
              <p><span className="text-red-400">↓</span> Skipped sessions, not hitting XP target</p>
            </div>
            <p className="text-[9px] text-blue-400/70 mt-1.5 font-mono">
              = min(100, weekly_games_xp / xp_target × 100)
            </p>
          </div>

          {/* Recovery (20%) */}
          <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-purple-400/70" />
                <span className="text-[11px] font-medium text-foreground">Recovery</span>
                <span className="text-[9px] text-muted-foreground/60">(20%)</span>
              </div>
              <span className="text-sm font-bold text-purple-400">{sciBreakdown.recoveryFactor.score}</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-1.5">
              Detox + Walking minutes relative to your weekly target.
            </p>
            <div className="text-[9px] text-muted-foreground/70 space-y-0.5">
              <p><span className="text-emerald-500">↑</span> Digital Detox, Walking sessions</p>
              <p><span className="text-red-400">↓</span> No recovery time, overtraining</p>
            </div>
            <p className="text-[9px] text-purple-400/70 mt-1.5 font-mono">
              = min(100, recovery_minutes / target × 100)
            </p>
          </div>
        </div>
      )}

      {/* What makes it grow / decay - Collapsible */}
      <Collapsible open={isGrowthOpen} onOpenChange={setIsGrowthOpen}>
        <CollapsibleTrigger className="flex items-center justify-center gap-1.5 w-full text-[10px] text-muted-foreground hover:text-foreground transition-colors py-1.5 font-medium">
          What makes it grow & decay
          {isGrowthOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 space-y-2">
            {/* Growth Factors */}
            <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] font-medium text-emerald-500 uppercase">What makes it grow</span>
              </div>
              <div className="text-[9px] text-muted-foreground space-y-1">
                <p>• Train in NeuroLab → metrics improve</p>
                <p>• Hit weekly XP target → consistency builds</p>
                <p>• Detox + Walk → gains consolidate</p>
              </div>
            </div>

            {/* Decay Factors */}
            <div className="p-2.5 rounded-lg bg-red-500/5 border border-red-500/20">
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[10px] font-medium text-red-400 uppercase">What makes it decay</span>
              </div>
              <div className="text-[9px] text-muted-foreground space-y-1">
                <p>• Skip training days → metrics decay</p>
                <p>• Miss XP targets → load drops</p>
                <p>• No recovery → gains don't stick</p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Integration Note */}
      <div className="p-2.5 rounded-lg bg-muted/20 border border-border/10">
        <p className="text-[9px] text-muted-foreground leading-relaxed text-center">
          All three work together.
          <br />
          <span className="text-foreground/60">Performance</span> without training load → unstable gains.
          <br />
          <span className="text-foreground/60">Training</span> without recovery → burnout.
          <br />
          <span className="text-foreground/60">Recovery</span> without training → nothing to absorb.
        </p>
        <p className="text-[9px] text-primary/70 text-center mt-1.5 font-medium">
          Neural strength grows when all three progress together.
        </p>
      </div>

      {/* Formula Disclosure - Collapsible */}
      <Collapsible open={isFormulaOpen} onOpenChange={setIsFormulaOpen}>
        <CollapsibleTrigger className="flex items-center justify-center gap-1.5 w-full text-[9px] text-muted-foreground/60 hover:text-muted-foreground transition-colors py-1">
          Full formula
          {isFormulaOpen ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 p-2.5 rounded-lg bg-muted/30 border border-border/20 space-y-2">
            <p className="text-[10px] font-mono text-muted-foreground text-center">
              Strength = 0.50×P + 0.30×T + 0.20×R
            </p>
            <div className="text-[9px] text-muted-foreground/70 space-y-1 font-mono">
              <p>P = (AE + RA + CT + IN + S2) / 5</p>
              <p>T = min(100, games_xp / target × 100)</p>
              <p>R = min(100, recovery_min / target × 100)</p>
            </div>
            <div className="text-[8px] text-muted-foreground/50 pt-1 border-t border-border/20">
              <p>AE = Attentional Efficiency (focus_stability)</p>
              <p>RA = Reactive Adaptation (fast_thinking)</p>
              <p>CT = Critical Thinking (reasoning_accuracy)</p>
              <p>IN = Intuitive Navigation (slow_thinking)</p>
              <p>S2 = (CT + IN) / 2</p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
