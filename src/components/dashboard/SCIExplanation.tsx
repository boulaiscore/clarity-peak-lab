import { useState } from "react";
import { ChevronDown, ChevronUp, Zap, Target, Moon, TrendingUp, TrendingDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { SCIBreakdown } from "@/lib/cognitiveNetworkScore";

interface SCIExplanationProps {
  sciBreakdown?: SCIBreakdown | null;
}

/**
 * Neural Strength Explanation - Gym Metaphor
 * Uses Intensity, Consistency, Recovery terminology
 * Emphasizes neuronal potentiation like muscle building
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
          Like muscles, neurons strengthen through: <span className="text-foreground/80">stimulus</span>, <span className="text-foreground/80">consistency</span>, and <span className="text-foreground/80">recovery</span>.
        </p>
      </div>

      {/* Component Cards */}
      {sciBreakdown && (
        <div className="space-y-2">
          {/* Intensity (50%) */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-primary/70" />
                <span className="text-[11px] font-medium text-foreground">Intensity</span>
                <span className="text-[9px] text-muted-foreground/60">(50%)</span>
              </div>
              <span className="text-sm font-bold text-primary">{sciBreakdown.cognitivePerformance.score}</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-1.5">
              How much you're stimulating your neurons right now.
            </p>
            <div className="text-[9px] text-muted-foreground/70 space-y-0.5">
              <p><span className="text-emerald-500">↑</span> Training games, session frequency</p>
              <p><span className="text-red-400">↓</span> Days without training</p>
            </div>
            <p className="text-[9px] text-primary/70 mt-1.5 italic">
              "Like lifting weights — more reps, more stimulation."
            </p>
          </div>

          {/* Consistency (30%) */}
          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-400/70" />
                <span className="text-[11px] font-medium text-foreground">Consistency</span>
                <span className="text-[9px] text-muted-foreground/60">(30%)</span>
              </div>
              <span className="text-sm font-bold text-blue-400">{sciBreakdown.behavioralEngagement.score}</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-1.5">
              How regularly you're training over time.
            </p>
            <div className="text-[9px] text-muted-foreground/70 space-y-0.5">
              <p><span className="text-emerald-500">↑</span> Weekly sessions, hitting targets</p>
              <p><span className="text-red-400">↓</span> Skipped weeks, irregular training</p>
            </div>
            <p className="text-[9px] text-blue-400/70 mt-1.5 italic">
              "Like going to the gym 3x/week vs once a month."
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
              How well your neurons are absorbing the training.
            </p>
            <div className="text-[9px] text-muted-foreground/70 space-y-0.5">
              <p><span className="text-emerald-500">↑</span> Detox, walking, rest</p>
              <p><span className="text-red-400">↓</span> Overtraining, no downtime</p>
            </div>
            <p className="text-[9px] text-purple-400/70 mt-1.5 italic">
              "Muscles don't grow in the gym — they grow during rest."
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
                <p>• Train regularly → neurons fire more</p>
                <p>• Be consistent → connections stabilize</p>
                <p>• Recover properly → gains consolidate</p>
              </div>
            </div>

            {/* Decay Factors */}
            <div className="p-2.5 rounded-lg bg-red-500/5 border border-red-500/20">
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[10px] font-medium text-red-400 uppercase">What makes it decay</span>
              </div>
              <div className="text-[9px] text-muted-foreground space-y-1">
                <p>• Stop training → connections weaken</p>
                <p>• Skip weeks → stability drops</p>
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
          <span className="text-foreground/60">Intensity</span> without consistency → unstable gains.
          <br />
          <span className="text-foreground/60">Consistency</span> without recovery → burnout.
          <br />
          <span className="text-foreground/60">Recovery</span> without intensity → nothing to absorb.
        </p>
        <p className="text-[9px] text-primary/70 text-center mt-1.5 font-medium">
          Neural strength grows when all three progress together.
        </p>
      </div>

      {/* Formula Disclosure - Collapsible */}
      <Collapsible open={isFormulaOpen} onOpenChange={setIsFormulaOpen}>
        <CollapsibleTrigger className="flex items-center justify-center gap-1.5 w-full text-[9px] text-muted-foreground/60 hover:text-muted-foreground transition-colors py-1">
          How this is calculated
          {isFormulaOpen ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 p-2.5 rounded-lg bg-muted/30 border border-border/20">
            <p className="text-[10px] font-mono text-muted-foreground text-center">
              Strength = 0.50 × Intensity + 0.30 × Consistency + 0.20 × Recovery
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
