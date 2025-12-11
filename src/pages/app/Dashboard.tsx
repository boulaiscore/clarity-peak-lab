import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { CognitiveAgeSphere } from "@/components/dashboard/CognitiveAgeSphere";
import { NeuralGrowthAnimation } from "@/components/dashboard/NeuralGrowthAnimation";
import { FastSlowBrainMap } from "@/components/dashboard/FastSlowBrainMap";
import { ThinkingSystemSources } from "@/components/dashboard/ThinkingSystemSources";
import { DailyTrainingHistory } from "@/components/dashboard/DailyTrainingHistory";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Zap, Brain, Loader2, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMetrics } from "@/hooks/useExercises";

const Dashboard = () => {
  const { user } = useAuth();
  
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
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-5 py-6 max-w-md mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Cognitive Performance</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Brain Age Index
            </p>
          </div>
          <Link to="/cognitive-age">
            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-card shadow-card">
              <Info className="w-4 h-4 text-muted-foreground" />
            </Button>
          </Link>
        </div>

        {/* Content */}
        <div className="space-y-5">
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

          {/* Quick Training Links */}
          <div className="grid grid-cols-2 gap-3">
            <Link to="/app/trainings?mode=fast">
              <Card className="transition-all duration-200 active:scale-[0.98] hover:shadow-soft">
                <CardContent className="p-4">
                  <div className="w-11 h-11 rounded-xl bg-pastel-yellow flex items-center justify-center mb-3">
                    <Zap className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">System 1</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Pattern Recognition</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/app/trainings?mode=slow">
              <Card className="transition-all duration-200 active:scale-[0.98] hover:shadow-soft">
                <CardContent className="p-4">
                  <div className="w-11 h-11 rounded-xl bg-pastel-teal flex items-center justify-center mb-3">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">System 2</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Strategic Analysis</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Thinking Systems Overview */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-foreground">Dual-Process Integration</h2>
                <span className="text-xs text-muted-foreground font-medium">
                  vs baseline
                </span>
              </div>
              
              <FastSlowBrainMap
                fastScore={thinkingScores.fastScore}
                fastBaseline={thinkingScores.baselineFast}
                fastDelta={thinkingScores.fastDelta}
                slowScore={thinkingScores.slowScore}
                slowBaseline={thinkingScores.baselineSlow}
                slowDelta={thinkingScores.slowDelta}
              />
            </CardContent>
          </Card>

          {/* Training Sources */}
          <ThinkingSystemSources 
            baselineFocus={metrics?.baseline_focus || 50}
            baselineReasoning={metrics?.baseline_reasoning || 50}
            baselineCreativity={metrics?.baseline_creativity || 50}
            currentFocus={metrics?.focus_stability || metrics?.baseline_focus || 50}
            currentReasoning={metrics?.reasoning_accuracy || metrics?.baseline_reasoning || 50}
            currentCreativity={metrics?.creativity || metrics?.baseline_creativity || 50}
          />

          {/* Daily Training History */}
          <DailyTrainingHistory />
        </div>

        {/* CTA */}
        <div className="pt-2 pb-4">
          <Link to="/app">
            <Button variant="premium" size="lg" className="w-full">
              <span>Start Strategic Training</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
};

export default Dashboard;
