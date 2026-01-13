import { useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, format, subDays, parseISO } from "date-fns";
import { Swords, Zap, Brain, Target, Lightbulb, CheckCircle2, TrendingUp, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, TooltipProps } from "recharts";
import { TRAINING_PLANS, TrainingPlanId } from "@/lib/trainingPlans";

// System colors matching WeeklyGoalCard
const SYSTEM_COLORS = {
  s1: "#f59e0b", // amber-500
  s2: "#8b5cf6", // violet-500
};

// Area labels for tooltip
const AREA_LABELS: Record<string, string> = {
  focus: "Focus",
  memory: "Memory",
  visual: "Visual",
  reasoning: "Reasoning",
  control: "Control",
  creativity: "Creativity",
};

interface DayData {
  date: string;
  dateLabel: string;
  // System totals for bars
  system1: number;
  system2: number;
  // Area breakdown for tooltip
  s1Focus: number;
  s1Reasoning: number;
  s1Creativity: number;
  s2Focus: number;
  s2Reasoning: number;
  s2Creativity: number;
}

// Hook to get 14-day games history with System1/System2 and area breakdown
function useGamesHistory(days: number = 14) {
  const { user } = useAuth();
  
  const stableUserId = user?.id ?? (() => {
    try { return localStorage.getItem("nl:lastUserId") || undefined; } catch { return undefined; }
  })();

  return useQuery({
    queryKey: ["games-history-system-breakdown", stableUserId, days],
    queryFn: async () => {
      if (!stableUserId) return [];

      const startDate = subDays(new Date(), days);

      const { data, error } = await supabase
        .from("exercise_completions")
        .select("xp_earned, completed_at, gym_area, thinking_mode")
        .eq("user_id", stableUserId)
        .gte("completed_at", startDate.toISOString())
        .neq("gym_area", "content");

      if (error) throw error;

      // Group by date with system + area breakdown
      const byDate: Record<string, DayData> = {};
      
      (data || []).forEach((row) => {
        const date = format(parseISO(row.completed_at), "yyyy-MM-dd");
        const xp = row.xp_earned || 0;
        const mode = row.thinking_mode || "fast";
        const rawArea = (row.gym_area as string) || "focus";
        
        // Map area to our 3 main areas
        let area: "focus" | "reasoning" | "creativity";
        if (rawArea === "focus" || rawArea === "memory" || rawArea === "visual") {
          area = "focus";
        } else if (rawArea === "reasoning" || rawArea === "control") {
          area = "reasoning";
        } else {
          area = "creativity";
        }
        
        if (!byDate[date]) {
          byDate[date] = {
            date,
            dateLabel: "",
            system1: 0,
            system2: 0,
            s1Focus: 0,
            s1Reasoning: 0,
            s1Creativity: 0,
            s2Focus: 0,
            s2Reasoning: 0,
            s2Creativity: 0,
          };
        }
        
        const isS1 = mode === "fast";
        if (isS1) {
          byDate[date].system1 += xp;
          if (area === "focus") byDate[date].s1Focus += xp;
          else if (area === "reasoning") byDate[date].s1Reasoning += xp;
          else byDate[date].s1Creativity += xp;
        } else {
          byDate[date].system2 += xp;
          if (area === "focus") byDate[date].s2Focus += xp;
          else if (area === "reasoning") byDate[date].s2Reasoning += xp;
          else byDate[date].s2Creativity += xp;
        }
      });

      // Build array for chart
      const result: DayData[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, "yyyy-MM-dd");
        const dayData = byDate[dateStr] || {
          date: dateStr,
          dateLabel: "",
          system1: 0,
          system2: 0,
          s1Focus: 0,
          s1Reasoning: 0,
          s1Creativity: 0,
          s2Focus: 0,
          s2Reasoning: 0,
          s2Creativity: 0,
        };
        dayData.dateLabel = format(date, "d/M");
        result.push(dayData);
      }
      return result;
    },
    enabled: !!stableUserId,
    staleTime: 60_000,
  });
}

