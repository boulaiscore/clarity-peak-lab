import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { CognitiveAgeSphere } from "@/components/dashboard/CognitiveAgeSphere";
import { NeuralGrowthAnimation } from "@/components/dashboard/NeuralGrowthAnimation";
import { ThinkingPerformanceCircle } from "@/components/dashboard/ThinkingPerformanceCircle";
import { FastSlowThinkingPanel } from "@/components/dashboard/FastSlowThinkingPanel";
import { CognitiveReadinessBar } from "@/components/dashboard/CognitiveReadinessBar";
import { BrainFunctionsGrid } from "@/components/dashboard/BrainFunctionsGrid";
import { InsightsList } from "@/components/dashboard/InsightsList";
import { CognitiveReadinessCard } from "@/components/dashboard/CognitiveReadinessCard";
import { FastSlowBrainMap } from "@/components/dashboard/FastSlowBrainMap";
import { ThinkingSystemSources } from "@/components/dashboard/ThinkingSystemSources";
import { Button } from "@/components/ui/button";
import { Info, Zap, Brain } from "lucide-react";
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
  calculateFastThinkingScore,
  calculateSlowThinkingScore,
  calculateCognitiveReadiness,
  getBrainFunctionScores,
  generateCognitiveInsights,
} from "@/lib/cognitiveMetrics";
import { computeFastSlowSystems } from "@/lib/thinkingSystems";

const Dashboard = () => {
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
  const fastThinking = calculateFastThinkingScore(snapshot, baseline);
  const slowThinking = calculateSlowThinkingScore(snapshot);
  const readiness = calculateCognitiveReadiness(snapshot, baseline);
  const brainFunctions = getBrainFunctionScores(snapshot, previousSnapshot);
  const insights = generateCognitiveInsights(snapshot, baseline, delta);

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

        {/* Cognitive Readiness Card (with wearable integration) */}
        <CognitiveReadinessCard />

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

        {/* Fast vs Slow Thinking Panel (existing) */}
        <FastSlowThinkingPanel
          fastThinkingScore={fastThinking}
          slowThinkingScore={slowThinking}
        />

        {/* Cognitive Readiness Bar */}
        <CognitiveReadinessBar score={readiness.score} level={readiness.level} />

        {/* Brain Functions Grid */}
        <BrainFunctionsGrid functions={brainFunctions} />

        {/* Insights List */}
        <InsightsList insights={insights} />

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