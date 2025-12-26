import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight, Dumbbell, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeeklySchedule } from "@/components/dashboard/WeeklySchedule";
import { MonthlyContentCard } from "@/components/dashboard/MonthlyContentCard";
import { TRAINING_PLANS } from "@/lib/trainingPlans";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useMonthlyContent } from "@/hooks/useMonthlyContent";

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

  const hasProtocol = !!user?.trainingPlan;
  const nextSession = getNextSession();

  return (
    <AppShell>
      <div className="px-5 py-6 max-w-md mx-auto">
        {/* Header with greeting */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mb-1">
            Cognitive Training
          </p>
          <h1 className="text-xl font-semibold tracking-tight">
            Hello, {firstName}
          </h1>
        </motion.div>

        {/* Main CTA - Cognitive Lab */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5"
        >
          <button
            onClick={() => navigate("/neuro-lab")}
            className={cn(
              "group w-full p-5 rounded-2xl",
              "bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5",
              "border border-primary/30 hover:border-primary/50",
              "transition-all duration-300 text-left active:scale-[0.98]",
              "relative overflow-hidden"
            )}
          >
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Dumbbell className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] font-semibold text-foreground mb-0.5">
                  {nextSession ? `Start: ${nextSession.name}` : "Start Training"}
                </h3>
                <p className="text-[12px] text-muted-foreground">
                  {nextSession 
                    ? `${nextSession.duration} • ${nextSession.thinkingSystems.join(" + ")}`
                    : "Focus • Reasoning • Creativity"
                  }
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <ChevronRight className="w-4 h-4 text-primary" />
              </div>
            </div>
          </button>
        </motion.div>

        {/* Training Protocol Summary with Weekly Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-card/50 border border-border/30 mb-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[13px] font-semibold text-foreground">{plan.name}</h2>
              <p className="text-[11px] text-muted-foreground">{plan.tagline}</p>
            </div>
            <Link 
              to="/app/account" 
              className="text-[11px] text-primary/70 hover:text-primary flex items-center gap-1 transition-colors"
            >
              <Settings className="w-3 h-3" />
              Edit
            </Link>
          </div>

          {hasProtocol ? (
            <WeeklySchedule 
              planId={trainingPlan} 
              completedSessionTypes={completedSessionTypes}
              gamesCompletedThisWeek={gamesCompletedThisWeek}
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

        {/* Quick Stats or Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center pt-4"
        >
          <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
            Train your brain daily to build<br />
            lasting cognitive advantage
          </p>
        </motion.div>
      </div>
    </AppShell>
  );
};

export default Home;