// Hook to get weekly game completions with full details
function useWeeklyGameCompletions() {
  const { user } = useAuth();
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  
  const stableUserId = user?.id ?? (() => {
    try { return localStorage.getItem("nl:lastUserId") || undefined; } catch { return undefined; }
  })();

  return useQuery({
    queryKey: ["weekly-game-completions-v3", stableUserId, weekStart],
    queryFn: async () => {
      if (!stableUserId) return [];
      
      const { data, error } = await supabase
        .from("exercise_completions")
        .select("*")
        .eq("user_id", stableUserId)
        .eq("week_start", weekStart)
        .neq("gym_area", "content")
        .order("completed_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!stableUserId,
    staleTime: 60_000,
  });
}

// Custom tooltip for the chart
function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0]?.payload as DayData;
  if (!data) return null;

  const totalXP = data.system1 + data.system2;
  if (totalXP === 0) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-2.5 shadow-lg min-w-[140px]">
      <p className="text-[10px] text-muted-foreground mb-2">{label}</p>
      <p className="text-xs font-semibold mb-2">Total: {totalXP} XP</p>
      
      {data.system1 > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: SYSTEM_COLORS.s1 }} />
            <span className="text-[10px] font-medium text-amber-400">S1 · Fast: {data.system1} XP</span>
          </div>
          <div className="pl-3.5 space-y-0.5">
            {data.s1Focus > 0 && (
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <Target className="w-2.5 h-2.5" />
                <span>Focus: {data.s1Focus} XP</span>
              </div>
            )}
            {data.s1Reasoning > 0 && (
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <Brain className="w-2.5 h-2.5" />
                <span>Reasoning: {data.s1Reasoning} XP</span>
              </div>
            )}
            {data.s1Creativity > 0 && (
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <Lightbulb className="w-2.5 h-2.5" />
                <span>Creativity: {data.s1Creativity} XP</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {data.system2 > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: SYSTEM_COLORS.s2 }} />
            <span className="text-[10px] font-medium text-violet-400">S2 · Slow: {data.system2} XP</span>
          </div>
          <div className="pl-3.5 space-y-0.5">
            {data.s2Focus > 0 && (
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <Target className="w-2.5 h-2.5" />
                <span>Focus: {data.s2Focus} XP</span>
              </div>
            )}
            {data.s2Reasoning > 0 && (
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <Brain className="w-2.5 h-2.5" />
                <span>Reasoning: {data.s2Reasoning} XP</span>
              </div>
            )}
            {data.s2Creativity > 0 && (
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <Lightbulb className="w-2.5 h-2.5" />
                <span>Creativity: {data.s2Creativity} XP</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Format game exercise_id to readable name
function formatGameName(exerciseId: string): string {
  // Remove common prefixes and format
  const name = exerciseId
    .replace(/^(focus|reasoning|creativity|memory|visual|control)[-_]/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return name || exerciseId;
}

// Get area icon
function AreaIcon({ area }: { area: string }) {
  const normalizedArea = area?.toLowerCase() || "focus";
  if (normalizedArea === "focus" || normalizedArea === "memory" || normalizedArea === "visual") {
    return <Target className="w-3 h-3 text-blue-400" />;
  } else if (normalizedArea === "reasoning" || normalizedArea === "control") {
    return <Brain className="w-3 h-3 text-purple-400" />;
  } else {
    return <Lightbulb className="w-3 h-3 text-amber-400" />;
  }
}

export function GamesStats() {
  const { user } = useAuth();
  
  const stableUserId = user?.id ?? (() => {
    try { return localStorage.getItem("nl:lastUserId") || undefined; } catch { return undefined; }
  })();
  
  const { data: profile } = useQuery({
    queryKey: ["profile-games", stableUserId],
    queryFn: async () => {
      if (!stableUserId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("training_plan")
        .eq("user_id", stableUserId)
        .single();
      return data;
    },
    enabled: !!stableUserId,
  });
  
  const userPlan = (profile?.training_plan as TrainingPlanId) || "light";
  const plan = TRAINING_PLANS[userPlan];
  
  // Match useCappedWeeklyProgress formula: detoxXPTarget = weeklyMinutes * xpPerMinute (no bonusXP)
  const detoxXPTarget = Math.round(plan.detox.weeklyMinutes * plan.detox.xpPerMinute);
  const gamesXPTarget = Math.max(0, plan.weeklyXPTarget - plan.contentXPTarget - detoxXPTarget);
  
  const { data: sessions = [], isLoading } = useWeeklyGameCompletions();
  const { data: historyData } = useGamesHistory(14);

  // Calculate detailed stats per system and area
  const stats = useMemo(() => {
    type AreaKey = "focus" | "reasoning" | "creativity";
    
    interface AreaStats {
      count: number;
      xp: number;
      totalScore: number;
      avgScore: number;
    }
    
    interface SystemStats {
      xp: number;
      count: number;
      totalScore: number;
      avgScore: number;
      areas: Record<AreaKey, AreaStats>;
    }
    
    const initAreaStats = (): AreaStats => ({ count: 0, xp: 0, totalScore: 0, avgScore: 0 });
    const initSystemStats = (): SystemStats => ({
      xp: 0,
      count: 0,
      totalScore: 0,
      avgScore: 0,
      areas: {
        focus: initAreaStats(),
        reasoning: initAreaStats(),
        creativity: initAreaStats(),
      },
    });
    
    const s1: SystemStats = initSystemStats();
    const s2: SystemStats = initSystemStats();
    
    sessions.forEach((session) => {
      const isS1 = session.thinking_mode === "fast";
      const system = isS1 ? s1 : s2;
      const rawArea = (session.gym_area as string) || "focus";
      
      // Map to 3 main areas
      let area: AreaKey;
      if (rawArea === "focus" || rawArea === "memory" || rawArea === "visual") {
        area = "focus";
      } else if (rawArea === "reasoning" || rawArea === "control") {
        area = "reasoning";
      } else {
        area = "creativity";
      }
      
      const xp = session.xp_earned || 0;
      const score = session.score ?? 0;
      
      system.xp += xp;
      system.count++;
      system.totalScore += score;
      
      system.areas[area].count++;
      system.areas[area].xp += xp;
      system.areas[area].totalScore += score;
    });
    
    // Calculate averages
    s1.avgScore = s1.count > 0 ? Math.round(s1.totalScore / s1.count) : 0;
    s2.avgScore = s2.count > 0 ? Math.round(s2.totalScore / s2.count) : 0;
    
    (["focus", "reasoning", "creativity"] as AreaKey[]).forEach((area) => {
      s1.areas[area].avgScore = s1.areas[area].count > 0 ? Math.round(s1.areas[area].totalScore / s1.areas[area].count) : 0;
      s2.areas[area].avgScore = s2.areas[area].count > 0 ? Math.round(s2.areas[area].totalScore / s2.areas[area].count) : 0;
    });
    
    return { 
      s1, 
      s2,
      s1XP: s1.xp,
      s2XP: s2.xp,
      s1Count: s1.count,
      s2Count: s2.count,
    };
  }, [sessions]);

  if (isLoading) {
    return (
      <div className="p-6 rounded-xl bg-card/40 border border-border/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  const weeklyGamesXP = sessions.reduce((sum, s) => sum + (s.xp_earned || 0), 0);
  const gamesProgress = Math.min(100, (weeklyGamesXP / gamesXPTarget) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Challenges Progress */}
      <div className="p-4 rounded-xl bg-card/40 border border-border/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Swords className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-[13px] font-semibold">Challenges Progress</h3>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-foreground">{weeklyGamesXP}</span>
            <span className="text-[10px] text-muted-foreground">/{gamesXPTarget} XP</span>
          </div>
        </div>
        
        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${gamesProgress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full bg-foreground/70 rounded-full"
          />
        </div>
        
        {/* System legend */}
        <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-border/20">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] text-muted-foreground">S1 · Fast</span>
            <span className="text-[10px] font-medium text-amber-400">{stats.s1XP} XP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-violet-400" />
            <span className="text-[10px] text-muted-foreground">S2 · Slow</span>
            <span className="text-[10px] font-medium text-violet-400">{stats.s2XP} XP</span>
          </div>
        </div>
      </div>

      {/* 14-Day Trend Chart with System1/System2 breakdown */}
      <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-medium text-foreground">14-Day Trend</span>
          <span className="text-[9px] text-muted-foreground ml-auto">XP / day</span>
        </div>
        {historyData && historyData.some(d => d.system1 + d.system2 > 0) ? (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                <XAxis 
                  dataKey="dateLabel" 
                  tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={40}
                />
                <YAxis 
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                  allowDecimals={false}
                  domain={[0, (dataMax: number) => Math.max(dataMax, 10)]}
                  tickFormatter={(value) => `${Math.round(value)}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
                <Bar 
                  dataKey="system1" 
                  stackId="systems"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={20}
                  fill={SYSTEM_COLORS.s1}
                  name="System 1"
                />
                <Bar 
                  dataKey="system2" 
                  stackId="systems"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                  fill={SYSTEM_COLORS.s2}
                  name="System 2"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-24 flex flex-col items-center justify-center text-center">
            <Swords className="h-6 w-6 text-muted-foreground/30 mb-2" />
            <p className="text-[10px] text-muted-foreground">No challenges in the last 14 days</p>
            <p className="text-[9px] text-muted-foreground/60">Play challenges in the Lab to see your trend</p>
          </div>
        )}
        
        {/* Chart legend */}
        <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t border-border/20">
          <div className="flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-amber-400" />
            <span className="text-[8px] text-muted-foreground">S1 · Fast</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-violet-400" />
            <span className="text-[8px] text-muted-foreground">S2 · Slow</span>
          </div>
        </div>
      </div>

      {/* System Breakdown Cards with Area Details */}
      {sessions.length > 0 && (
        <>
          {/* System 1 - Fast */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-card/50 to-transparent border border-amber-500/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Zap className="h-4 w-4 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">System 1 · Fast</p>
                <p className="text-[10px] text-muted-foreground">Intuitive responses</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-amber-400">{stats.s1XP} XP</p>
                <p className="text-[9px] text-muted-foreground">{stats.s1Count} games · {stats.s1.avgScore}% avg</p>
              </div>
            </div>
            
            {/* S1 Area breakdown */}
            {stats.s1Count > 0 && (
              <div className="space-y-2 pt-3 border-t border-amber-500/10">
                {(["focus", "reasoning", "creativity"] as const).map((area) => {
                  const areaStats = stats.s1.areas[area];
                  if (areaStats.count === 0) return null;
                  
                  const areaLabels = { focus: "Focus", reasoning: "Reasoning", creativity: "Creativity" };
                  const areaColors = { focus: "blue", reasoning: "purple", creativity: "amber" };
                  const metricsImpact = {
                    focus: ["Focus Stability", "Reaction Speed"],
                    reasoning: ["Reasoning Accuracy", "Decision Quality"],
                    creativity: ["Creative Thinking", "Pattern Recognition"],
                  };
                  
                  return (
                    <div key={area} className="p-2 rounded-lg bg-muted/20">
                      <div className="flex items-center gap-2 mb-1">
                        <AreaIcon area={area} />
                        <span className="text-[10px] font-medium">{areaLabels[area]}</span>
                        <span className="text-[9px] text-muted-foreground ml-auto">{areaStats.count} games</span>
                      </div>
                      <div className="flex items-center gap-3 text-[9px]">
                        <span className="text-amber-400 font-medium">+{areaStats.xp} XP</span>
                        <span className="text-muted-foreground">·</span>
                        <span className={areaStats.avgScore >= 70 ? "text-green-400" : areaStats.avgScore >= 50 ? "text-amber-400" : "text-red-400"}>
                          {areaStats.avgScore}% accuracy
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {metricsImpact[area].map((metric) => (
                          <span key={metric} className="text-[7px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400/80">
                            ↑ {metric}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* System 2 - Slow */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 via-card/50 to-transparent border border-violet-500/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Brain className="h-4 w-4 text-violet-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">System 2 · Slow</p>
                <p className="text-[10px] text-muted-foreground">Deliberate analysis</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-violet-400">{stats.s2XP} XP</p>
                <p className="text-[9px] text-muted-foreground">{stats.s2Count} games · {stats.s2.avgScore}% avg</p>
              </div>
            </div>
            
            {/* S2 Area breakdown */}
            {stats.s2Count > 0 && (
              <div className="space-y-2 pt-3 border-t border-violet-500/10">
                {(["focus", "reasoning", "creativity"] as const).map((area) => {
                  const areaStats = stats.s2.areas[area];
                  if (areaStats.count === 0) return null;
                  
                  const areaLabels = { focus: "Focus", reasoning: "Reasoning", creativity: "Creativity" };
                  const metricsImpact = {
                    focus: ["Clarity Score", "Attention Control"],
                    reasoning: ["Critical Thinking", "Logical Analysis"],
                    creativity: ["Conceptual Depth", "Divergent Thinking"],
                  };
                  
                  return (
                    <div key={area} className="p-2 rounded-lg bg-muted/20">
                      <div className="flex items-center gap-2 mb-1">
                        <AreaIcon area={area} />
                        <span className="text-[10px] font-medium">{areaLabels[area]}</span>
                        <span className="text-[9px] text-muted-foreground ml-auto">{areaStats.count} games</span>
                      </div>
                      <div className="flex items-center gap-3 text-[9px]">
                        <span className="text-violet-400 font-medium">+{areaStats.xp} XP</span>
                        <span className="text-muted-foreground">·</span>
                        <span className={areaStats.avgScore >= 70 ? "text-green-400" : areaStats.avgScore >= 50 ? "text-amber-400" : "text-red-400"}>
                          {areaStats.avgScore}% accuracy
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {metricsImpact[area].map((metric) => (
                          <span key={metric} className="text-[7px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400/80">
                            ↑ {metric}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Cognitive Metrics Impact Summary - ACCURATE FORMULAS */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 via-card/50 to-emerald-500/5 border border-primary/20">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Metrics Impact</p>
            
            {(() => {
              const totalGamesXP = stats.s1XP + stats.s2XP;
              
              // Games Engagement = min(100, weeklyGamesXP / gamesTarget × 100)
              // This contributes to Behavioral Engagement (30% of SCI) with weight 50%
              // So Games → SCI contribution = 0.30 × 0.50 × GamesEngagement = 0.15 × GamesEngagement
              const gamesEngagement = gamesXPTarget > 0 ? Math.min(100, (totalGamesXP / gamesXPTarget) * 100) : 0;
              const sciContribution = Math.round(0.15 * gamesEngagement);
              
              // Dual Process Balance = 100 - |S1% - S2%| where S1%,S2% are portion of total
              // Perfect balance when S1 ≈ S2
              let dualProcessBalance = 0;
              if (totalGamesXP > 0) {
                const s1Percent = (stats.s1XP / totalGamesXP) * 100;
                const s2Percent = (stats.s2XP / totalGamesXP) * 100;
                dualProcessBalance = Math.round(100 - Math.abs(s1Percent - s2Percent));
              }
              
              // Cognitive Age is NOT directly calculated from games XP
              // It's calculated from CPS (Cognitive Performance Score) which uses raw cognitive metrics
              // Games XP contributes indirectly by improving those metrics over time
              // We show this as "training effect" rather than direct calculation
              
              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-muted/20">
                      <p className="text-[8px] text-muted-foreground mb-1">Games Engagement</p>
                      <p className="text-sm font-bold text-blue-400">{Math.round(gamesEngagement)}%</p>
                      <p className="text-[7px] text-muted-foreground">of weekly target</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/20">
                      <p className="text-[8px] text-muted-foreground mb-1">SCI Contribution</p>
                      <p className="text-sm font-bold text-emerald-400">+{sciContribution}</p>
                      <p className="text-[7px] text-muted-foreground">pts to Network Score</p>
                    </div>
                  </div>
                  
                  <div className="p-2 rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[8px] text-muted-foreground">Dual Process Balance</p>
                      <p className={`text-[10px] font-medium ${dualProcessBalance >= 80 ? 'text-emerald-400' : dualProcessBalance >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                        {dualProcessBalance}%
                      </p>
                    </div>
                    <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dualProcessBalance}%` }}
                        transition={{ duration: 0.6 }}
                        className={`h-full rounded-full ${dualProcessBalance >= 80 ? 'bg-emerald-400' : dualProcessBalance >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                      />
                    </div>
                    <p className="text-[7px] text-muted-foreground/70 mt-1">
                      {dualProcessBalance >= 80 
                        ? "Excellent S1/S2 integration" 
                        : dualProcessBalance >= 50 
                          ? "Good balance, keep diversifying" 
                          : stats.s1XP > stats.s2XP 
                            ? "Add more S2 (Slow) games" 
                            : "Add more S1 (Fast) games"}
                    </p>
                  </div>
                  
                  <div className="p-2 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-[8px] text-muted-foreground mb-1">How Games Improve Cognitive Age</p>
                    <p className="text-[7px] text-muted-foreground/80 leading-relaxed">
                      Games train Focus Stability, Reasoning Accuracy, and Creativity metrics. 
                      These feed into your Cognitive Performance Score (CPS), which determines Cognitive Age. 
                      Consistent training over weeks shows measurable improvements.
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      )}

      {/* Recent Games List */}
      {sessions.length > 0 && (
        <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Recent Games</p>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {sessions.slice(0, 10).map((session, idx) => {
              const isS1 = session.thinking_mode === "fast";
              const systemColor = isS1 ? "amber" : "violet";
              const completedAt = parseISO(session.completed_at);
              
              return (
                <div 
                  key={session.id || idx}
                  className={`p-2.5 rounded-lg bg-${systemColor}-500/5 border border-${systemColor}-500/10`}
                  style={{ 
                    backgroundColor: isS1 ? 'rgba(245, 158, 11, 0.05)' : 'rgba(139, 92, 246, 0.05)',
                    borderColor: isS1 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(139, 92, 246, 0.1)'
                  }}
                >
                  <div className="flex items-start gap-2">
                    <AreaIcon area={session.gym_area} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-medium truncate">
                          {formatGameName(session.exercise_id)}
                        </span>
                        <span 
                          className={`text-[8px] px-1.5 py-0.5 rounded font-medium ${
                            isS1 ? 'bg-amber-500/20 text-amber-400' : 'bg-violet-500/20 text-violet-400'
                          }`}
                        >
                          {isS1 ? 'S1' : 'S2'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {format(completedAt, "d/M HH:mm")}
                        </span>
                        {session.score !== null && session.score !== undefined && (
                          <span className="flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5 text-green-400" />
                            {session.score}%
                          </span>
                        )}
                        <span className="font-medium text-primary">
                          +{session.xp_earned} XP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {sessions.length > 10 && (
            <p className="text-[9px] text-muted-foreground text-center mt-2">
              +{sessions.length - 10} more games this week
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
