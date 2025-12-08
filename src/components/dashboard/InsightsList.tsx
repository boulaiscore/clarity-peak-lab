import { CognitiveInsight } from "@/lib/cognitiveMetrics";
import { Lightbulb, TrendingUp, ArrowRight } from "lucide-react";

interface InsightsListProps {
  insights: CognitiveInsight[];
}

export function InsightsList({ insights }: InsightsListProps) {
  const getIcon = (type: CognitiveInsight["type"]) => {
    switch (type) {
      case "positive":
        return <TrendingUp className="w-4 h-4 text-success" />;
      case "suggestion":
        return <Lightbulb className="w-4 h-4 text-amber-400" />;
      case "neutral":
        return <ArrowRight className="w-4 h-4 text-accent-primary" />;
    }
  };

  const getBorderColor = (type: CognitiveInsight["type"]) => {
    switch (type) {
      case "positive":
        return "border-l-success";
      case "suggestion":
        return "border-l-amber-400";
      case "neutral":
        return "border-l-accent-primary";
    }
  };

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Insights</h3>
      
      <div className="space-y-2">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`p-4 rounded-xl bg-surface/50 border border-border/30 border-l-2 ${getBorderColor(
              insight.type
            )} shadow-card`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getIcon(insight.type)}</div>
              <p className="text-xs text-foreground/90 leading-relaxed">{insight.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
