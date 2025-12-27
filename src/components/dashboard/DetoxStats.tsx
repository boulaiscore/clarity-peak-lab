import { motion } from "framer-motion";
import { Smartphone, Ban, Clock, Calendar, Flame, Trophy, TrendingUp } from "lucide-react";
import { useWeeklyDetoxXP, useTodayDetoxMinutes, useDetoxHistory, useDetoxGoal } from "@/hooks/useDetoxProgress";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from "recharts";

export function DetoxStats() {
  const { data: weeklyData, isLoading } = useWeeklyDetoxXP();
  const { data: todayMinutes } = useTodayDetoxMinutes();
  const { data: historyData } = useDetoxHistory(14);
  const { data: goal } = useDetoxGoal();

  const totalMinutes = weeklyData?.totalMinutes || 0;
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const totalXP = weeklyData?.totalXP || 0;
  const completions = weeklyData?.completions || [];
  const sessionsCount = completions.length;

  // Goal progress
  const weeklyMinutesTarget = goal?.weeklyMinutesTarget || 120;
  const goalProgress = Math.min(100, (totalMinutes / weeklyMinutesTarget) * 100);

  // Calculate streak (consecutive days with detox)
  const uniqueDays = new Set(
    completions.map((c) => format(parseISO(c.completed_at), "yyyy-MM-dd"))
  );
  const daysWithDetox = uniqueDays.size;

  // Average session duration
  const avgDuration = sessionsCount > 0 ? Math.round(totalMinutes / sessionsCount) : 0;

  // Format chart data
  const chartData = historyData?.map(d => ({
    ...d,
    dateShort: d.dateLabel.split(" ")[0],
  })) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Weekly Goal Progress */}
      <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-teal-500/15 flex items-center justify-center relative">
              <Smartphone className="w-3 h-3 text-teal-400" />
              <Ban className="w-1.5 h-1.5 text-teal-400 absolute -bottom-0.5 -right-0.5" />
            </div>
            <span className="text-[11px] font-medium text-foreground">Weekly Goal</span>
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
        <p className="text-[9px] text-muted-foreground mt-1.5">
          {goalProgress >= 100 
            ? "Weekly goal achieved! Keep it up!" 
            : `${Math.max(0, weeklyMinutesTarget - totalMinutes)} minutes remaining`}
        </p>
      </div>

      {/* Trend Chart */}
      {chartData.length > 0 && (
        <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-[11px] font-medium text-foreground">14-Day Trend</span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="detoxGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="dateShort" 
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                  labelFormatter={(label) => `Day ${label}`}
                  formatter={(value: number) => [`${value} min`, 'Detox']}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  fill="url(#detoxGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Time */}
        <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500/15 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Time</span>
          </div>
          <div className="text-xl font-bold text-foreground">
            {totalHours > 0 ? `${totalHours}h ${remainingMinutes}m` : `${totalMinutes}m`}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">this week</p>
        </div>

        {/* Sessions */}
        <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500/15 flex items-center justify-center relative">
              <Smartphone className="w-3.5 h-3.5 text-teal-400" />
              <Ban className="w-2 h-2 text-teal-400 absolute -bottom-0.5 -right-0.5" />
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Sessions</span>
          </div>
          <div className="text-xl font-bold text-foreground">{sessionsCount}</div>
          <p className="text-[10px] text-muted-foreground mt-0.5">completed</p>
        </div>

        {/* Days Active */}
        <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Days Active</span>
          </div>
          <div className="text-xl font-bold text-foreground">{daysWithDetox}</div>
          <p className="text-[10px] text-muted-foreground mt-0.5">out of 7</p>
        </div>

        {/* Avg Duration */}
        <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Avg Session</span>
          </div>
          <div className="text-xl font-bold text-foreground">{avgDuration}m</div>
          <p className="text-[10px] text-muted-foreground mt-0.5">per session</p>
        </div>
      </div>

      {/* XP Earned */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-foreground">Bonus XP Earned</span>
              <p className="text-[9px] text-muted-foreground">from detox challenges</p>
            </div>
          </div>
          <span className="text-lg font-bold text-amber-400">+{totalXP}</span>
        </div>
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
                    {completion.duration_minutes} min detox
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

      {/* Empty State */}
      {completions.length === 0 && !isLoading && (
        <div className="p-6 rounded-xl bg-muted/20 border border-border/20 text-center">
          <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto mb-3">
            <Smartphone className="w-5 h-5 text-teal-400" />
          </div>
          <p className="text-[12px] text-muted-foreground">
            No detox sessions this week yet.
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Start a detox challenge in NeuroLab to earn bonus XP!
          </p>
        </div>
      )}
    </motion.div>
  );
}