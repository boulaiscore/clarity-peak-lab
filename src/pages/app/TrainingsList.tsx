import { Link, useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Zap, Brain, ChevronRight } from "lucide-react";
import { getTrainingsByMode, getDifficultyLabel, getDurationLabel, TrainingMode } from "@/lib/trainings";
import { cn } from "@/lib/utils";

const TrainingsList = () => {
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get("mode") as TrainingMode) || "fast";
  const trainings = getTrainingsByMode(mode);

  const isFast = mode === "fast";

  return (
    <AppShell>
      <div className="container px-4 py-5 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/app">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              {isFast ? "Fast Thinking" : "Slow Thinking"}
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {isFast ? "System 1 – Intuition" : "System 2 – Structured Reasoning"}
            </p>
          </div>
        </div>

        {/* Intro Card */}
        <div className="p-4 rounded-xl bg-card border border-border/40 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isFast ? "bg-warning/10" : "bg-primary/10"
            )}>
              {isFast ? (
                <Zap className="w-5 h-5 text-warning" />
              ) : (
                <Brain className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {isFast ? "Train your intuition" : "Slow down to think at a higher level"}
              </h2>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {isFast
              ? "Fast thinking is quick, automatic, and intuitive. These drills train pattern recognition and snap judgments under time pressure."
              : "Slow thinking is deliberate, structured, and effortful. These drills practice breaking down problems and reasoning step by step."}
          </p>
        </div>

        {/* Trainings List */}
        <div className="space-y-3">
          <h3 className="label-uppercase">Available Trainings</h3>
          
          {trainings.map((training, index) => (
            <Link
              key={training.id}
              to={`/app/training/${training.id}`}
              className={cn(
                "block p-4 rounded-xl bg-card border border-border/40",
                "hover:border-primary/30 transition-colors active:scale-[0.98]",
                "animate-fade-in"
              )}
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground">{training.title}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{training.subtitle}</p>
                  
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        {getDurationLabel(training.estimatedDuration)}
                      </span>
                    </div>
                    <span className={cn(
                      "text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider",
                      training.difficulty === "beginner" && "bg-primary/10 text-primary",
                      training.difficulty === "intermediate" && "bg-warning/10 text-warning",
                      training.difficulty === "advanced" && "bg-destructive/10 text-destructive"
                    )}>
                      {getDifficultyLabel(training.difficulty)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </Link>
          ))}
        </div>

        {/* Tagline */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            Every session slightly rewires your thinking patterns
          </p>
        </div>
      </div>
    </AppShell>
  );
};

export default TrainingsList;