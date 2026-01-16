import { useState } from "react";
import { ChevronDown, ChevronUp, Brain, Link2, Sprout } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { SCIBreakdown } from "@/lib/cognitiveNetworkScore";

interface SCIExplanationProps {
  sciBreakdown?: SCIBreakdown | null;
}

/**
 * Plain-language explanation of the Cognitive Network
 * Uses Activity, Stability, Consolidation terminology
 * Observational tone - not judgmental
 */
export function SCIExplanation({ sciBreakdown }: SCIExplanationProps) {
  const [isFormulaOpen, setIsFormulaOpen] = useState(false);

  return (
    <div className="space-y-4 text-left">
      {/* Subtitle */}
      <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
        How your cognitive activity is organizing over time.
      </p>

      {/* Explanation Block */}
      <div className="p-3 rounded-lg bg-muted/30 border border-border/20">
        <p className="text-[11px] text-foreground/90 leading-relaxed mb-2">
          Cognitive Network represents how active, stable, and integrated your cognitive systems are.
        </p>
        <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">
          It is not a measure of intelligence or ability, but of <span className="text-foreground/80">activation</span>, <span className="text-foreground/80">consistency</span>, and <span className="text-foreground/80">integration</span>.
        </p>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          A stronger network means your cognitive systems are more active, more consistent, and better integrated over time.
        </p>
      </div>

      {/* Component Cards */}
      {sciBreakdown && (
        <div className="space-y-2">
          {/* Activity */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-primary/70" />
                <span className="text-[11px] font-medium text-foreground">Activity</span>
              </div>
              <span className="text-sm font-bold text-primary">{sciBreakdown.cognitivePerformance.score}</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-1.5">
              Represents how active and reactive your cognitive systems are right now.
            </p>
            <div className="text-[9px] text-muted-foreground/70 space-y-0.5">
              <p><span className="text-foreground/60">Shaped by:</span> Training games, session frequency, recent cognitive input</p>
            </div>
            <p className="text-[9px] text-primary/70 mt-1.5 italic">
              "How active is your cognitive system?"
            </p>
          </div>

          {/* Stability */}
          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-blue-400/70" />
                <span className="text-[11px] font-medium text-foreground">Stability</span>
              </div>
              <span className="text-sm font-bold text-blue-400">{sciBreakdown.behavioralEngagement.score}</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-1.5">
              Represents how consistent and repeatable your cognitive activity is over time.
            </p>
            <div className="text-[9px] text-muted-foreground/70 space-y-0.5">
              <p><span className="text-foreground/60">Shaped by:</span> Weekly consistency, balanced training, continuity without long stops</p>
            </div>
            <p className="text-[9px] text-blue-400/70 mt-1.5 italic">
              "How consistent is your cognitive activity?"
            </p>
          </div>

          {/* Consolidation */}
          <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5 text-purple-400/70" />
                <span className="text-[11px] font-medium text-foreground">Consolidation</span>
              </div>
              <span className="text-sm font-bold text-purple-400">{sciBreakdown.recoveryFactor.score}</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-1.5">
              Represents how well cognitive activity is being integrated and retained.
            </p>
            <div className="text-[9px] text-muted-foreground/70 space-y-0.5">
              <p><span className="text-foreground/60">Shaped by:</span> Digital detox, walking, recovery time, avoiding overload</p>
            </div>
            <p className="text-[9px] text-purple-400/70 mt-1.5 italic">
              "Is your system integrating what you train?"
            </p>
          </div>
        </div>
      )}

      {/* Integration Note */}
      <div className="p-2.5 rounded-lg bg-muted/20 border border-border/10">
        <p className="text-[9px] text-muted-foreground leading-relaxed text-center">
          All three components work together.
          <br />
          <span className="text-foreground/60">Activity</span> without stability doesn't build lasting patterns.
          <span className="text-foreground/60"> Stability</span> without consolidation leads to shallow gains.
          <span className="text-foreground/60"> Consolidation</span> without activity has nothing to integrate.
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
              Network = 0.50 × Activity + 0.30 × Stability + 0.20 × Consolidation
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
