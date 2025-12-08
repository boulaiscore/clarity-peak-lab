import { CognitiveInsight } from "@/lib/cognitiveMetrics";
import { TrendingUp, Lightbulb, ArrowRight } from "lucide-react";

interface InsightsListProps {
  insights: CognitiveInsight[];
}

export function InsightsList({ insights }: InsightsListProps) {
  const getIcon = (type: CognitiveInsight["type"]) => {
    switch (type) {
      case "positive": return <TrendingUp className="w-3.5 h-3.5 text-primary" />;
      case "suggestion": return <Lightbulb className="w-3.5 h-3.5 text-warning" />;
      case "neutral": return <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const getBorderColor = (type: CognitiveInsight["type"]) => {
    switch (type) {
      case "positive": return "border-l-primary";
      case "suggestion": return "border-l-warning";
      case "neutral": return "border-l-muted-foreground";
    }
  };

  if (insights.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="label-uppercase">Insights</h3>
      
      <div className="space-y-2">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`p-3.5 rounded-xl bg-card border border-border/30 border-l-2 ${getBorderColor(insight.type)}`}
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5">{getIcon(insight.type)}</div>
              <p className="text-[11px] text-foreground/80 leading-relaxed">{insight.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}