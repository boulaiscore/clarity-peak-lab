import { motion } from "framer-motion";
import { Brain, Activity, Target, TrendingUp, Zap, Focus, Lightbulb, BarChart3, Lock } from "lucide-react";

export function ReportPreviewMockup() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-b from-card/80 to-card/40">
      {/* Blur overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
      
      {/* Lock badge */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/80 backdrop-blur-sm border border-border/50">
        <Lock className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground">Preview</span>
      </div>

      {/* Mockup content */}
      <div className="p-4 space-y-4">
        {/* Header mockup */}
        <div className="flex items-center gap-3 pb-3 border-b border-border/30">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="h-4 w-40 rounded bg-foreground/10 mb-1" />
            <div className="h-3 w-24 rounded bg-muted-foreground/10" />
          </div>
        </div>

        {/* SCI Score Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-lg bg-primary/5 border border-primary/10"
        >
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium">Synthesized Cognitive Index</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-primary">72</div>
            <div className="flex gap-2">
              {[65, 78, 70, 68, 75, 72].map((_, i) => (
                <div key={i} className="w-6 h-12 rounded bg-primary/20" style={{ height: `${20 + Math.random() * 30}px` }} />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Dual Process Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] font-medium">System 1 (Fast)</span>
            </div>
            <div className="text-xl font-bold text-amber-500">68</div>
            <div className="mt-2 h-1.5 rounded-full bg-amber-500/20">
              <div className="h-full w-[68%] rounded-full bg-amber-500" />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
            <div className="flex items-center gap-1.5 mb-2">
              <Focus className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[10px] font-medium">System 2 (Slow)</span>
            </div>
            <div className="text-xl font-bold text-blue-500">74</div>
            <div className="mt-2 h-1.5 rounded-full bg-blue-500/20">
              <div className="h-full w-[74%] rounded-full bg-blue-500" />
            </div>
          </div>
        </motion.div>

        {/* Domains Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium">Cognitive Domains</span>
          </div>
          {[
            { name: "Focus & Attention", score: 72, icon: Target, color: "text-emerald-500" },
            { name: "Reasoning & Logic", score: 68, icon: Lightbulb, color: "text-violet-500" },
            { name: "Creative Thinking", score: 75, icon: TrendingUp, color: "text-pink-500" },
          ].map((domain) => (
            <div key={domain.name} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
              <domain.icon className={`w-4 h-4 ${domain.color}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">{domain.name}</span>
                  <span className={`text-xs font-medium ${domain.color}`}>{domain.score}</span>
                </div>
                <div className="h-1 rounded-full bg-muted">
                  <div 
                    className="h-full rounded-full bg-current" 
                    style={{ width: `${domain.score}%`, color: `var(--${domain.color.split('-')[1]}-500)` }} 
                  />
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* More sections indicator */}
        <div className="pt-2 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-[10px] text-muted-foreground">
            <span>+ 6 more sections</span>
          </div>
        </div>
      </div>
    </div>
  );
}
