import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { CognitiveAgeSphere } from "@/components/dashboard/CognitiveAgeSphere";
import { NeuralGrowthAnimation } from "@/components/dashboard/NeuralGrowthAnimation";
import { ThinkingPerformanceCircle } from "@/components/dashboard/ThinkingPerformanceCircle";
import { FastSlowBrainMap } from "@/components/dashboard/FastSlowBrainMap";
import { ThinkingSystemSources } from "@/components/dashboard/ThinkingSystemSources";
import { CognitiveCoach } from "@/components/dashboard/CognitiveCoach";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Info, Zap, Brain, BarChart3, MessageCircle } from "lucide-react";
import {
  generateMockSnapshot,
  generateMockBaseline,
  calculateCognitivePerformanceScore,
  calculateBrainAgeIndex,
  calculateCriticalThinkingScore,
  calculateCreativeScore,
  calculateFocusIndex,
  calculateDecisionQualityScore,
  calculatePhilosophicalIndex,
} from "@/lib/cognitiveMetrics";
import { computeFastSlowSystems } from "@/lib/thinkingSystems";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const userId = "user-1";
  const chronologicalAge = 35;

  const snapshot = useMemo(() => generateMockSnapshot(userId), []);
  const baseline = useMemo(() => generateMockBaseline(userId), []);
  const previousSnapshot = useMemo(() => generateMockSnapshot(userId), []);

  const cps = calculateCognitivePerformanceScore(snapshot, baseline);
  const { brainAge, delta } = calculateBrainAgeIndex(chronologicalAge, cps);
  const criticalThinking = calculateCriticalThinkingScore(snapshot);
  const creativity = calculateCreativeScore(snapshot);
  const focus = calculateFocusIndex(snapshot);
  const decisionQuality = calculateDecisionQualityScore(snapshot);
  const philosophicalIndex = calculatePhilosophicalIndex(snapshot);

  const thinkingSystems = useMemo(
    () => computeFastSlowSystems(snapshot, previousSnapshot),
    [snapshot, previousSnapshot]
  );

  const overallScore = Math.round(
    (criticalThinking + focus + decisionQuality + creativity) / 4
  );

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
          <TabsList className="grid w-full grid-cols-2 bg-muted/20 p-0.5 rounded-lg h-9">
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

            {/* Thinking Performance Circle */}
            <ThinkingPerformanceCircle
              criticalThinking={criticalThinking}
              clarity={Math.round(snapshot.clarityScoreRaw)}
              focus={focus}
              decisionQuality={decisionQuality}
              creativity={creativity}
              philosophicalReasoning={philosophicalIndex}
            />

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

          {/* Coach Tab */}
          <TabsContent value="coach" className="mt-4">
            <CognitiveCoach
              fastScore={thinkingSystems.fast.score}
              slowScore={thinkingSystems.slow.score}
              focusScore={focus}
              reasoningScore={criticalThinking}
              creativityScore={creativity}
              sessionsThisWeek={4}
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
