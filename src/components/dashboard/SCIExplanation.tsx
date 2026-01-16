import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { SCIBreakdown } from "@/lib/cognitiveNetworkScore";

interface SCIExplanationProps {
  sciBreakdown?: SCIBreakdown | null;
}

/**
 * Plain-language explanation of the Cognitive Network (SCI)
 * Prioritizes clarity over precision - no equations visible by default
 */
export function SCIExplanation({ sciBreakdown }: SCIExplanationProps) {
  const [isFormulaOpen, setIsFormulaOpen] = useState(false);

  return (
    <div className="space-y-4 text-left">
      {/* Subtitle */}
      <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
        How your cognitive abilities, consistency, and recovery integrate over time.
      </p>

      {/* Explanation Block */}
      <div className="p-3 rounded-lg bg-muted/30 border border-border/20">
        <p className="text-[11px] text-foreground/90 leading-relaxed mb-2">
          Cognitive Network measures how well your mental systems work together over time.
        </p>
        <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">
          It is not about peak performance in a single moment, but about <span className="text-foreground/80">stability</span>, <span className="text-foreground/80">integration</span>, and <span className="text-foreground/80">sustainability</span>.
        </p>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          A strong network means your skills are developed, your training is consistent, and your system is well recovered.
        </p>
      </div>

      {/* Component Cards */}
      {sciBreakdown && (
        <div className="space-y-2">
          {/* Performance */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-foreground">Performance</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-primary">{sciBreakdown.cognitivePerformance.score}</span>
                <span className="text-[9px] text-muted-foreground/60">50%</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-1.5">
              Your actual cognitive ability level. Reflects how developed your core cognitive skills are.
            </p>
            <div className="text-[9px] text-muted-foreground/70 space-y-0.5">
              <p><span className="text-foreground/60">Improves with:</span> Training games (System 1 & 2)</p>
              <p><span className="text-foreground/60">Not affected by:</span> Detox, walking, skipped weeks</p>
            </div>
            <p className="text-[9px] text-primary/70 mt-1.5 italic">
              "How capable are you?"
            </p>
          </div>

          {/* Engagement */}
          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-foreground">Engagement</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-blue-400">{sciBreakdown.behavioralEngagement.score}</span>
                <span className="text-[9px] text-muted-foreground/60">30%</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-1.5">
              Consistency of cognitive training. Measures how regularly you train, not how good you are.
            </p>
            <div className="text-[9px] text-muted-foreground/70 space-y-0.5">
              <p><span className="text-foreground/60">Improves with:</span> Weekly training, reaching your target</p>
              <p><span className="text-foreground/60">Not affected by:</span> Skill level, recovery, extra intensity</p>
            </div>
            <p className="text-[9px] text-blue-400/70 mt-1.5 italic">
              "How consistently are you showing up?"
            </p>
          </div>

          {/* Recovery */}
          <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-foreground">Recovery</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-purple-400">{sciBreakdown.recoveryFactor.score}</span>
                <span className="text-[9px] text-muted-foreground/60">20%</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-1.5">
              System readiness for consolidation. Reflects whether your brain can absorb and stabilize improvements.
            </p>
            <div className="text-[9px] text-muted-foreground/70 space-y-0.5">
              <p><span className="text-foreground/60">Improves with:</span> Digital Detox, walking</p>
              <p><span className="text-foreground/60">Not affected by:</span> Training games, tasks, content</p>
            </div>
            <p className="text-[9px] text-purple-400/70 mt-1.5 italic">
              "Can your system sustain improvement?"
            </p>
          </div>
        </div>
      )}

      {/* Integration Note */}
      <div className="p-2.5 rounded-lg bg-muted/20 border border-border/10">
        <p className="text-[9px] text-muted-foreground leading-relaxed text-center">
          No single component is sufficient on its own.
          <br />
          <span className="text-foreground/60">Performance</span> without engagement fades.
          <span className="text-foreground/60"> Engagement</span> without recovery destabilizes.
          <span className="text-foreground/60"> Recovery</span> without training does not build skills.
        </p>
      </div>

      {/* Formula Disclosure - Collapsible */}
      <Collapsible open={isFormulaOpen} onOpenChange={setIsFormulaOpen}>
        <CollapsibleTrigger className="flex items-center justify-center gap-1.5 w-full text-[9px] text-muted-foreground/60 hover:text-muted-foreground transition-colors py-1">
          How this score is calculated
          {isFormulaOpen ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 p-2.5 rounded-lg bg-muted/30 border border-border/20">
            <p className="text-[10px] font-mono text-muted-foreground text-center">
              SCI = 0.50 × Performance + 0.30 × Engagement + 0.20 × Recovery
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
