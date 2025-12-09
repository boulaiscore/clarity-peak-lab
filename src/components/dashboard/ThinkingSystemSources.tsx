import { cn } from "@/lib/utils";
import { NEURO_GYM_AREA_CONTRIBUTIONS } from "@/lib/thinkingSystems";
import { Target, Brain, Sparkles, Database, Gauge } from "lucide-react";

const AREA_ICONS: Record<string, React.ReactNode> = {
  "Focus Arena": <Target className="w-4 h-4" />,
  "Critical Reasoning": <Brain className="w-4 h-4" />,
  "Creativity Hub": <Sparkles className="w-4 h-4" />,
  "Memory Core": <Database className="w-4 h-4" />,
  "Control Lab": <Gauge className="w-4 h-4" />,
};

export function ThinkingSystemSources() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-foreground uppercase tracking-wider">
          Training Sources
        </h3>
        <span className="text-[10px] text-muted-foreground">
          How each area develops your thinking systems
        </span>
      </div>

      <div className="space-y-2">
        {NEURO_GYM_AREA_CONTRIBUTIONS.map((area) => (
          <div 
            key={area.area}
            className="p-3 rounded-xl bg-card/50 border border-border/30 hover:border-border/50 transition-colors"
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {AREA_ICONS[area.area] || <span className="text-sm">{area.icon}</span>}
              </div>
              <span className="text-sm font-medium text-foreground">{area.area}</span>
            </div>

            {/* Dual bar visualization */}
            <div className="mb-2">
              <div className="flex h-2 rounded-full overflow-hidden bg-muted/30">
                {/* Fast contribution */}
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500"
                  style={{ width: `${area.fastContribution}%` }}
                />
                {/* Slow contribution */}
                <div 
                  className="bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-500"
                  style={{ width: `${area.slowContribution}%` }}
                />
              </div>
              
              {/* Labels */}
              <div className="flex justify-between mt-1">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span className="text-[10px] text-cyan-400">{area.fastContribution}% Fast</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-violet-400">{area.slowContribution}% Slow</span>
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-[10px] text-muted-foreground mb-2">
              {area.description}
            </p>

            {/* Example exercises */}
            <div className="flex gap-4">
              <div className="flex-1">
                <span className="text-[9px] text-cyan-400/70 uppercase tracking-wider">Fast drills</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {area.fastExamples.slice(0, 2).map((ex) => (
                    <span 
                      key={ex} 
                      className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/10 text-cyan-400/80"
                    >
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <span className="text-[9px] text-violet-400/70 uppercase tracking-wider">Slow drills</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {area.slowExamples.slice(0, 2).map((ex) => (
                    <span 
                      key={ex} 
                      className="px-1.5 py-0.5 rounded text-[9px] bg-violet-500/10 text-violet-400/80"
                    >
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
