import { useMemo } from "react";
import { Brain, Zap, Target, TrendingUp, TrendingDown, Sparkles, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricFeedback {
  area: string;
  impact: number; // -100 to +100
  description: string;
  suggestion: string;
  isPositive: boolean;
}

interface CognitiveCoachProps {
  fastScore: number;
  slowScore: number;
  focusScore: number;
  reasoningScore: number;
  creativityScore: number;
  sessionsThisWeek: number;
}

export function CognitiveCoach({
  fastScore,
  slowScore,
  focusScore,
  reasoningScore,
  creativityScore,
  sessionsThisWeek,
}: CognitiveCoachProps) {
  const metrics = useMemo(() => {
    const feedback: MetricFeedback[] = [];

    // Focus Arena feedback
    if (focusScore >= 70) {
      feedback.push({
        area: "Focus Arena",
        impact: Math.round((focusScore - 50) / 2),
        description: "La tua attenzione selettiva sta migliorando",
        suggestion: "Continua con sessioni di Focus Arena per consolidare i progressi",
        isPositive: true,
      });
    } else if (focusScore < 50) {
      feedback.push({
        area: "Focus Arena",
        impact: Math.round((focusScore - 50) / 2),
        description: "L'attenzione richiede più allenamento",
        suggestion: "Aumenta le sessioni di Focus Arena, iniziando con esercizi Fast",
        isPositive: false,
      });
    }

    // Fast Thinking feedback
    if (fastScore >= 65) {
      feedback.push({
        area: "Fast Thinking (System 1)",
        impact: Math.round((fastScore - 50) / 2),
        description: "Il tuo pensiero intuitivo è reattivo e veloce",
        suggestion: "Sfida te stesso con pattern più complessi nel Creativity Hub",
        isPositive: true,
      });
    } else {
      feedback.push({
        area: "Fast Thinking (System 1)",
        impact: Math.round((fastScore - 50) / 2),
        description: "Il tempo di reazione può essere migliorato",
        suggestion: "Allena il riconoscimento pattern con sessioni Fast in Focus Arena",
        isPositive: false,
      });
    }

    // Slow Thinking feedback
    if (slowScore >= 65) {
      feedback.push({
        area: "Slow Thinking (System 2)",
        impact: Math.round((slowScore - 50) / 2),
        description: "L'analisi deliberata è il tuo punto di forza",
        suggestion: "Esplora esercizi Slow nel Critical Reasoning Studio per sfide avanzate",
        isPositive: true,
      });
    } else {
      feedback.push({
        area: "Slow Thinking (System 2)",
        impact: Math.round((slowScore - 50) / 2),
        description: "Il ragionamento strutturato richiede pratica",
        suggestion: "Dedica più tempo al Critical Reasoning con esercizi Slow",
        isPositive: false,
      });
    }

    // Creativity feedback
    if (creativityScore >= 60) {
      feedback.push({
        area: "Creativity Hub",
        impact: Math.round((creativityScore - 50) / 2),
        description: "Il pensiero divergente sta crescendo",
        suggestion: "Prova esercizi di associazione rapida per stimolare nuove connessioni",
        isPositive: true,
      });
    } else {
      feedback.push({
        area: "Creativity Hub",
        impact: Math.round((creativityScore - 50) / 2),
        description: "La creatività può essere potenziata",
        suggestion: "Esplora il Creativity Hub con esercizi di pattern inusuali",
        isPositive: false,
      });
    }

    // Training consistency
    if (sessionsThisWeek >= 5) {
      feedback.push({
        area: "Costanza",
        impact: 20,
        description: "Ottima costanza nell'allenamento cognitivo",
        suggestion: "Mantieni questo ritmo per risultati a lungo termine",
        isPositive: true,
      });
    } else if (sessionsThisWeek < 3) {
      feedback.push({
        area: "Costanza",
        impact: -15,
        description: "Poche sessioni questa settimana",
        suggestion: "Cerca di completare almeno 3-5 sessioni settimanali",
        isPositive: false,
      });
    }

    // Sort by absolute impact
    return feedback.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  }, [fastScore, slowScore, focusScore, reasoningScore, creativityScore, sessionsThisWeek]);

  const topInsight = useMemo(() => {
    const strongestPositive = metrics.find(m => m.isPositive);
    const strongestNegative = metrics.find(m => !m.isPositive);
    
    if (strongestNegative && Math.abs(strongestNegative.impact) > 10) {
      return {
        type: "improvement",
        title: "Area di miglioramento prioritaria",
        text: `${strongestNegative.area}: ${strongestNegative.suggestion}`,
      };
    }
    if (strongestPositive) {
      return {
        type: "strength",
        title: "Il tuo punto di forza",
        text: `${strongestPositive.area}: ${strongestPositive.description}`,
      };
    }
    return null;
  }, [metrics]);

  return (
    <div className="space-y-4">
      {/* Coach Header */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-cyan-500/10 border border-primary/20">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Neuro Coach</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Analisi personalizzata
          </p>
        </div>
      </div>

      {/* Top Insight Card */}
      {topInsight && (
        <div className={cn(
          "p-4 rounded-xl border",
          topInsight.type === "improvement" 
            ? "bg-warning/5 border-warning/20" 
            : "bg-primary/5 border-primary/20"
        )}>
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
              topInsight.type === "improvement" ? "bg-warning/20" : "bg-primary/20"
            )}>
              {topInsight.type === "improvement" ? (
                <Target className="w-4 h-4 text-warning" />
              ) : (
                <Sparkles className="w-4 h-4 text-primary" />
              )}
            </div>
            <div>
              <p className={cn(
                "text-[10px] font-medium uppercase tracking-wider mb-1",
                topInsight.type === "improvement" ? "text-warning" : "text-primary"
              )}>
                {topInsight.title}
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {topInsight.text}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Impact Analysis */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-medium text-destructive uppercase tracking-wider flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> Negativo
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            % Impatto
          </span>
          <span className="text-[10px] font-medium text-primary uppercase tracking-wider flex items-center gap-1">
            Positivo <TrendingUp className="w-3 h-3" />
          </span>
        </div>

        <div className="space-y-2">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="p-3 rounded-xl bg-card border border-border/40"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-foreground">
                  {metric.area}
                </span>
                <span className={cn(
                  "text-xs font-semibold",
                  metric.isPositive ? "text-primary" : "text-destructive"
                )}>
                  {metric.isPositive ? "+" : ""}{metric.impact}%
                </span>
              </div>
              
              {/* Impact Bar */}
              <div className="relative h-1.5 bg-muted/30 rounded-full overflow-hidden mb-2">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-0.5 h-full bg-muted-foreground/30" />
                </div>
                <div
                  className={cn(
                    "absolute top-0 h-full rounded-full transition-all",
                    metric.isPositive 
                      ? "left-1/2 bg-gradient-to-r from-primary/60 to-primary" 
                      : "right-1/2 bg-gradient-to-l from-destructive/60 to-destructive"
                  )}
                  style={{
                    width: `${Math.min(Math.abs(metric.impact), 50)}%`,
                  }}
                />
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {metric.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Personalized Suggestions */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Suggerimenti Personalizzati
        </h4>
        
        <div className="space-y-2">
          {metrics.filter(m => !m.isPositive).slice(0, 3).map((metric, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border/30"
            >
              <div className="w-6 h-6 rounded-full bg-warning/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-semibold text-warning">{index + 1}</span>
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                  {metric.area}
                </p>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {metric.suggestion}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
