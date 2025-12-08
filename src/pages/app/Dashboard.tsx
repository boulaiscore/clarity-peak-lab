import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { CognitiveAgeSphere } from "@/components/dashboard/CognitiveAgeSphere";
import { ThinkingPerformanceCircle } from "@/components/dashboard/ThinkingPerformanceCircle";
import { FastSlowThinkingPanel } from "@/components/dashboard/FastSlowThinkingPanel";
import { CognitiveReadinessBar } from "@/components/dashboard/CognitiveReadinessBar";
import { BrainFunctionsGrid } from "@/components/dashboard/BrainFunctionsGrid";
import { InsightsList } from "@/components/dashboard/InsightsList";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
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

        {/* Cognitive Age Sphere */}
        <CognitiveAgeSphere cognitiveAge={brainAge} delta={delta} />

        {/* Thinking Performance Circle */}
        <ThinkingPerformanceCircle
          criticalThinking={criticalThinking}
          clarity={Math.round(snapshot.clarityScoreRaw)}
          focus={focus}
          decisionQuality={decisionQuality}
          creativity={creativity}
          philosophicalReasoning={philosophicalIndex}
        />

        {/* Fast vs Slow Thinking Panel */}
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