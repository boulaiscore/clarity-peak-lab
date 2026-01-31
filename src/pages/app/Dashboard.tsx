import { useMemo, useState, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/app/AppShell";
import { CognitiveAgeSphere } from "@/components/dashboard/CognitiveAgeSphere";
import { OverviewCarousel } from "@/components/dashboard/OverviewCarousel";
import { NeuralGrowthAnimation } from "@/components/dashboard/NeuralGrowthAnimation";
import { FastSlowBrainMap } from "@/components/dashboard/FastSlowBrainMap";

import { TrainingTasks } from "@/components/dashboard/TrainingTasks";
import { GamesStats } from "@/components/dashboard/GamesStats";
import { MetricTrendCharts } from "@/components/dashboard/MetricTrendCharts";
import { DetoxStats } from "@/components/dashboard/DetoxStats";
import { BaselineStatusCard } from "@/components/dashboard/BaselineStatusCard";
import { Button } from "@/components/ui/button";
import { Info, Loader2, Activity, BarChart3, Play, BookOpen, FileText, Sparkles, LineChart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMetrics } from "@/hooks/useExercises";
import { useCognitiveNetworkScore } from "@/hooks/useCognitiveNetworkScore";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Initialize tabs from URL params
  const initialTab = searchParams.get("tab") as "overview" | "training" | "report" | null;
  const initialSubTab = searchParams.get("subtab") as "trends" | "games" | "tasks" | "detox" | null;
  
  const [activeTab, setActiveTab] = useState<"overview" | "training" | "report">(
    initialTab && ["overview", "training", "report"].includes(initialTab) ? initialTab : "overview"
  );
  const [analyticsTab, setAnalyticsTab] = useState<"trends" | "activity">(
    initialSubTab === "trends" ? "trends" : 
    initialSubTab && ["games", "tasks", "detox"].includes(initialSubTab) ? "activity" : "trends"
  );
  const [activitySubTab, setActivitySubTab] = useState<"tasks" | "detox" | "training">(
    initialSubTab === "games" ? "training" :
    initialSubTab === "tasks" ? "tasks" :
    initialSubTab === "detox" ? "detox" : "tasks"
  );
  
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
  // S1 (Fast) = (AE + RA) / 2 = (focus_stability + fast_thinking) / 2
  // S2 (Slow) = (CT + IN) / 2 = (reasoning_accuracy + slow_thinking) / 2
  const thinkingScores = useMemo(() => {
    // Current skill values
    const AE = metrics?.focus_stability || 50;
    const RA = metrics?.fast_thinking || 50;
    const CT = metrics?.reasoning_accuracy || 50;
    const IN = metrics?.slow_thinking || 50;
    
    // Calculate S1 and S2 using correct aggregation formula
    const currentFast = Math.round((AE + RA) / 2);  // S1
    const currentSlow = Math.round((CT + IN) / 2);  // S2
    
    // Baseline skill values
    const baselineAE = metrics?.baseline_focus || 50;
    const baselineRA = metrics?.baseline_fast_thinking || 50;
    const baselineCT = metrics?.baseline_reasoning || 50;
    const baselineIN = metrics?.baseline_slow_thinking || 50;
    
    // Calculate baseline S1 and S2 with same formula
    const baselineFast = (baselineAE + baselineRA) / 2;
    const baselineSlow = (baselineCT + baselineIN) / 2;
    
    // Only show delta if user has completed at least 1 training session
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
  const { sci, statusText: sciStatusText, bottleneck, isLoading: sciLoading } = useCognitiveNetworkScore();

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
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-medium transition-all",
              activeTab === "report"
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            Report
          </button>
        </div>

        {/* Baseline Status - shows only when calibration is needed */}
        <BaselineStatusCard />

        {/* Tab Content */}
        {activeTab === "overview" ? (
          <OverviewCarousel 
            cognitiveAgeData={cognitiveAgeData}
            sci={sci}
            sciStatusText={sciStatusText}
            thinkingScores={thinkingScores}
            bottleneck={bottleneck}
          />

        ) : activeTab === "training" ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >

            {/* Two main tabs: Trends | Activity */}
            <div className="bg-muted/40 p-1 rounded-xl">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setAnalyticsTab("trends")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-200",
                    analyticsTab === "trends"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LineChart className="w-3.5 h-3.5" />
                  <span>Trends</span>
                </button>
                <button
                  onClick={() => setAnalyticsTab("activity")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-200",
                    analyticsTab === "activity"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Activity</span>
                </button>
              </div>
            </div>

            {/* Tab Content with animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={analyticsTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {analyticsTab === "trends" ? (
                  <MetricTrendCharts />
                ) : (
                  <div className="space-y-4">
                    {/* WHOOP-style segmented control for Activity breakdown */}
                    <div className="flex items-center justify-center">
                      <div className="inline-flex items-center gap-0.5 p-0.5 bg-muted/30 rounded-lg border border-border/30">
                        <button
                          onClick={() => setActivitySubTab("tasks")}
                          className={cn(
                            "px-4 py-1.5 rounded-md text-[10px] font-medium uppercase tracking-wider transition-all duration-200",
                            activitySubTab === "tasks"
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Tasks
                        </button>
                        <button
                          onClick={() => setActivitySubTab("detox")}
                          className={cn(
                            "px-4 py-1.5 rounded-md text-[10px] font-medium uppercase tracking-wider transition-all duration-200",
                            activitySubTab === "detox"
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Detox
                        </button>
                        <button
                          onClick={() => setActivitySubTab("training")}
                          className={cn(
                            "px-4 py-1.5 rounded-md text-[10px] font-medium uppercase tracking-wider transition-all duration-200",
                            activitySubTab === "training"
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Training
                        </button>
                      </div>
                    </div>

                    {/* Activity sub-content */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activitySubTab}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                      >
                        {activitySubTab === "tasks" ? (
                          <TrainingTasks />
                        ) : activitySubTab === "detox" ? (
                          <DetoxStats />
                        ) : (
                          <GamesStats />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {/* Report CTA */}
            <Link to="/app/report" className="block group">
              <div className="relative p-5 rounded-2xl bg-gradient-to-br from-card via-card to-primary/5 border border-primary/25 overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
                {/* Ambient glow effects */}
                <div className="absolute inset-0 opacity-40 pointer-events-none">
                  <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-radial from-primary/30 to-transparent rounded-full blur-2xl" />
                  <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-gradient-radial from-primary/20 to-transparent rounded-full blur-2xl" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-20 bg-primary/10 rounded-full blur-3xl" />
                </div>
                
                {/* Subtle animated shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                
                <div className="relative z-10">
                  {/* Header with icon */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 shadow-inner flex-shrink-0">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h3 className="text-[13px] sm:text-[15px] font-semibold text-foreground tracking-tight">Cognitive Intelligence Report</h3>
                        {!isPremium && (
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[7px] sm:text-[8px] font-bold uppercase tracking-wider bg-gradient-to-r from-area-fast/20 to-area-fast/10 text-area-fast border border-area-fast/30">
                            Premium
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        Deep analysis of your cognitive architecture
                      </p>
                    </div>
                  </div>
                  
                  {/* Feature highlights */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:gap-4 mb-4 px-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-primary/60" />
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground">Performance Metrics</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-primary/60" />
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground">Actionable Insights</span>
                    </div>
                  </div>
                  
                  {/* CTA Button */}
                  <Button 
                    variant={isPremium ? "premium" : "default"} 
                    className={cn(
                      "w-full h-11 text-[12px] font-medium gap-2 transition-all duration-300",
                      isPremium 
                        ? "shadow-lg shadow-primary/20" 
                        : "bg-primary/90 hover:bg-primary text-primary-foreground shadow-md shadow-primary/15"
                    )}
                  >
                    <Sparkles className="w-4 h-4" />
                    {isPremium ? "View Full Report" : "Explore Report"}
                  </Button>
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
};

export default Dashboard;
