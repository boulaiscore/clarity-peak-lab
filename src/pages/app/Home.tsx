import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { Play, Sparkles, Flame, Leaf, Target, Settings2 } from "lucide-react";
import { TrainingPlanId, getTrainingPlan } from "@/lib/trainingPlans";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { CognitiveAgeSphere } from "@/components/dashboard/CognitiveAgeSphere";
import { LastSessionCard } from "@/components/app/LastSessionCard";
import { useUserMetrics } from "@/hooks/useExercises";
import { useLastSession } from "@/hooks/useLastSession";
import { cn } from "@/lib/utils";

const PLAN_ICONS: Record<TrainingPlanId, React.ElementType> = {
  light: Leaf,
  expert: Target,
  superhuman: Flame,
};

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const firstName = user?.name?.split(" ")[0] || "there";
  const trainingPlan = (user?.trainingPlan || "light") as TrainingPlanId;
  const plan = getTrainingPlan(trainingPlan);
  const PlanIcon = PLAN_ICONS[trainingPlan];

  const {
    sessionsCompleted,
    sessionsRequired,
    weeklyXPEarned,
    weeklyXPTarget,
  } = useWeeklyProgress();

  const { data: metrics } = useUserMetrics(user?.id);
  const { data: lastSession } = useLastSession();

  // Cognitive Age calculation
  const cognitiveAgeData = useMemo(() => {
    const baselineCognitiveAge = metrics?.baseline_cognitive_age || user?.age || 30;

    const currentFast = metrics?.fast_thinking || 50;
    const currentSlow = metrics?.slow_thinking || 50;
    const currentFocus = metrics?.focus_stability || 50;
    const currentReasoning = metrics?.reasoning_accuracy || 50;
    const currentCreativity = metrics?.creativity || 50;

    const baselineFast = metrics?.baseline_fast_thinking || 50;
    const baselineSlow = metrics?.baseline_slow_thinking || 50;
    const baselineFocus = metrics?.baseline_focus || 50;
    const baselineReasoning = metrics?.baseline_reasoning || 50;
    const baselineCreativity = metrics?.baseline_creativity || 50;

    const currentAvg =
      (currentFast + currentSlow + currentFocus + currentReasoning + currentCreativity) / 5;
    const baselineAvg =
      (baselineFast + baselineSlow + baselineFocus + baselineReasoning + baselineCreativity) / 5;

    const performanceGain = currentAvg - baselineAvg;
    const ageImprovement = performanceGain / 10;
    const currentCognitiveAge = Math.round(baselineCognitiveAge - ageImprovement);
    const delta = currentCognitiveAge - baselineCognitiveAge;

    return { cognitiveAge: currentCognitiveAge, delta };
  }, [metrics, user?.age]);

  const hasProtocol = !!user?.trainingPlan;

  const handleStartSession = () => {
    navigate("/neuro-lab");
  };

  return (
    <AppShell>
      <main className="flex flex-col h-[calc(100dvh-theme(spacing.12)-theme(spacing.14))] px-4 py-4 max-w-md mx-auto overflow-hidden">
        {/* Minimal Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <div>
            <h1 className="text-lg font-semibold">Hey {firstName}</h1>
            <p className="text-xs text-muted-foreground">Ready to train?</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/app/account")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full",
                "border border-border/50 bg-card/50",
                "hover:bg-card/80 transition-colors"
              )}
            >
              <PlanIcon className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-medium">{plan.name}</span>
            </button>
            <button
              onClick={() => navigate("/app/account")}
              className="w-8 h-8 rounded-full bg-card/50 border border-border/50 flex items-center justify-center hover:bg-card/80 transition-colors"
            >
              <Settings2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </motion.div>

        {/* Cognitive Age Sphere - centered and prominent */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          {hasProtocol ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <CognitiveAgeSphere
                cognitiveAge={cognitiveAgeData.cognitiveAge}
                delta={cognitiveAgeData.delta}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-card/50 border border-border/30 text-center"
            >
              <Sparkles className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-sm text-foreground font-medium mb-1">Set up your training plan</p>
              <p className="text-xs text-muted-foreground mb-5">
                Personalize your cognitive training journey
              </p>
              <Link
                to="/onboarding"
                className="inline-flex items-center px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Get Started
              </Link>
            </motion.div>
          )}
        </div>

        {/* Bottom section: Last Session + CTA */}
        {hasProtocol && (
          <div className="space-y-3 pb-2">
            {/* Last Session */}
            {lastSession && (
              <LastSessionCard
                area={lastSession.area}
                score={lastSession.score}
                durationOption={lastSession.duration_option}
                completedAt={lastSession.completed_at}
              />
            )}

            {/* Start Training CTA */}
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={handleStartSession}
              className={cn(
                "w-full flex items-center justify-center gap-2.5 py-4 rounded-xl",
                "bg-primary text-primary-foreground text-base font-semibold",
                "hover:bg-primary/90 active:scale-[0.98] transition-all",
                "shadow-[0_0_30px_-4px_hsl(var(--primary)/0.5)] animate-glow-pulse"
              )}
            >
              <Play className="w-5 h-5 fill-current" />
              Start Training
            </motion.button>
          </div>
        )}
      </main>
    </AppShell>
  );
};

export default Home;
