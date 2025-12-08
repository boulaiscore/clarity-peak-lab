import { BrainFunctionScore } from "@/lib/cognitiveMetrics";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface BrainFunctionsGridProps {
  functions: BrainFunctionScore[];
}

export function BrainFunctionsGrid({ functions }: BrainFunctionsGridProps) {
  const getStatusColor = (status: BrainFunctionScore["status"]) => {
    switch (status) {
      case "excellent":
        return "bg-success";
      case "good":
        return "bg-accent-primary";
      case "moderate":
        return "bg-amber-400";
      case "low":
        return "bg-red-400";
    }
  };

  const getTrendIcon = (trend: BrainFunctionScore["trend"]) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3 h-3 text-success" />;
      case "down":
        return <TrendingDown className="w-3 h-3 text-red-400" />;
      case "stable":
        return <Minus className="w-3 h-3 text-text-secondary" />;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Brain Functions</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {functions.map((fn) => (
          <div
            key={fn.name}
            className="p-4 rounded-xl bg-surface/50 border border-border/30 shadow-card hover:border-accent-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-text-secondary truncate pr-2">
                {fn.name}
              </span>
              <div className={`w-2 h-2 rounded-full ${getStatusColor(fn.status)}`} />
            </div>

            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-foreground">{fn.score}</span>
              <div className="flex items-center gap-1">
                {getTrendIcon(fn.trend)}
                {fn.trend !== "stable" && (
                  <span
                    className={`text-[10px] font-medium ${
                      fn.trend === "up" ? "text-success" : "text-red-400"
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

      <p className="text-[10px] text-text-secondary/60 text-center">
        Trend based on last 7 days of training.
      </p>
    </div>
  );
}
