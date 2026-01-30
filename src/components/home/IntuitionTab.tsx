import { motion } from "framer-motion";
import { Zap, Brain, Battery, ChevronDown, LineChart } from "lucide-react";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useMemo } from "react";
import { getSharpnessStatus } from "@/lib/metricStatusLabels";
import { getMetricDisplayInfo } from "@/lib/metricDisplayLogic";

interface IntuitionTabProps {
  onBackToOverview?: () => void;
}

export function IntuitionTab({ onBackToOverview }: IntuitionTabProps) {
  const { 
    sharpness, 
    S1, 
    S2,
    recovery,
    isLoading 
  } = useTodayMetrics();
  
  const [infoOpen, setInfoOpen] = useState(false);
  
  // Ring calculations
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(sharpness / 100, 1);
  const strokeDashoffset = circumference - progress * circumference;
  
  // Status thresholds - 5 levels for more variance
  type StatusLevel = "very_low" | "low" | "moderate" | "good" | "high";
  
  const getStatus = (value: number): StatusLevel => {
    if (value >= 80) return "high";
    if (value >= 65) return "good";
    if (value >= 50) return "moderate";
    if (value >= 35) return "low";
    return "very_low";
  };
  
  const sharpnessStatus = getStatus(sharpness);
  const s1Status = getStatus(S1);
  const s2Status = getStatus(S2);
  const recoveryStatus = getStatus(recovery);
  
  // Dynamic subtitle based on sharpness - 5 levels
  const getSubtitle = () => {
    if (sharpness >= 80) return "Peak mental clarity. You're primed for your most demanding work.";
    if (sharpness >= 65) return "Your mind is sharp and ready for demanding tasks.";
    if (sharpness >= 50) return "Moderate sharpness. Handle routine work, pace yourself on complex tasks.";
    if (sharpness >= 35) return "Sharpness is reduced. Lighter cognitive work is recommended.";
    return "Your ability to perform demanding cognitive work is currently limited.";
  };
  
  // Recovery impact text - 5 levels
  const getRecoveryImpact = () => {
    if (recovery >= 80) return "Recovery is excellent, fully amplifying your cognitive capacity.";
    if (recovery >= 65) return "Recovery is good, supporting most of your cognitive performance.";
    if (recovery >= 50) return "Recovery is moderate, partially supporting your sharpness.";
    if (recovery >= 35) return "Recovery is low, limiting how much capacity you can access.";
    return "Low recovery is significantly restricting your sharpness.";
  };
  
  // Premium functional color - Electric Blue for Sharpness (fixed, not status-based)
  const ringColor = "hsl(210, 100%, 60%)";
  
  // Status badge styling - 5 levels, neutral tones
  const getStatusStyle = (status: StatusLevel) => {
    switch (status) {
      case "high":
        return "bg-primary/20 text-primary border-primary/40";
      case "good":
        return "bg-primary/15 text-primary border-primary/30";
      case "moderate":
        return "bg-muted/30 text-muted-foreground border-muted-foreground/30";
      case "low":
        return "bg-muted/20 text-muted-foreground/70 border-muted-foreground/20";
      case "very_low":
        return "bg-muted/10 text-muted-foreground/50 border-muted-foreground/10";
    }
  };
  
  const getStatusLabel = (status: StatusLevel) => {
    switch (status) {
      case "high": return "Excellent";
      case "good": return "Good";
      case "moderate": return "Moderate";
      case "low": return "Low";
      case "very_low": return "Very Low";
    }
  };
  
  // Bottleneck detection for Sharpness based on formula:
  // Sharpness = (0.6×S1 + 0.4×S2) × recoveryMod
  const cta = useMemo(() => {
    // Priority: if recovery is low (<45), it's always the bottleneck
    if (recovery < 45) {
      return { label: "Start Recovery", link: "/neuro-lab?tab=detox", icon: Battery };
    }
    
    // Calculate recovery modifier (0.7 to 1.0 based on recovery 0-100)
    const recoveryMod = 0.7 + (recovery / 100) * 0.3;
    
    // Calculate potential gains for each lever
    const s1Potential = 0.6 * (100 - S1) * recoveryMod;
    const s2Potential = 0.4 * (100 - S2) * recoveryMod;
    // Recovery potential: how much sharpness would increase if recovery went to 100
    const currentBase = 0.6 * S1 + 0.4 * S2;
    const recoveryPotential = currentBase * (1.0 - recoveryMod);
    
    // Find the bottleneck (highest potential gain)
    const potentials = [
      { key: "recovery", value: recoveryPotential },
      { key: "S1", value: s1Potential },
      { key: "S2", value: s2Potential },
    ];
    
    const bottleneck = potentials.reduce((a, b) => a.value > b.value ? a : b).key;
    
    switch (bottleneck) {
      case "recovery":
        return { label: "Start Recovery", link: "/neuro-lab?tab=detox", icon: Battery };
      case "S1":
        return { label: "Train Fast Thinking", link: "/neuro-lab/focus", icon: Zap };
      case "S2":
        return { label: "Train Reasoning", link: "/neuro-lab/reasoning", icon: Brain };
      default:
        return { label: "Start Recovery", link: "/neuro-lab?tab=detox", icon: Battery };
    }
  }, [S1, S2, recovery]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Today Header - Back to Overview + Trend Link */}
      {onBackToOverview && (
        <div className="flex items-center justify-between px-2">
          <button 
            onClick={onBackToOverview}
            className="px-4 py-1.5 rounded-full bg-muted/40 text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/80 hover:bg-muted/60 transition-colors active:scale-[0.97]"
          >
            ← Today
          </button>
          <Link 
            to="/app/dashboard?tab=training&subtab=trends"
            className="p-2 rounded-full bg-muted/40 hover:bg-muted/60 transition-colors active:scale-[0.97]"
            title="View Trends"
          >
            <LineChart className="w-4 h-4 text-foreground/70" />
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-2 pt-2">
        <h2 className="text-xl font-semibold tracking-tight">Sharpness</h2>
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
              {isLoading ? "—" : `${Math.round(sharpness)}`}
            </span>
            <span className="text-xs text-muted-foreground/70 mt-1">
              {isLoading ? "" : getMetricDisplayInfo(
                getSharpnessStatus(sharpness).label,
                getSharpnessStatus(sharpness).level,
                null,
                null
              ).text}
            </span>
          </div>
        </div>
      </div>

      {/* Drivers Section */}
      <div className="space-y-3">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground px-1">
          What's affecting your sharpness today
        </h3>
        
        <div className="space-y-2">
          {/* Fast Processing (S1) - Primary driver */}
          <DriverCard
            icon={<Zap className="w-4 h-4" />}
            title="Fast Processing"
            description="Reflects your speed and intuitive processing."
            status={s1Status}
            emphasis="primary"
            getStatusStyle={getStatusStyle}
            getStatusLabel={getStatusLabel}
          />
          
          {/* Deliberate Reasoning (S2) - Secondary driver */}
          <DriverCard
            icon={<Brain className="w-4 h-4" />}
            title="Deliberate Reasoning"
            description="Reflects your capacity for structured and analytical thinking."
            status={s2Status}
            emphasis="secondary"
            getStatusStyle={getStatusStyle}
            getStatusLabel={getStatusLabel}
          />
          
          {/* Recovery State - Modifier */}
          <DriverCard
            icon={<Battery className="w-4 h-4" />}
            title="Recovery State"
            description="Determines how much of your cognitive capacity you can access today."
            status={recoveryStatus}
            emphasis="modifier"
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
          Improving recovery increases sharpness immediately, without additional training.
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
          <span className="uppercase tracking-wider">How Sharpness is calculated</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${infoOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-1 pb-4 space-y-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sharpness reflects how much of your cognitive capacity is available today.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Training builds capacity. Recovery determines how much of it you can use.
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
  emphasis,
  getStatusStyle,
  getStatusLabel
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  status: "very_low" | "low" | "moderate" | "good" | "high";
  emphasis: "primary" | "secondary" | "modifier";
  getStatusStyle: (s: "very_low" | "low" | "moderate" | "good" | "high") => string;
  getStatusLabel: (s: "very_low" | "low" | "moderate" | "good" | "high") => string;
}) {
  const emphasisLabel = emphasis === "primary" ? "Primary" : emphasis === "secondary" ? "Secondary" : "Modifier";
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-card/50 border border-border/30">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{title}</span>
            <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">{emphasisLabel}</span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusStyle(status)}`}>
            {getStatusLabel(status)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground/80 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
