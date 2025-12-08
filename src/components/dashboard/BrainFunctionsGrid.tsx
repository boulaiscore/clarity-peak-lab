import { BrainFunctionScore } from "@/lib/cognitiveMetrics";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface BrainFunctionsGridProps {
  functions: BrainFunctionScore[];
}

export function BrainFunctionsGrid({ functions }: BrainFunctionsGridProps) {
  const getStatusColor = (status: BrainFunctionScore["status"]) => {
    switch (status) {
      case "excellent": return "bg-primary";
      case "good": return "bg-primary/70";
      case "moderate": return "bg-warning";
      case "low": return "bg-destructive";
    }
  };

  const getTrendIcon = (trend: BrainFunctionScore["trend"]) => {
    switch (trend) {
      case "up": return <TrendingUp className="w-3 h-3 text-primary" />;
      case "down": return <TrendingDown className="w-3 h-3 text-destructive" />;
      case "stable": return <Minus className="w-3 h-3 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="label-uppercase">Brain Functions</h3>
      
      <div className="grid grid-cols-2 gap-2">
        {functions.map((fn) => (
          <div
            key={fn.name}
            className="p-3.5 rounded-xl bg-card border border-border/30 hover:border-border/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {fn.name}
              </span>
              <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(fn.status)}`} />
            </div>

            <div className="flex items-end justify-between">
              <span className="text-2xl font-semibold text-foreground number-display">{fn.score}</span>
              <div className="flex items-center gap-1">
                {getTrendIcon(fn.trend)}
                {fn.trend !== "stable" && (
                  <span
                    className={`text-[10px] font-medium ${
                      fn.trend === "up" ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {fn.trendPercent}%
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}