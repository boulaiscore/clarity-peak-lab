import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { Play, Leaf, Target, Flame, Sparkles, Brain, Zap } from "lucide-react";
import { TrainingPlanId, getTrainingPlan, SessionConfig } from "@/lib/trainingPlans";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useCognitiveReadiness } from "@/hooks/useCognitiveReadiness";
import { cn } from "@/lib/utils";

const PLAN_ICONS: Record<TrainingPlanId, React.ElementType> = {
  light: Leaf,
  expert: Target,
  superhuman: Flame,
};

const PLAN_TAGLINES: Record<TrainingPlanId, string> = {
  light: "Maintain cognitive sharpness",
  expert: "Build depth & control",
  superhuman: "Elite cognitive conditioning",
};

// Readiness interpretation based on score
function getReadinessInterpretation(score: number): string {
  if (score >= 80) return "Excellent condition for high cognitive load";
  if (score >= 65) return "Good condition for demanding sessions";
  if (score >= 50) return "Moderate capacity — focus on technique";
  if (score >= 35) return "Reduced capacity — lighter load recommended";
  return "Low readiness — consider recovery focus";
}

// Today's focus based on session type
function getTodaysFocus(session: SessionConfig | null): string {
  if (!session) return "Complete your assessment to begin training";
  
  const focusMap: Record<string, string> = {
    "fast-focus": "Speed and attentional control under time pressure",
    "mixed": "Balanced processing across cognitive systems",
    "consolidation": "Deep consolidation and reflective reasoning",
    "fast-control": "Rapid decision-making with precision",
    "slow-reasoning": "Deliberate analysis and structured thinking",
    "dual-process": "Integration of intuitive and analytical processing",
    "heavy-slow": "Sustained reasoning under cognitive load",
    "dual-stress": "System coordination under interference",
    "reflection": "Meta-cognitive consolidation and insight",
  };
  
  return focusMap[session.id] || "Cognitive performance optimization";
}

// Get system type label
function getSystemLabel(systems: ("S1" | "S2")[]): string {
  if (systems.length === 2) return "Dual Process";
  if (systems.includes("S2")) return "System 2";
  return "System 1";
}

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const trainingPlan = (user?.trainingPlan || "light") as TrainingPlanId;
  const plan = getTrainingPlan(trainingPlan);
  const PlanIcon = PLAN_ICONS[trainingPlan];

  const { sessionsCompleted, getNextSession } = useWeeklyProgress();
  const { cognitiveReadinessScore, isLoading: readinessLoading } = useCognitiveReadiness();

  const hasProtocol = !!user?.trainingPlan;
  const nextSession = getNextSession();
  
  const readinessScore = cognitiveReadinessScore ?? 50;
  const readinessInterpretation = getReadinessInterpretation(readinessScore);
  
  const todaysFocus = getTodaysFocus(nextSession);
  const weeklySessionCount = plan.sessionsPerWeek;

  const handleStartSession = () => {
    navigate("/neuro-lab");
  };

  if (!hasProtocol) {
    return (
      <AppShell>
        <main className="flex flex-col items-center justify-center min-h-[calc(100dvh-theme(spacing.12)-theme(spacing.14))] px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-sm"
          >
            <Sparkles className="w-12 h-12 text-muted-foreground/40 mx-auto mb-6" />
            <h1 className="text-xl font-semibold mb-2">Configure Your Protocol</h1>
            <p className="text-sm text-muted-foreground mb-8">
              Set up your cognitive training protocol to begin
            </p>
            <Link
              to="/onboarding"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Begin Assessment
            </Link>
          </motion.div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="flex flex-col h-[calc(100dvh-theme(spacing.12)-theme(spacing.14))] px-5 py-6 max-w-md mx-auto">
        
        {/* 1. Header / Identity */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-1">
            <PlanIcon className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold tracking-wide">{plan.name}</span>
          </div>
          <p className="text-xs text-muted-foreground">{PLAN_TAGLINES[trainingPlan]}</p>
        </motion.header>

        {/* 2. Readiness State */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Readiness</span>
            <span className={cn(
              "text-2xl font-semibold tabular-nums",
              readinessScore >= 65 ? "text-emerald-500" : 
              readinessScore >= 45 ? "text-amber-500" : "text-red-500"
            )}>
              {readinessLoading ? "—" : `${Math.round(readinessScore)}%`}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{readinessInterpretation}</p>
        </motion.section>

        {/* 3. Today's Session - PRIMARY ELEMENT */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 flex flex-col"
        >
          <div className="flex-1 flex flex-col justify-center">
            {nextSession ? (
              <div className="p-5 rounded-2xl bg-card border border-border/50 mb-6">
                {/* Session Type Badge */}
                <div className="flex items-center gap-2 mb-3">
                  {nextSession.thinkingSystems.includes("S1") && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-medium uppercase tracking-wide">
                      <Zap className="w-3 h-3" />
                      S1
                    </span>
                  )}
                  {nextSession.thinkingSystems.includes("S2") && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-medium uppercase tracking-wide">
                      <Brain className="w-3 h-3" />
                      S2
                    </span>
                  )}
                </div>

                {/* Session Name */}
                <h2 className="text-lg font-semibold mb-1">{nextSession.name}</h2>
                <p className="text-sm text-muted-foreground mb-4">{nextSession.description}</p>

                {/* Session Details */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{nextSession.duration}</span>
                  <span className="w-px h-3 bg-border" />
                  <span>{getSystemLabel(nextSession.thinkingSystems)}</span>
                  {nextSession.content?.required && (
                    <>
                      <span className="w-px h-3 bg-border" />
                      <span>Priming included</span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-card/50 border border-border/30 text-center mb-6">
                <p className="text-sm text-muted-foreground">
                  Week complete. Rest or continue in Lab.
                </p>
              </div>
            )}

            {/* Primary CTA */}
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              onClick={handleStartSession}
              disabled={!nextSession}
              className={cn(
                "w-full flex items-center justify-center gap-2.5 py-4 rounded-xl",
                "text-base font-semibold transition-all",
                nextSession
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <Play className="w-5 h-5 fill-current" />
              Start Today's Session
            </motion.button>
          </div>
        </motion.section>

        {/* 4. Today's Focus - ONE insight */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="pt-6 border-t border-border/30"
        >
          <p className="text-xs text-muted-foreground text-center">
            <span className="text-foreground/70">Today's focus:</span>{" "}
            {todaysFocus.toLowerCase()}
          </p>
          
          {/* Session indicator - secondary, minimal */}
          <p className="text-[10px] text-muted-foreground/60 text-center mt-2 uppercase tracking-widest">
            Session {sessionsCompleted + 1} of {weeklySessionCount} this week
          </p>
        </motion.footer>
      </main>
    </AppShell>
  );
};

export default Home;
