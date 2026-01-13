import { motion } from "framer-motion";
import { Smartphone, Ban, Clock, Calendar, Flame, Trophy, TrendingUp, Check } from "lucide-react";
import { useWeeklyDetoxXP, useTodayDetoxMinutes, useDetoxHistory } from "@/hooks/useDetoxProgress";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { TRAINING_PLANS, type TrainingPlanId } from "@/lib/trainingPlans";

export function DetoxStats() {
  const { user } = useAuth();
  const { data: weeklyData, isLoading } = useWeeklyDetoxXP();
  const { data: todayMinutes } = useTodayDetoxMinutes();
  const { data: historyData } = useDetoxHistory(14);

  // Get user's training plan
  const { data: profile } = useQuery({
    queryKey: ['profile-detox', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('training_plan')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const planId = (profile?.training_plan || 'light') as TrainingPlanId;
  const plan = TRAINING_PLANS[planId];
  const detoxRequirement = plan.detox;

  const totalMinutes = weeklyData?.totalMinutes || 0;
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const totalXP = weeklyData?.totalXP || 0;
  const completions = weeklyData?.completions || [];
  const sessionsCount = completions.length;

  // Goal progress from plan
  const weeklyMinutesTarget = detoxRequirement.weeklyMinutes;
  const goalProgress = Math.min(100, (totalMinutes / weeklyMinutesTarget) * 100);
  const goalReached = totalMinutes >= weeklyMinutesTarget;

  // Calculate streak (consecutive days with detox)
  const uniqueDays = new Set(
    completions.map((c) => format(parseISO(c.completed_at), "yyyy-MM-dd"))
  );
  const daysWithDetox = uniqueDays.size;

  // Average session duration
  const avgDuration = sessionsCount > 0 ? Math.round(totalMinutes / sessionsCount) : 0;

  // Format chart data - use XP for consistency with other charts
  const chartData = historyData?.map(d => ({
    ...d,
    dateShort: d.dateLabel,
  })) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Recovery Progress */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-card/50 to-amber-500/5 border border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-teal-500/15 flex items-center justify-center relative">
              <Smartphone className="w-3 h-3 text-teal-400" />
              <Ban className="w-1.5 h-1.5 text-teal-400 absolute -bottom-0.5 -right-0.5" />
            </div>
            <span className="text-[11px] font-medium text-foreground">Recovery Progress</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
              {plan.name}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-teal-400">
            {totalMinutes} / {weeklyMinutesTarget} min
          </span>
        </div>
        <div className="h-2 bg-teal-500/10 rounded-full overflow-hidden">
          <motion.div 
            className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: `${goalProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <p className="text-[9px] text-muted-foreground mt-1.5 flex items-center gap-1">
          {goalReached ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Goal reached!</span>
            </>
          ) : (
            `${Math.max(0, weeklyMinutesTarget - totalMinutes)} minutes remaining`
          )}
        </p>
      </div>

      {/* Trend Chart - Minutes per day */}
      <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
          <span className="text-[11px] font-medium text-foreground">14-Day Trend</span>
          <span className="text-[9px] text-muted-foreground ml-auto">min / day</span>
        </div>
        {chartData.length > 0 && chartData.some(d => d.minutes > 0) ? (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                <XAxis 
                  dataKey="dateShort" 
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
                  domain={[0, (dataMax: number) => Math.max(dataMax, 30)]}
                  tickFormatter={(value) => `${Math.round(value)}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                  labelFormatter={(label) => label}
                  formatter={(value: number) => [`${value} min`, 'Recovery']}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                />
                <Bar 
                  dataKey="minutes" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                >
                  {chartData?.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.minutes > 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--muted-foreground))'}
                      opacity={entry.minutes > 0 ? 1 : 0.18}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-24 flex flex-col items-center justify-center text-center">
            <div className="relative mb-2">
              <Smartphone className="h-6 w-6 text-muted-foreground/30" />
              <Ban className="h-3 w-3 text-muted-foreground/30 absolute -bottom-0.5 -right-1" />
            </div>
            <p className="text-[11px] text-muted-foreground">No recovery sessions in the last 14 days</p>
            <p className="text-[9px] text-muted-foreground/60 mt-0.5">Start a digital detox session to see your trend</p>
          </div>
        )}
      </div>


      {/* Metrics Impact */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 via-card/50 to-teal-500/5 border border-primary/20">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Metrics Impact</p>
        
        {(() => {
          // Recovery Factor = min(100, weeklyDetoxMinutes / detoxTarget × 100)
          // This contributes 20% to SCI
          const recoveryProgress = weeklyMinutesTarget > 0 ? Math.min(100, (totalMinutes / weeklyMinutesTarget) * 100) : 0;
          const sciContribution = Math.round(0.20 * recoveryProgress);
          
          return (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-muted/20">
                  <p className="text-[8px] text-muted-foreground mb-1">Recovery Factor</p>
                  <p className="text-sm font-bold text-teal-400">{Math.round(recoveryProgress)}%</p>
                  <p className="text-[7px] text-muted-foreground">of weekly target</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/20">
                  <p className="text-[8px] text-muted-foreground mb-1">SCI Contribution</p>
                  <p className="text-sm font-bold text-emerald-400">+{sciContribution}</p>
                  <p className="text-[7px] text-muted-foreground">pts to Network Score</p>
                </div>
              </div>
              
              <div className="p-2 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-[8px] text-muted-foreground mb-1">How Recovery Improves Cognition</p>
                <p className="text-[7px] text-muted-foreground/80 leading-relaxed">
                  Digital detox restores attention capacity and reduces cognitive fatigue. 
                  Based on Attention Restoration Theory (Kaplan 1995), regular breaks from 
                  screens improve Focus Stability and Decision Quality.
                </p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Today's Progress */}
      {(todayMinutes || 0) > 0 && (
        <div className="p-3 rounded-xl bg-muted/20 border border-border/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-[11px] text-muted-foreground">
              Today: <span className="text-foreground font-medium">{todayMinutes} minutes</span> of detox completed
            </span>
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      {completions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Recent Sessions
          </h4>
          <div className="space-y-1.5">
            {completions.slice(0, 5).map((completion) => (
              <div
                key={completion.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/20"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-teal-500/10 flex items-center justify-center">
                    <Smartphone className="w-3 h-3 text-teal-400" />
                  </div>
                  <span className="text-[11px] text-foreground">
                    {completion.duration_minutes} min recovery
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-teal-400 font-medium">+{completion.xp_earned} XP</span>
                  <span className="text-[9px] text-muted-foreground">
                    {format(parseISO(completion.completed_at), "d MMM", { locale: it })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}