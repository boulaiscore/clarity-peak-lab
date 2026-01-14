import { useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/app/AppShell";
import { CognitiveAgeSphere } from "@/components/dashboard/CognitiveAgeSphere";
import { OverviewCarousel } from "@/components/dashboard/OverviewCarousel";
import { NeuralGrowthAnimation } from "@/components/dashboard/NeuralGrowthAnimation";
import { FastSlowBrainMap } from "@/components/dashboard/FastSlowBrainMap";
import { TrainingProgressHeader } from "@/components/dashboard/TrainingProgressHeader";
import { TrainingTasks } from "@/components/dashboard/TrainingTasks";
import { GamesStats } from "@/components/dashboard/GamesStats";
import { DetoxStats } from "@/components/dashboard/DetoxStats";
import { Button } from "@/components/ui/button";
import { Info, Loader2, Activity, BarChart3, Play, BookOpen, FileText, Dumbbell, BookMarked, Smartphone, Ban, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMetrics } from "@/hooks/useExercises";
import { useCognitiveNetworkScore } from "@/hooks/useCognitiveNetworkScore";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "training">("overview");
  const [trainingSubTab, setTrainingSubTab] = useState<"games" | "tasks" | "detox">("tasks");
  
  const isPremium = user?.subscriptionStatus === "premium";
  
  // Fetch real metrics from database
  const { data: metrics, isLoading: metricsLoading } = useUserMetrics(user?.id);
  
  // Calculate Cognitive Age from metrics
  const cognitiveAgeData = useMemo(() => {
    // Get baseline cognitive age from initial assessment
    const baselineCognitiveAge = metrics?.baseline_cognitive_age || user?.age || 30;
    
    // Calculate current performance scores (0-100)
    const currentFast = metrics?.fast_thinking || 50;
    const currentSlow = metrics?.slow_thinking || 50;
    const currentFocus = metrics?.focus_stability || 50;
    const currentReasoning = metrics?.reasoning_accuracy || 50;
    const currentCreativity = metrics?.creativity || 50;
    
    // Calculate baseline performance scores
    const baselineFast = metrics?.baseline_fast_thinking || 50;
    const baselineSlow = metrics?.baseline_slow_thinking || 50;
    const baselineFocus = metrics?.baseline_focus || 50;
    const baselineReasoning = metrics?.baseline_reasoning || 50;
    const baselineCreativity = metrics?.baseline_creativity || 50;
    
    // Average current and baseline performance
    const currentAvg = (currentFast + currentSlow + currentFocus + currentReasoning + currentCreativity) / 5;
    const baselineAvg = (baselineFast + baselineSlow + baselineFocus + baselineReasoning + baselineCreativity) / 5;
    
    // Calculate performance improvement (0-100 scale)
    const performanceGain = currentAvg - baselineAvg;
    
    // Convert to age improvement: every 10 points of improvement = 1 year younger
    const ageImprovement = performanceGain / 10;
    
    // Current cognitive age (lower is better)
    const currentCognitiveAge = Math.round(baselineCognitiveAge - ageImprovement);
    
    // Delta: negative means improvement (younger cognitive age)
    const delta = currentCognitiveAge - baselineCognitiveAge;
    
    return {
      cognitiveAge: currentCognitiveAge,
      baselineCognitiveAge,
      delta,
      chronologicalAge: user?.age
    };
  }, [metrics, user?.age]);
  
  // Get fast/slow thinking scores with deltas from baseline
  const thinkingScores = useMemo(() => {
    const currentFast = Math.round(metrics?.fast_thinking || 50);
    const currentSlow = Math.round(metrics?.slow_thinking || 50);
    
    // Get baseline scores from initial assessment
    const baselineFast = metrics?.baseline_fast_thinking || 50;
    const baselineSlow = metrics?.baseline_slow_thinking || 50;
    
    // Only show delta if user has completed at least 1 training session
    // (total_sessions > 0 means they've trained after baseline)
    const hasTrainedAfterBaseline = (metrics?.total_sessions || 0) > 0;
    
    // Calculate improvement from baseline only if training has occurred
    const fastDelta = hasTrainedAfterBaseline ? Math.round(currentFast - baselineFast) : 0;
    const slowDelta = hasTrainedAfterBaseline ? Math.round(currentSlow - baselineSlow) : 0;
    
    return {
      fastScore: currentFast,
      slowScore: currentSlow,
      fastDelta,
      slowDelta,
      baselineFast: Math.round(baselineFast),
      baselineSlow: Math.round(baselineSlow)
    };
  }, [metrics]);
  
  // Synthesized Cognitive Index (SCI) for neural animation
  const { sci, statusText: sciStatusText, isLoading: sciLoading } = useCognitiveNetworkScore();

  if (metricsLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-5 py-5 max-w-md mx-auto space-y-4">

        {/* Tab Switcher */}
        <div className="flex p-1 bg-card/40 rounded-xl border border-border/20">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-medium transition-all",
              activeTab === "overview"
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab("training")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-medium transition-all",
              activeTab === "training"
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Activity className="w-3.5 h-3.5" />
            Training Details
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" ? (
          <OverviewCarousel 
            cognitiveAgeData={cognitiveAgeData}
            sci={sci}
            sciStatusText={sciStatusText}
            thinkingScores={thinkingScores}
            isPremium={isPremium}
          />

        ) : (
          <div className="space-y-5">
            {/* Progress Header with Animation */}
            <TrainingProgressHeader />


            {/* Sub-tabs for Tasks/Detox/Games */}
            <div className="flex items-center gap-1 p-1 bg-card border border-border/50 rounded-lg">
              <button
                onClick={() => setTrainingSubTab("tasks")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-all",
                  trainingSubTab === "tasks"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <BookMarked className="w-3.5 h-3.5" />
                Tasks
              </button>
              <button
                onClick={() => setTrainingSubTab("detox")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-all",
                  trainingSubTab === "detox"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
              <div className="relative">
                  <Smartphone className="w-3.5 h-3.5" />
                  <Ban className="w-2 h-2 absolute -bottom-0.5 -right-1" />
                </div>
                Walk & Detox
              </button>
              <button
                onClick={() => setTrainingSubTab("games")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-all",
                  trainingSubTab === "games"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Dumbbell className="w-3.5 h-3.5" />
                Training
              </button>
            </div>

            {/* Tasks, Detox or Games Content */}
            {trainingSubTab === "tasks" ? (
              <TrainingTasks />
            ) : trainingSubTab === "detox" ? (
              <DetoxStats />
            ) : (
              <GamesStats />
            )}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="pt-1"
            >
              <Link to="/neuro-lab">
                <Button variant="premium" className="w-full h-11 text-[13px] gap-2">
                  <Play className="w-4 h-4" />
                  Start Training
                </Button>
              </Link>
            </motion.div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Dashboard;
