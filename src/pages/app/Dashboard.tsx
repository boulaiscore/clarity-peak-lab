import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { StrategicCognitiveIndex } from "@/components/dashboard/CognitiveAgeSphere";
import { NeuralGrowthAnimation } from "@/components/dashboard/NeuralGrowthAnimation";
import { FastSlowBrainMap } from "@/components/dashboard/FastSlowBrainMap";
import { ThinkingSystemSources } from "@/components/dashboard/ThinkingSystemSources";
import { Button } from "@/components/ui/button";
import { Info, Zap, Brain, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMetrics } from "@/hooks/useExercises";

const Dashboard = () => {
  const { user } = useAuth();
  
  // Fetch real metrics from database
  const { data: metrics, isLoading: metricsLoading } = useUserMetrics(user?.id);
  
  // Calculate SCI (Strategic Cognitive Index) from metrics
  const sciData = useMemo(() => {
    // Calculate current SCI score from current metrics (0-100 scale)
    const currentFast = metrics?.fast_thinking || 50;
    const currentSlow = metrics?.slow_thinking || 50;
    const currentFocus = metrics?.focus_stability || 50;
    const currentReasoning = metrics?.reasoning_accuracy || 50;
    const currentCreativity = metrics?.creativity || 50;
    
    // SCI is weighted average of cognitive metrics
    const sciScore = Math.round(
      (currentFast * 0.15) + 
      (currentSlow * 0.25) + 
      (currentFocus * 0.20) + 
      (currentReasoning * 0.25) + 
      (currentCreativity * 0.15)
    );
    
    // Calculate baseline SCI
    const baselineFast = metrics?.baseline_fast_thinking || 50;
    const baselineSlow = metrics?.baseline_slow_thinking || 50;
    const baselineFocus = metrics?.baseline_focus || 50;
    const baselineReasoning = metrics?.baseline_reasoning || 50;
    const baselineCreativity = metrics?.baseline_creativity || 50;
    
    const baselineSCI = Math.round(
      (baselineFast * 0.15) + 
      (baselineSlow * 0.25) + 
      (baselineFocus * 0.20) + 
      (baselineReasoning * 0.25) + 
      (baselineCreativity * 0.15)
    );
    
    // Delta is improvement from baseline
    const delta = sciScore - baselineSCI;
    
    return {
      sciScore,
      baselineSCI,
      delta
    };
  }, [metrics]);
  
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
            <h1 className="text-lg font-semibold text-foreground tracking-tight">Strategic Performance</h1>
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest mt-0.5">
              Cognitive Index
            </p>
          </div>
          <Link to="/cognitive-age">
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Info className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </Link>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Strategic Cognitive Index */}
          <StrategicCognitiveIndex 
            sciScore={sciData.sciScore} 
            delta={sciData.delta} 
          />

          {/* Neural Growth Animation */}
          <NeuralGrowthAnimation
            cognitiveAgeDelta={sciData.delta}
            overallCognitiveScore={overallScore}
          />

          {/* Quick Training Links */}
          <div className="grid grid-cols-2 gap-2.5">
            <Link to="/app/trainings?mode=fast">
              <div className="p-3.5 rounded-xl bg-card/60 border border-border/30 hover:border-amber-500/30 transition-colors active:scale-[0.98]">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-[12px] font-medium text-foreground">System 1</p>
                <p className="text-[10px] text-muted-foreground">Pattern Recognition</p>
              </div>
            </Link>
            <Link to="/app/trainings?mode=slow">
              <div className="p-3.5 rounded-xl bg-card/60 border border-border/30 hover:border-teal-500/30 transition-colors active:scale-[0.98]">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center mb-2">
                  <Brain className="w-4 h-4 text-teal-400" />
                </div>
                <p className="text-[12px] font-medium text-foreground">System 2</p>
                <p className="text-[10px] text-muted-foreground">Strategic Analysis</p>
              </div>
            </Link>
          </div>

          {/* Thinking Systems Overview */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-foreground">Dual-Process Integration</h2>
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-widest">
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
        </div>

        {/* CTA */}
        <div className="pt-1 pb-4">
          <Link to="/app">
            <Button variant="premium" className="w-full h-11 text-[13px]">
              Start Strategic Training
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
};

export default Dashboard;
