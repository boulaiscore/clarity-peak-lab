import { motion } from "framer-motion";
import { Brain, Battery, Focus, ChevronDown, Zap } from "lucide-react";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useMemo } from "react";

export function ReasoningTab() {
  const { readiness, recovery, S2, AE, isLoading } = useTodayMetrics();
  
  const [infoOpen, setInfoOpen] = useState(false);

  // Ring calculations
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(readiness / 100, 1);
  const strokeDashoffset = circumference - progress * circumference;

  // Status thresholds (same as Sharpness)
  const getStatus = (value: number): "low" | "moderate" | "good" => {
    if (value >= 70) return "good";
    if (value >= 45) return "moderate";
    return "low";
  };

  const readinessStatus = getStatus(readiness);
  const recoveryStatus = getStatus(recovery);
  const reasoningStatus = getStatus(S2);
  const focusStatus = getStatus(AE);

  // Dynamic subtitle based on readiness
  const getSubtitle = () => {
    if (readiness >= 70) return "You are ready for demanding, high-focus work.";
    if (readiness >= 45) return "You can handle moderate cognitive effort today.";
    return "Your capacity for sustained cognitive work is currently limited.";
  };

  // Recovery impact text
  const getRecoveryImpact = () => {
    if (recovery >= 70) return "Recovery fully supports sustained cognitive effort today.";
    if (recovery >= 45) return "Recovery partially supports your cognitive endurance.";
    return "Low recovery reduces your ability to sustain effort, even if your skills are strong.";
  };

  // Premium functional color - Soft Indigo for Readiness (fixed, not status-based)
  const ringColor = "hsl(245, 58%, 65%)";

  // Status badge styling - neutral tones, no alarm colors
  const getStatusStyle = (status: "low" | "moderate" | "good") => {
    switch (status) {
      case "good":
        return "bg-primary/15 text-primary border-primary/30";
      case "moderate":
        return "bg-muted/30 text-muted-foreground border-muted-foreground/30";
      case "low":
        return "bg-muted/20 text-muted-foreground/70 border-muted-foreground/20";
    }
  };

  const getStatusLabel = (status: "low" | "moderate" | "good") => {
    switch (status) {
      case "good": return "Good";
      case "moderate": return "Moderate";
      case "low": return "Low";
    }
  };

  // Bottleneck detection for Readiness based on formula:
  // Readiness = 0.35×REC + 0.35×S2 + 0.30×AE
  const cta = useMemo(() => {
    // Priority: if recovery is low (<45), it's always the bottleneck
    if (recovery < 45) {
      return { label: "Start Recovery", link: "/neuro-lab?tab=detox", icon: Battery };
    }
    
    // Calculate potential gains for each lever
    const recPotential = 0.35 * (100 - recovery);
    const s2Potential = 0.35 * (100 - S2);
    const aePotential = 0.30 * (100 - AE);
    
    // Find the bottleneck (highest potential gain)
    const potentials = [
      { key: "recovery", value: recPotential },
      { key: "S2", value: s2Potential },
      { key: "AE", value: aePotential },
    ];
    
    const bottleneck = potentials.reduce((a, b) => a.value > b.value ? a : b).key;
    
    switch (bottleneck) {
      case "recovery":
        return { label: "Start Recovery", link: "/neuro-lab?tab=detox", icon: Battery };
      case "S2":
        return { label: "Train Reasoning", link: "/neuro-lab/reasoning", icon: Brain };
      case "AE":
        return { label: "Train Focus", link: "/neuro-lab/focus", icon: Zap };
      default:
        return { label: "Start Recovery", link: "/neuro-lab?tab=detox", icon: Battery };
    }
  }, [recovery, S2, AE]);

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
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2 pt-2">
        <h2 className="text-xl font-semibold tracking-tight">Readiness</h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
          {getSubtitle()}
        </p>
      </div>

      {/* Main Score Ring */}
      <div className="flex justify-center py-4">
        <div className="relative" style={{ width: size, height: size }}>
          <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--muted)/0.25)"
              strokeWidth={strokeWidth}
            />
          </svg>
          <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={ringColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-bold tabular-nums text-foreground">
              {Math.round(readiness)}
            </span>
            <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Readiness</span>
          </div>
        </div>
      </div>

      {/* Drivers Section */}
      <div className="space-y-3">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground px-1">
          What's affecting your readiness today
        </h3>
        
        <div className="space-y-2">
          {/* Recovery */}
          <DriverCard
            icon={<Battery className="w-4 h-4" />}
            title="Recovery"
            description="Recovery determines how much mental effort you can sustain today."
            status={recoveryStatus}
            getStatusStyle={getStatusStyle}
            getStatusLabel={getStatusLabel}
          />
          
          {/* Reasoning Capacity (S2) */}
          <DriverCard
            icon={<Brain className="w-4 h-4" />}
            title="Reasoning Capacity"
            description="Reflects your ability to engage in structured, analytical thinking."
            status={reasoningStatus}
            getStatusStyle={getStatusStyle}
            getStatusLabel={getStatusLabel}
          />
          
          {/* Focus Stability (AE) */}
          <DriverCard
            icon={<Focus className="w-4 h-4" />}
            title="Focus Stability"
            description="Reflects how well you can maintain attention without mental fatigue."
            status={focusStatus}
            getStatusStyle={getStatusStyle}
            getStatusLabel={getStatusLabel}
          />
        </div>
      </div>

      {/* Recovery Impact */}
      <div className="space-y-2 px-1">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
          Recovery impact
        </h3>
        <p className="text-sm text-foreground leading-relaxed">
          {getRecoveryImpact()}
        </p>
        <p className="text-xs text-muted-foreground/70">
          Improving recovery increases readiness faster than training alone.
        </p>
      </div>

      {/* CTA Button */}
      <div className="pt-2">
        <Link to={cta.link}>
          <Button variant="premium" className="w-full h-12 text-sm gap-2">
            <cta.icon className="w-4 h-4" />
            {cta.label}
          </Button>
        </Link>
      </div>

      {/* Collapsible Info */}
      <Collapsible open={infoOpen} onOpenChange={setInfoOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <span className="uppercase tracking-wider">What Readiness means</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${infoOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-1 pb-4 space-y-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Readiness reflects your ability to sustain demanding cognitive work.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              It changes daily and is strongly influenced by recovery.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

function DriverCard({ 
  icon, 
  title, 
  description, 
  status,
  getStatusStyle,
  getStatusLabel
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  status: "low" | "moderate" | "good";
  getStatusStyle: (s: "low" | "moderate" | "good") => string;
  getStatusLabel: (s: "low" | "moderate" | "good") => string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-card/50 border border-border/30">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm font-medium">{title}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusStyle(status)}`}>
            {getStatusLabel(status)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground/80 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
