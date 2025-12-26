import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { Play, Sparkles } from "lucide-react";
import { TrainingPlanId } from "@/lib/trainingPlans";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { TrainHeader } from "@/components/app/TrainHeader";
import { CognitiveAgeSphere } from "@/components/dashboard/CognitiveAgeSphere";
import { useUserMetrics } from "@/hooks/useExercises";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const firstName = user?.name?.split(" ")[0] || "there";
  const trainingPlan = (user?.trainingPlan || "light") as TrainingPlanId;

  const {
    sessionsCompleted,
    sessionsRequired,
    weeklyXPEarned,
    weeklyXPTarget,
  } = useWeeklyProgress();

  const { data: metrics } = useUserMetrics(user?.id);

  // Cognitive Age calculation (same as Dashboard)
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

    return {
      cognitiveAge: currentCognitiveAge,
      delta,
      chronologicalAge: user?.age,
    };
  }, [metrics, user?.age]);

  const hasProtocol = !!user?.trainingPlan;

  const handleStartSession = () => {
    navigate("/neuro-lab");
  };

  return (
    <AppShell>
      <main className="px-5 py-6 max-w-md mx-auto" aria-label="Train">
        <TrainHeader
          trainingPlan={trainingPlan}
          sessionsCompleted={sessionsCompleted}
          sessionsRequired={sessionsRequired}
          weeklyXPEarned={weeklyXPEarned}
          weeklyXPTarget={weeklyXPTarget}
          greetingName={firstName}
        />

        {/* Cognitive Age Sphere */}
        {hasProtocol ? (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-card/50 border border-border/30 overflow-hidden"
            aria-label="Cognitive Age"
          >
            <CognitiveAgeSphere
              cognitiveAge={cognitiveAgeData.cognitiveAge}
              delta={cognitiveAgeData.delta}
              chronologicalAge={cognitiveAgeData.chronologicalAge}
            />
          </motion.section>
        ) : (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-4 rounded-2xl bg-card/50 border border-border/30 text-center py-8"
          >
            <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-[13px] text-foreground font-medium mb-1">Set up your training plan</p>
            <p className="text-[11px] text-muted-foreground mb-4">
              Personalize your cognitive training journey
            </p>
            <Link
              to="/onboarding"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </motion.section>
        )}

        {/* Start Training CTA */}
        {hasProtocol && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-5"
          >
            <button
              onClick={handleStartSession}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-primary-foreground text-[15px] font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
            >
              <Play className="w-5 h-5 fill-current" />
              Start Training
            </button>
          </motion.div>
        )}

        {/* Tip */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-center pt-6"
        >
          <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
            Train consistently to see your
            <br />
            cognitive age improve over time
          </p>
        </motion.footer>
      </main>
    </AppShell>
  );
};

export default Home;
