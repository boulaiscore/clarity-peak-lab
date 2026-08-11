import { useState } from "react";
import { CognitiveAgeCard } from "./CognitiveAgeCard";
import { NeuralGrowthAnimation } from "./NeuralGrowthAnimation";
import { FastSlowBrainMap } from "./FastSlowBrainMap";
import {
  MonitorSectionHeader,
  MonitorSegmentedControl,
} from "./MonitorUI";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { SCIBreakdown, BottleneckResult } from "@/lib/cognitiveNetworkScore";

interface OverviewCarouselProps {
  sci: SCIBreakdown | null;
  sciStatusText: string;
  thinkingScores: {
    fastScore: number;
    slowScore: number;
    fastDelta: number;
    slowDelta: number;
    baselineFast: number;
    baselineSlow: number;
  };
  bottleneck?: BottleneckResult | null;
}

const CARDS = ["cognitive-age", "cognitive-network", "dual-process"] as const;
type CardType = (typeof CARDS)[number];

const CARD_OPTIONS: { value: CardType; label: string }[] = [
  { value: "cognitive-age", label: "Age" },
  { value: "cognitive-network", label: "Network" },
  { value: "dual-process", label: "Systems" },
];

const CARD_COPY: Record<CardType, { title: string; description: string }> = {
  "cognitive-age": {
    title: "Cognitive Age",
    description: "30-day task-performance estimate",
  },
  "cognitive-network": {
    title: "Performance Network",
    description: "Performance, training and recovery",
  },
  "dual-process": {
    title: "Dual-Process Profile",
    description: "Fast and deliberate task performance",
  },
};

const METHOD_ITEMS = [
  {
    mark: "AGE",
    title: "Cognitive Age",
    body: "A training-derived estimate from your LOOMA task trend, expressed in years for easier comparison over time.",
    note: "It is not biological age, intelligence or a clinical measure.",
  },
  {
    mark: "NET",
    title: "Performance Network",
    body: "A product score combining LOOMA task performance, consistency and recorded recovery inputs.",
    note: "Use changes as a self-comparison signal, not as an intelligence or clinical measure.",
  },
  {
    mark: "S1/2",
    title: "Dual-Process Profile",
    body: "Your relative performance on fast-response and deliberate-reasoning tasks inside LOOMA.",
  },
] as const;

export function OverviewCarousel({
  sci,
  sciStatusText,
  thinkingScores,
  bottleneck,
}: OverviewCarouselProps) {
  const [currentCard, setCurrentCard] = useState<CardType>(CARDS[0]);
  const copy = CARD_COPY[currentCard];

  return (
    <section className="space-y-3">
      <MonitorSectionHeader
        eyebrow="Overview"
        title={copy.title}
        description={copy.description}
        action={
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="rounded-[7px] border border-white/[0.055] bg-white/[0.025] px-2.5 py-1.5 text-[9px] font-medium text-muted-foreground/65 transition-colors hover:bg-white/[0.05] hover:text-foreground"
              >
                Method
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-base">Performance signals explained</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                {METHOD_ITEMS.map((item) => (
                  <div key={item.mark} className="rounded-[12px] border border-white/[0.055] bg-white/[0.025] p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="min-w-9 rounded-md border border-border/40 bg-background/60 px-1.5 py-1 text-center text-[9px] font-semibold tracking-wider text-muted-foreground">
                        {item.mark}
                      </span>
                      <span className="font-medium text-foreground">{item.title}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{item.body}</p>
                    {"note" in item && item.note && (
                      <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground/70">
                        {item.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <MonitorSegmentedControl
        ariaLabel="Overview metric"
        value={currentCard}
        options={CARD_OPTIONS}
        onChange={setCurrentCard}
      />

      <div className="min-w-0 overflow-hidden pt-1">
        {currentCard === "cognitive-age" && <CognitiveAgeCard />}

        {currentCard === "cognitive-network" && (
          <NeuralGrowthAnimation
            cognitiveAgeDelta={0}
            overallCognitiveScore={sci?.total ?? 50}
            sciBreakdown={sci}
            statusText={sciStatusText}
            bottleneck={bottleneck}
          />
        )}

        {currentCard === "dual-process" && (
          <FastSlowBrainMap
            fastScore={thinkingScores.fastScore}
            fastBaseline={thinkingScores.baselineFast}
            fastDelta={thinkingScores.fastDelta}
            slowScore={thinkingScores.slowScore}
            slowBaseline={thinkingScores.baselineSlow}
            slowDelta={thinkingScores.slowDelta}
          />
        )}
      </div>
    </section>
  );
}
