import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles } from "lucide-react";
import { UnifiedLearningPath } from "@/components/dashboard/UnifiedLearningPath";
import { TRAINING_PLANS, TrainingPlanId } from "@/lib/trainingPlans";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useMonthlyContent } from "@/hooks/useMonthlyContent";
import { useBadges } from "@/hooks/useBadges";
import { TrainHeader } from "@/components/app/TrainHeader";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const firstName = user?.name?.split(" ")[0] || "there";
  const trainingPlan = (user?.trainingPlan || "light") as TrainingPlanId;
  const plan = TRAINING_PLANS[trainingPlan];

  const {
    completedSessionTypes,
    sessionsCompleted,
    sessionsRequired,
    weeklyXPEarned,
    weeklyXPTarget,
  } = useWeeklyProgress();

  const { assignments } = useMonthlyContent();
  const { experiencePoints, cognitiveLevel } = useBadges();

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

        {/* Unified Learning Path */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl bg-card/50 border border-border/30"
          aria-label="This week’s path"
        >
          {hasProtocol ? (
            <UnifiedLearningPath
              planId={trainingPlan}
              completedSessionTypes={completedSessionTypes}
              experiencePoints={experiencePoints}
              cognitiveLevel={cognitiveLevel}
              contentAssignments={assignments || []}
              onStartSession={handleStartSession}
            />
          ) : (
            <div className="text-center py-8">
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
            </div>
          )}
        </motion.section>

        {/* Tip */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center pt-6"
        >
          <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
            Complete sessions in order to unlock
            <br />
            new content and level up faster
          </p>
        </motion.footer>
      </main>
    </AppShell>
  );
};

export default Home;
