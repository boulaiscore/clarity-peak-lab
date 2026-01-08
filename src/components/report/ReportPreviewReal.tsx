import { motion } from "framer-motion";
import { Brain, Activity, Zap, Focus, Target, Lightbulb, TrendingUp, Lock, BarChart3, Sparkles } from "lucide-react";

interface ReportPreviewRealProps {
  sciScore?: number;
  system1Score?: number;
  system2Score?: number;
  domains?: {
    focus?: number;
    reasoning?: number;
    creativity?: number;
    memory?: number;
  };
}

export function ReportPreviewReal({
  sciScore = 0,
  system1Score = 0,
  system2Score = 0,
  domains = {},
}: ReportPreviewRealProps) {
  const hasData = sciScore > 0;
  
  const domainItems = [
    { name: "Focus & Attention", score: domains.focus ?? 0, icon: Target, color: "emerald" },
    { name: "Reasoning & Logic", score: domains.reasoning ?? 0, icon: Lightbulb, color: "violet" },
    { name: "Creative Thinking", score: domains.creativity ?? 0, icon: TrendingUp, color: "pink" },
    { name: "Working Memory", score: domains.memory ?? 0, icon: Brain, color: "blue" },
  ];

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-b from-card/80 to-card/40">
      {/* Blur overlay for locked sections */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none" />
      
      {/* Lock badge */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/80 backdrop-blur-sm border border-border/50">
        <Lock className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground">Preview</span>
      </div>

      {/* Real data content */}
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-border/30">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold">Your Cognitive Report</div>
            <div className="text-[10px] text-muted-foreground">Based on your training data</div>
          </div>
        </div>

        {/* SCI Score - Visible to entice */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-lg bg-primary/5 border border-primary/20"
        >
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium">Synthesized Cognitive Index</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="relative">
              <div className="text-4xl font-bold text-primary">
                {hasData ? sciScore : "—"}
              </div>
              {hasData && (
                <div className="text-[10px] text-muted-foreground mt-1">
                  Your cognitive baseline
                </div>
              )}
            </div>
            {hasData && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-medium text-primary">Measured</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Dual Process Section - Partially visible */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] font-medium">System 1 (Fast)</span>
            </div>
            <div className="text-xl font-bold text-amber-500">
              {hasData ? system1Score : "—"}
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-amber-500/20">
              <div 
                className="h-full rounded-full bg-amber-500 transition-all" 
                style={{ width: hasData ? `${Math.min(system1Score, 100)}%` : '0%' }} 
              />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-center gap-1.5 mb-2">
              <Focus className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[10px] font-medium">System 2 (Slow)</span>
            </div>
            <div className="text-xl font-bold text-blue-500">
              {hasData ? system2Score : "—"}
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-blue-500/20">
              <div 
                className="h-full rounded-full bg-blue-500 transition-all" 
                style={{ width: hasData ? `${Math.min(system2Score, 100)}%` : '0%' }} 
              />
            </div>
          </div>
        </motion.div>

        {/* Domains Preview - Blurred/locked */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2 relative"
        >
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium">Cognitive Domains</span>
            <Lock className="w-3 h-3 text-muted-foreground ml-auto" />
          </div>
          
          <div className="space-y-2 blur-[3px]">
            {domainItems.map((domain) => (
              <div key={domain.name} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                <domain.icon className={`w-4 h-4 text-${domain.color}-500`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">{domain.name}</span>
                    <span className={`text-xs font-medium text-${domain.color}-500`}>
                      {hasData && domain.score > 0 ? domain.score : "??"}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-muted">
                    <div 
                      className={`h-full rounded-full bg-${domain.color}-500`}
                      style={{ width: hasData && domain.score > 0 ? `${domain.score}%` : '40%' }} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* More sections indicator */}
        <div className="pt-2 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-[10px] text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span>+ 6 more detailed sections</span>
          </div>
        </div>
      </div>
    </div>
  );
}
