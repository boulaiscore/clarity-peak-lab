import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { CognitiveAgeSphere } from "@/components/dashboard/CognitiveAgeSphere";
import { NeuralGrowthAnimation } from "@/components/dashboard/NeuralGrowthAnimation";
import { FastSlowBrainMap } from "@/components/dashboard/FastSlowBrainMap";
import { ThinkingSystemSources } from "@/components/dashboard/ThinkingSystemSources";
import { CognitiveCoach } from "@/components/dashboard/CognitiveCoach";
import { BadgesSection } from "@/components/dashboard/BadgesSection";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Info, Zap, Brain, BarChart3, MessageCircle, Loader2, Award } from "lucide-react";
import { calculateBrainAgeIndex, CognitiveMetricsSnapshot } from "@/lib/cognitiveMetrics";
import { computeFastSlowSystems } from "@/lib/thinkingSystems";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMetrics } from "@/hooks/useExercises";
import { useNeuroGymSessions } from "@/hooks/useNeuroGym";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();
  
  // Fetch real metrics from database
  const { data: metrics, isLoading: metricsLoading } = useUserMetrics(user?.id);
  
  // Fetch sessions to count this week
  const { data: sessions } = useNeuroGymSessions(user?.id);
  
  // Calculate sessions this week
  const sessionsThisWeek = useMemo(() => {
    if (!sessions) return 0;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return sessions.filter(s => new Date(s.completed_at) >= oneWeekAgo).length;
  }, [sessions]);
  
  // User's chronological age (default 35 if not set)
  const chronologicalAge = user?.age || 35;
  
  // Build CognitiveMetricsSnapshot from real database metrics
  const snapshot: CognitiveMetricsSnapshot = useMemo(() => ({
    id: user?.id || "unknown",
    userId: user?.id || "unknown",
    date: new Date().toISOString(),
    reactionTimeAvgMs: metrics?.reaction_speed ? (100 - metrics.reaction_speed) * 3 + 200 : 300,
    reasoningAccuracy: (metrics?.reasoning_accuracy || 50) / 100,
    clarityScoreRaw: metrics?.clarity_score || 50,
    decisionQualityRaw: metrics?.decision_quality || 50,
    creativityRaw: metrics?.creativity || 50,
    focusStabilityRaw: metrics?.focus_stability || 50,
    philosophicalDepthRaw: metrics?.philosophical_reasoning || 50,
    fastThinkingScoreRaw: metrics?.fast_thinking || 50,
    slowThinkingScoreRaw: metrics?.slow_thinking || 50,
    sessionsCompleted: metrics?.total_sessions || 0,
  }), [metrics, user?.id]);
  
  // Calculate Cognitive Performance Score from real metrics
  const cps = useMemo(() => {
    const reasoning = (metrics?.reasoning_accuracy || 50) / 100;
    const clarity = (metrics?.clarity_score || 50) / 100;
    const decision = (metrics?.decision_quality || 50) / 100;
    const focus = (metrics?.focus_stability || 50) / 100;
    // Weighted average
    return 0.25 * reasoning + 0.25 * clarity + 0.25 * decision + 0.25 * focus;
  }, [metrics]);
  
  // Calculate Brain Age from real data
  const { brainAge, delta } = useMemo(() => 
    calculateBrainAgeIndex(chronologicalAge, cps),
    [chronologicalAge, cps]
  );
  
  // Calculate Thinking Systems from real data
  const thinkingSystems = useMemo(() => 
    computeFastSlowSystems(snapshot),
    [snapshot]
  );
  
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
              Performance
            </p>
          </div>
          <Link to="/cognitive-age">
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Info className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/20 p-0.5 rounded-lg h-9">
            <TabsTrigger 
              value="overview" 
              className={cn(
                "text-[11px] font-medium rounded-md flex items-center gap-1.5 h-8",
                "data-[state=active]:bg-card data-[state=active]:shadow-sm"
              )}
            >
              <BarChart3 className="w-3 h-3" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="progress" 
              className={cn(
                "text-[11px] font-medium rounded-md flex items-center gap-1.5 h-8",
                "data-[state=active]:bg-card data-[state=active]:shadow-sm"
              )}
            >
              <Award className="w-3 h-3" />
              Progress
            </TabsTrigger>
            <TabsTrigger 
              value="coach" 
              className={cn(
                "text-[11px] font-medium rounded-md flex items-center gap-1.5 h-8",
                "data-[state=active]:bg-card data-[state=active]:shadow-sm"
              )}
            >
              <MessageCircle className="w-3 h-3" />
              Coach
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Cognitive Age Sphere */}
            <CognitiveAgeSphere cognitiveAge={brainAge} delta={delta} />

            {/* Neural Growth Animation */}
            <NeuralGrowthAnimation
              cognitiveAgeDelta={delta}
              overallCognitiveScore={overallScore}
            />

            {/* Quick Training Links */}
            <div className="grid grid-cols-2 gap-2.5">
              <Link to="/app/trainings?mode=fast">
                <div className="p-3.5 rounded-xl bg-card/60 border border-border/30 hover:border-amber-500/30 transition-colors active:scale-[0.98]">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-[12px] font-medium text-foreground">Fast</p>
                  <p className="text-[10px] text-muted-foreground">Intuition</p>
                </div>
              </Link>
              <Link to="/app/trainings?mode=slow">
                <div className="p-3.5 rounded-xl bg-card/60 border border-border/30 hover:border-teal-500/30 transition-colors active:scale-[0.98]">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center mb-2">
                    <Brain className="w-4 h-4 text-teal-400" />
                  </div>
                  <p className="text-[12px] font-medium text-foreground">Slow</p>
                  <p className="text-[10px] text-muted-foreground">Reasoning</p>
                </div>
              </Link>
            </div>

            {/* Thinking Systems Overview */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-foreground">Thinking Systems</h2>
                <span className="text-[9px] text-muted-foreground/60 uppercase tracking-widest">
                  Kahneman
                </span>
              </div>
              
              <FastSlowBrainMap
                fastScore={thinkingSystems.fast.score}
                fastDelta={thinkingSystems.fast.delta}
                slowScore={thinkingSystems.slow.score}
                slowDelta={thinkingSystems.slow.delta}
              />
            </div>

            {/* Training Sources */}
            <ThinkingSystemSources />
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="mt-4">
            <BadgesSection />
          </TabsContent>

          {/* Coach Tab */}
          <TabsContent value="coach" className="mt-4">
            <CognitiveCoach
              fastScore={thinkingSystems.fast.score}
              slowScore={thinkingSystems.slow.score}
              focusScore={Math.round(metrics?.focus_stability || 50)}
              reasoningScore={Math.round(metrics?.reasoning_accuracy || 50)}
              creativityScore={Math.round(metrics?.creativity || 50)}
              sessionsThisWeek={sessionsThisWeek}
            />
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <div className="pt-1 pb-4">
          <Link to="/app">
            <Button variant="premium" className="w-full h-11 text-[13px]">
              Start Training
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
};

export default Dashboard;
