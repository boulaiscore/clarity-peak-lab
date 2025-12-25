import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app/AppShell";
import { CognitiveAgeSphere } from "@/components/dashboard/CognitiveAgeSphere";
import { NeuralGrowthAnimation } from "@/components/dashboard/NeuralGrowthAnimation";
import { FastSlowBrainMap } from "@/components/dashboard/FastSlowBrainMap";
import { ThinkingSystemSources } from "@/components/dashboard/ThinkingSystemSources";
import { DailyTrainingHistory } from "@/components/dashboard/DailyTrainingHistory";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { TrainingProgressHeader } from "@/components/dashboard/TrainingProgressHeader";
import { CognitiveInputs } from "@/components/dashboard/CognitiveInputs";
import { Button } from "@/components/ui/button";
import { Info, Loader2, Activity, BarChart3, Play, BookOpen, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMetrics } from "@/hooks/useExercises";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "training">("overview");
  
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
    
    // Calculate improvement from baseline
    const fastDelta = Math.round(currentFast - baselineFast);
    const slowDelta = Math.round(currentSlow - baselineSlow);
    
    return {
      fastScore: currentFast,
      slowScore: currentSlow,
      fastDelta,
      slowDelta,
      baselineFast: Math.round(baselineFast),
      baselineSlow: Math.round(baselineSlow)
    };
  }, [metrics]);
  
  // Overall score for neural animation
  const overallScore = useMemo(() => {
    return Math.round(
      ((metrics?.reasoning_accuracy || 50) + 
       (metrics?.focus_stability || 50) + 
       (metrics?.decision_quality || 50) + 
       (metrics?.creativity || 50)) / 4
    );
  }, [metrics]);

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest mt-0.5">
              Cognitive Performance
            </p>
          </div>
          <Link to="/cognitive-age">
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Info className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </Link>
        </div>

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
            Training
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" ? (
          <div className="space-y-4">
            {/* Cognitive Age */}
            <CognitiveAgeSphere 
              cognitiveAge={cognitiveAgeData.cognitiveAge} 
              delta={cognitiveAgeData.delta}
              chronologicalAge={cognitiveAgeData.chronologicalAge}
            />

            {/* Neural Growth Animation */}
            <NeuralGrowthAnimation
              cognitiveAgeDelta={-cognitiveAgeData.delta}
              overallCognitiveScore={overallScore}
            />

            {/* Thinking Systems Overview */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-foreground">Dual-Process Integration</h2>
                <Link to="/brain-science" className="flex items-center gap-1 text-[10px] text-primary hover:underline">
                  <BookOpen className="w-3 h-3" />
                  Learn more
                </Link>
              </div>
              
              <FastSlowBrainMap
                fastScore={thinkingScores.fastScore}
                fastBaseline={thinkingScores.baselineFast}
                fastDelta={thinkingScores.fastDelta}
                slowScore={thinkingScores.slowScore}
                slowBaseline={thinkingScores.baselineSlow}
                slowDelta={thinkingScores.slowDelta}
              />
            </div>

            {/* Training Sources */}
            <ThinkingSystemSources 
              baselineFocus={metrics?.baseline_focus || 50}
              baselineReasoning={metrics?.baseline_reasoning || 50}
              baselineCreativity={metrics?.baseline_creativity || 50}
              currentFocus={metrics?.focus_stability || metrics?.baseline_focus || 50}
              currentReasoning={metrics?.reasoning_accuracy || metrics?.baseline_reasoning || 50}
              currentCreativity={metrics?.creativity || metrics?.baseline_creativity || 50}
            />

            {/* Cognitive Inputs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <CognitiveInputs />
            </motion.div>

            {/* Generate Report CTA */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="pt-2"
            >
              <Link to="/app/report">
                <Button variant="outline" className="w-full h-11 text-[13px] gap-2 border-primary/30 hover:bg-primary/5">
                  <FileText className="w-4 h-4" />
                  Generate Cognitive Report
                </Button>
              </Link>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress Header with Animation */}
            <TrainingProgressHeader />

            {/* Performance Chart with fade-in */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <PerformanceChart />
            </motion.div>

            {/* Daily Training History with fade-in */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <DailyTrainingHistory />
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
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
