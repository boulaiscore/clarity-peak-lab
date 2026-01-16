import { motion } from "framer-motion";
import { Brain, Battery, Target, Focus, ChevronDown } from "lucide-react";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

export function ReasoningTab() {
  const { readiness, recovery, S2, AE, isLoading } = useTodayMetrics();
  const navigate = useNavigate();
  const [infoOpen, setInfoOpen] = useState(false);

  // Determine status levels
  const getStatus = (value: number): "Low" | "Moderate" | "Good" => {
    if (value < 40) return "Low";
    if (value < 70) return "Moderate";
    return "Good";
  };

  const readinessStatus = getStatus(readiness);
  const recoveryStatus = getStatus(recovery);
  const reasoningStatus = getStatus(S2);
  const focusStatus = getStatus(AE);

  // Dynamic subtitle based on readiness
  const getSubtitle = () => {
    if (readiness < 40) return "Your capacity for sustained cognitive work is currently limited.";
    if (readiness < 70) return "You can handle moderate cognitive effort today.";
    return "You are ready for demanding, high-focus work.";
  };

  // Dynamic recovery impact text
  const getRecoveryImpact = () => {
    if (recovery < 40) return "Low recovery reduces your ability to sustain effort, even if your skills are strong.";
    if (recovery < 70) return "Recovery partially supports your cognitive endurance.";
    return "Recovery fully supports sustained cognitive effort today.";
  };

  // CTA based on readiness
  const getCTA = () => {
    if (readiness < 40) return { label: "Prioritize Recovery", action: () => navigate("/app/detox") };
    if (readiness < 70) return { label: "Light Cognitive Work", action: () => navigate("/app/neuro-lab") };
    return { label: "Deep Work Session", action: () => navigate("/app/neuro-lab") };
  };

  const cta = getCTA();

  // Ring calculations
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(readiness / 100, 1);
  const strokeDashoffset = circumference - progress * circumference;

  const getScoreColor = (value: number) => {
    if (value >= 70) return "hsl(142, 71%, 45%)";
    if (value >= 40) return "hsl(45, 85%, 50%)";
    return "hsl(0, 70%, 50%)";
  };

  const getStatusColor = (status: "Low" | "Moderate" | "Good") => {
    switch (status) {
      case "Good": return "text-emerald-400 bg-emerald-500/20";
      case "Moderate": return "text-amber-400 bg-amber-500/20";
      case "Low": return "text-red-400 bg-red-500/20";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-8"
    >
      {/* 1) HEADER */}
      <div className="text-center pt-4">
        <h2 className="text-2xl font-bold tracking-tight">Readiness</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
          {getSubtitle()}
        </p>
      </div>

      {/* 2) MAIN SCORE */}
      <div className="flex flex-col items-center py-4">
        <div className="relative" style={{ width: size, height: size }}>
          <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--muted)/0.3)"
              strokeWidth={strokeWidth}
            />
          </svg>
          <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={getScoreColor(readiness)}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold tabular-nums text-foreground">
              {Math.round(readiness)}
              <span className="text-2xl">%</span>
            </span>
            <span className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">Readiness</span>
          </div>
        </div>
      </div>

      {/* 3) SECTION TITLE */}
      <div className="px-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          What's affecting your readiness today
        </h3>
      </div>

      {/* 4) DRIVER CARDS */}
      <div className="space-y-3 px-4">
        <DriverCard
          icon={<Battery className="w-5 h-5" />}
          title="Recovery"
          description="Recovery determines how much mental effort you can sustain today."
          status={recoveryStatus}
        />
        <DriverCard
          icon={<Brain className="w-5 h-5" />}
          title="Reasoning Capacity"
          description="Reflects your ability to engage in structured, analytical thinking."
          status={reasoningStatus}
        />
        <DriverCard
          icon={<Focus className="w-5 h-5" />}
          title="Focus Stability"
          description="Reflects how well you can maintain attention without mental fatigue."
          status={focusStatus}
        />
      </div>

      {/* 5) RECOVERY ROLE */}
      <div className="px-4 py-4 bg-muted/30 rounded-xl mx-4">
        <h4 className="text-sm font-medium mb-2">Why recovery matters</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {getRecoveryImpact()}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-2 italic">
          Improving recovery increases readiness faster than training alone.
        </p>
      </div>

      {/* 6) RECOMMENDED ACTION */}
      <div className="px-4">
        <Button
          onClick={cta.action}
          className="w-full h-12 text-base font-medium"
          variant={readiness < 40 ? "secondary" : "default"}
        >
          {cta.label}
        </Button>
      </div>

      {/* 7) COLLAPSIBLE INFO */}
      <div className="px-4">
        <Collapsible open={infoOpen} onOpenChange={setInfoOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <span>What Readiness means</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${infoOpen ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pb-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Readiness reflects your ability to sustain demanding cognitive work.
              It changes daily and is strongly influenced by recovery.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </motion.div>
  );
}

function DriverCard({
  icon,
  title,
  description,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: "Low" | "Moderate" | "Good";
}) {
  const getStatusColor = (s: "Low" | "Moderate" | "Good") => {
    switch (s) {
      case "Good": return "text-emerald-400 bg-emerald-500/20";
      case "Moderate": return "text-amber-400 bg-amber-500/20";
      case "Low": return "text-red-400 bg-red-500/20";
    }
  };

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-card/50 border border-border/30">
      <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4 className="font-medium text-sm">{title}</h4>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
