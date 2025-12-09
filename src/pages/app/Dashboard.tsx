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

  // Compute Fast/Slow Thinking Systems
  const thinkingSystems = useMemo(
    () => computeFastSlowSystems(snapshot, previousSnapshot),
    [snapshot, previousSnapshot]
  );

  const overallScore = Math.round(
    (criticalThinking + focus + decisionQuality + creativity) / 4
  );

  return (
    <AppShell>
      <div className="container px-4 py-5 max-w-md mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              Cognitive Performance
            </p>
          </div>
          <Link to="/cognitive-age">
            <Button variant="ghost" size="icon-sm">
              <Info className="w-4 h-4 text-muted-foreground" />
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/30 p-1 rounded-xl">
            <TabsTrigger 
              value="overview" 
              className={cn(
                "text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all",
                "data-[state=active]:bg-card data-[state=active]:shadow-sm"
              )}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="coach" 
              className={cn(
                "text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all",
                "data-[state=active]:bg-card data-[state=active]:shadow-sm"
              )}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Coach
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-5 space-y-5">
            {/* Cognitive Age Sphere */}
            <CognitiveAgeSphere cognitiveAge={brainAge} delta={delta} />

            {/* Neural Growth Animation */}
            <NeuralGrowthAnimation
              cognitiveAgeDelta={delta}
              overallCognitiveScore={overallScore}
            />

            {/* Quick Training Links */}
            <div className="grid grid-cols-2 gap-3">
              <Link to="/app/trainings?mode=fast">
                <div className="p-4 rounded-xl bg-card border border-border/40 hover:border-warning/30 transition-colors active:scale-[0.98]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-warning" />
                    </div>
                  </div>
                  <p className="text-xs font-medium text-foreground">Fast Thinking</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Train intuition</p>
                </div>
              </Link>
              <Link to="/app/trainings?mode=slow">
                <div className="p-4 rounded-xl bg-card border border-border/40 hover:border-primary/30 transition-colors active:scale-[0.98]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Brain className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <p className="text-xs font-medium text-foreground">Slow Thinking</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Structured reasoning</p>
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

            {/* ===== THINKING SYSTEMS OVERVIEW ===== */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Thinking Systems Overview</h2>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Kahneman Model
                </span>
              </div>
              
              {/* Fast/Slow Brain Map */}
              <FastSlowBrainMap
                fastScore={thinkingSystems.fast.score}
                fastDelta={thinkingSystems.fast.delta}
                slowScore={thinkingSystems.slow.score}
                slowDelta={thinkingSystems.slow.delta}
              />
            </div>

            {/* Training Sources - How each area contributes */}
            <ThinkingSystemSources />
          </TabsContent>

          {/* Coach Tab */}
          <TabsContent value="coach" className="mt-5">
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
        <div className="pt-2 pb-6">
          <Link to="/app">
            <Button variant="premium" className="w-full" size="lg">
              Start Training
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
};

export default Dashboard;