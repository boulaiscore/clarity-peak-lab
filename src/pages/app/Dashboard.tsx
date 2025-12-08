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
  // Generate mock data (in production, this would come from API/database)
  const userId = "user-1";
  const chronologicalAge = 35;

  const snapshot = useMemo(() => generateMockSnapshot(userId), []);
  const baseline = useMemo(() => generateMockBaseline(userId), []);
  const previousSnapshot = useMemo(() => generateMockSnapshot(userId), []);

  // Calculate all metrics
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
      <div className="container px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Cognitive Dashboard</h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Your brain is your edge. Train it.
            </p>
          </div>
          <Link to="/cognitive-age">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <Info className="w-5 h-5 text-text-secondary" />
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
        <div className="pt-4 pb-8">
          <Link to="/app">
            <Button className="w-full rounded-xl h-12 text-sm font-semibold">
              Start Training Session
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
};

export default Dashboard;
