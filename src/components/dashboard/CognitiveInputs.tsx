import { Headphones, BookOpen, Brain, Clock, Target, MapPin, Zap } from "lucide-react";

type InputType = "listening" | "reading" | "deep-dive";

interface CognitiveInput {
  type: InputType;
  title: string;
  duration: string;
  cognitivePurpose: string;
  usageContext: string;
  triggerReason: string;
}

const INPUT_TYPE_CONFIG: Record<InputType, { label: string; icon: typeof Headphones }> = {
  listening: { label: "Listening", icon: Headphones },
  reading: { label: "Reading", icon: BookOpen },
  "deep-dive": { label: "Deep Dive", icon: Brain },
};

const COGNITIVE_INPUTS: CognitiveInput[] = [
  {
    type: "listening",
    title: "Probabilistic Decision Frameworks",
    duration: "18–22 min",
    cognitivePurpose: "Calibrates intuitive probability estimation",
    usageContext: "Morning commute or low-demand intervals",
    triggerReason: "Triggered by suboptimal fast-thinking accuracy",
  },
  {
    type: "reading",
    title: "Adversarial Reasoning Patterns",
    duration: "12–15 min",
    cognitivePurpose: "Strengthens bias resistance under cognitive load",
    usageContext: "Evening wind-down, pre-sleep",
    triggerReason: "Recommended due to declining bias resistance trend",
  },
  {
    type: "deep-dive",
    title: "Strategic Depth Analysis",
    duration: "25–30 min",
    cognitivePurpose: "Develops multi-layered analytical processing",
    usageContext: "Dedicated focus blocks, weekend sessions",
    triggerReason: "Aligned with slow-thinking optimization goals",
  },
];

function InputCard({ input }: { input: CognitiveInput }) {
  const config = INPUT_TYPE_CONFIG[input.type];
  const Icon = config.icon;

  return (
    <div className="border border-border/40 bg-card/30 p-4 space-y-3">
      {/* Header: Type + Duration */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary/70" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{input.duration}</span>
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-foreground leading-tight">
        {input.title}
      </h4>

      {/* Metadata Grid */}
      <div className="space-y-2 text-xs">
        <div className="flex items-start gap-2">
          <Target className="h-3 w-3 text-primary/50 mt-0.5 shrink-0" />
          <span className="text-muted-foreground">{input.cognitivePurpose}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="h-3 w-3 text-primary/50 mt-0.5 shrink-0" />
          <span className="text-muted-foreground">{input.usageContext}</span>
        </div>
        <div className="flex items-start gap-2">
          <Zap className="h-3 w-3 text-amber-500/70 mt-0.5 shrink-0" />
          <span className="text-amber-600/80 dark:text-amber-400/80 italic">
            {input.triggerReason}
          </span>
        </div>
      </div>
    </div>
  );
}

export function CognitiveInputs() {
  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Cognitive Inputs
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Prescribed stimuli based on current metrics
          </p>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
          {COGNITIVE_INPUTS.length} Active
        </div>
      </div>

      {/* Input Cards */}
      <div className="grid gap-3">
        {COGNITIVE_INPUTS.map((input, idx) => (
          <InputCard key={idx} input={input} />
        ))}
      </div>

      {/* Footer Note */}
      <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wide text-center pt-2">
        Inputs auto-update based on training performance
      </p>
    </section>
  );
}
