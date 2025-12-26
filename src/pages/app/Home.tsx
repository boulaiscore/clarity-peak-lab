import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight, Dumbbell, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { LearningPathMap } from "@/components/dashboard/LearningPathMap";
import { MonthlyContentCard } from "@/components/dashboard/MonthlyContentCard";
import { TRAINING_PLANS } from "@/lib/trainingPlans";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useMonthlyContent } from "@/hooks/useMonthlyContent";
import { useBadges } from "@/hooks/useBadges";
import { startOfWeek, differenceInWeeks } from "date-fns";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const firstName = user?.name?.split(" ")[0] || "there";
  const trainingPlan = user?.trainingPlan || "light";
  const plan = TRAINING_PLANS[trainingPlan];

  const { 
    completedSessionTypes, 
    gamesCompletedThisWeek,
    getNextSession,
  } = useWeeklyProgress();

  const {
    assignments,
    completedContent,
    totalContent,
    totalReadingTime,
    requiredContentPerWeek,
    isLoading: isLoadingContent,
  } = useMonthlyContent();

  const { experiencePoints, cognitiveLevel } = useBadges();

  const hasProtocol = !!user?.trainingPlan;
  const nextSession = getNextSession();
  
  // Calculate current week number (since user started or arbitrary start)
  const startDate = user?.createdAt ? new Date(user.createdAt) : new Date("2024-01-01");
  const currentWeek = Math.max(1, differenceInWeeks(new Date(), startOfWeek(startDate)) + 1);

  const handleNodeClick = (node: any) => {
    if (node.type === "session") {
      navigate("/neuro-lab");
    }
  };

  return (
    <AppShell>
      <div className="px-5 py-6 max-w-md mx-auto">
        {/* Header with greeting */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mb-1">
            Cognitive Training
          </p>
          <h1 className="text-xl font-semibold tracking-tight">
            Hello, {firstName}
          </h1>
        </motion.div>

        {/* Main CTA - Start Training */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5"
        >
          <button
            onClick={() => navigate("/neuro-lab")}
            className={cn(
              "group w-full p-4 rounded-2xl",
              "bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5",
              "border border-primary/30 hover:border-primary/50",
              "transition-all duration-300 text-left active:scale-[0.98]",
              "relative overflow-hidden"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Dumbbell className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-semibold text-foreground mb-0.5">
                  {nextSession ? `${nextSession.name}` : "Start Training"}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {nextSession 
                    ? `${nextSession.duration} • ${nextSession.thinkingSystems.join(" + ")}`
                    : "Focus • Reasoning • Creativity"
                  }
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
          </button>
        </motion.div>

        {/* Learning Path Map - Duolingo Style */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-card/50 border border-border/30 mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">{plan.name}</span>
              <span className="text-[10px] text-muted-foreground/60">•</span>
              <span className="text-[11px] text-muted-foreground">{plan.tagline}</span>
            </div>
            <Link 
              to="/app/account" 
              className="text-[10px] text-primary/70 hover:text-primary flex items-center gap-1 transition-colors"
            >
              <Settings className="w-3 h-3" />
            </Link>
          </div>

          {hasProtocol ? (
            <LearningPathMap
              planId={trainingPlan as any}
              completedSessionTypes={completedSessionTypes}
              currentWeek={currentWeek}
              experiencePoints={experiencePoints}
              cognitiveLevel={cognitiveLevel}
              gamesCompletedThisWeek={gamesCompletedThisWeek}
              onNodeClick={handleNodeClick}
            />
          ) : (
            <div className="text-center py-4">
              <Sparkles className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-[12px] text-muted-foreground mb-2">Configure your training</p>
              <Link to="/onboarding" className="text-[12px] text-primary hover:underline">
                Complete setup →
              </Link>
            </div>
          )}
        </motion.div>

        {/* Monthly Content Card */}
        <MonthlyContentCard
          assignments={assignments || []}
          completedContent={completedContent}
          totalContent={totalContent}
          totalReadingTime={totalReadingTime}
          requiredPerWeek={requiredContentPerWeek}
          isLoading={isLoadingContent}
        />
      </div>
    </AppShell>
  );
};

export default Home;
