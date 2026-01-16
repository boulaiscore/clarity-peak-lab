import { motion } from "framer-motion";
import { Zap, Brain, Battery, ChevronDown, Play } from "lucide-react";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

export function IntuitionTab() {
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
  
  // Status thresholds
  const getStatus = (value: number): "low" | "moderate" | "good" => {
    if (value >= 70) return "good";
    if (value >= 45) return "moderate";
    return "low";
  };
  
  const sharpnessStatus = getStatus(sharpness);
  const s1Status = getStatus(S1);
  const s2Status = getStatus(S2);
  const recoveryStatus = getStatus(recovery);
  
  // Dynamic subtitle based on sharpness
  const getSubtitle = () => {
    if (sharpness >= 70) return "Your mind is sharp and ready for demanding tasks.";
    if (sharpness >= 45) return "You can handle routine work, but avoid heavy cognitive load.";
    return "Your ability to perform demanding cognitive work is currently reduced.";
  };
  
  // Recovery impact text
  const getRecoveryImpact = () => {
    if (recovery >= 70) return "Recovery is fully supporting your cognitive performance.";
    if (recovery >= 45) return "Recovery is partially supporting your sharpness.";
    return "Low recovery is currently limiting your sharpness.";
  };
  
  // Ring color based on status
  const getRingColor = () => {
    if (sharpness >= 70) return "hsl(142, 71%, 45%)";
    if (sharpness >= 45) return "hsl(80, 60%, 50%)";
    return "hsl(45, 85%, 50%)";
  };
  
  // Status badge styling
  const getStatusStyle = (status: "low" | "moderate" | "good") => {
    switch (status) {
      case "good":
        return "bg-green-500/15 text-green-400 border-green-500/30";
      case "moderate":
        return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
      case "low":
        return "bg-orange-500/15 text-orange-400 border-orange-500/30";
    }
  };
  
  const getStatusLabel = (status: "low" | "moderate" | "good") => {
    switch (status) {
      case "good": return "Good";
      case "moderate": return "Moderate";
      case "low": return "Low";
    }
  };
  
  // CTA logic
  const getCTA = () => {
    if (recovery < 45) {
      return { label: "Start Recovery", link: "/detox-session", icon: Battery };
    }
    if (sharpness >= 70) {
      return { label: "Deep Focus Session", link: "/neuro-lab", icon: Play };
    }
    return { label: "Light Focus Session", link: "/neuro-lab", icon: Play };
  };
  
  const cta = getCTA();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
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
              stroke={getRingColor()}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold tabular-nums text-foreground">
              {isLoading ? "—" : `${Math.round(sharpness)}`}
              <span className="text-2xl">%</span>
            </span>
            <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Sharpness</span>
          </div>
        </div>
      </div>

      {/* Drivers Section */}
      <div className="space-y-3">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground px-1">
          What's affecting your sharpness today
        </h3>
        
        <div className="space-y-2">
          {/* Fast Processing (S1) */}
          <DriverCard
            icon={<Zap className="w-4 h-4" />}
            title="Fast Processing"
            description="Reflects your speed and intuitive processing."
            status={s1Status}
            getStatusStyle={getStatusStyle}
            getStatusLabel={getStatusLabel}
          />
          
          {/* Deliberate Reasoning (S2) */}
          <DriverCard
            icon={<Brain className="w-4 h-4" />}
            title="Deliberate Reasoning"
            description="Reflects your capacity for structured and analytical thinking."
            status={s2Status}
            getStatusStyle={getStatusStyle}
            getStatusLabel={getStatusLabel}
          />
          
          {/* Recovery State */}
          <DriverCard
            icon={<Battery className="w-4 h-4" />}
            title="Recovery State"
            description="Determines how much of your cognitive capacity you can access today."
            status={recoveryStatus}
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
