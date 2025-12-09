import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNeuroGymSessions } from "@/hooks/useNeuroGym";
import { Link } from "react-router-dom";
import { BarChart3, Brain, Clock, TrendingUp, Lock, Target, Sliders, Lightbulb, Sparkles } from "lucide-react";
import { useMemo } from "react";

const Insights = () => {
  const { user } = useAuth();
  const isPremium = user?.subscriptionStatus === "premium";
  const { data: sessions = [] } = useNeuroGymSessions(user?.id);

  // Count sessions by area
  const areaCounts = useMemo(() => {
    return sessions.reduce((acc, session) => {
      acc[session.area] = (acc[session.area] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [sessions]);

  const focusSessions = areaCounts["focus"] || 0;
  const memorySessions = areaCounts["memory"] || 0;
  const controlSessions = areaCounts["control"] || 0;
  const reasoningSessions = areaCounts["reasoning"] || 0;
  const creativitySessions = areaCounts["creativity"] || 0;
  const totalSessions = sessions.length;

  // Calculate most used duration
  const durationCounts = sessions.reduce((acc, session) => {
    acc[session.duration_option] = (acc[session.duration_option] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostUsedDuration = Object.entries(durationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  // Find most trained area
  const sortedAreas = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]);
  const mostTrainedArea = sortedAreas[0]?.[0];
  const leastTrainedArea = sortedAreas[sortedAreas.length - 1]?.[0];

  const areaNames: Record<string, string> = {
    focus: "Focus Arena",
    memory: "Memory Core",
    control: "Control Lab",
    reasoning: "Critical Reasoning",
    creativity: "Creativity Hub",
  };

  const insights = [
    {
      condition: mostTrainedArea && leastTrainedArea && mostTrainedArea !== leastTrainedArea && totalSessions > 5,
      text: `You favor ${areaNames[mostTrainedArea] || mostTrainedArea}. Consider adding ${areaNames[leastTrainedArea] || leastTrainedArea} sessions for balanced cognitive development.`,
    },
    {
      condition: mostUsedDuration === "30s" && totalSessions > 5,
      text: "Most sessions are 30-second drills. Longer sessions may unlock deeper cognitive benefits.",
    },
    {
      condition: totalSessions > 10 && memorySessions < 2,
      text: "Memory Core is underutilized. Working memory training compounds significantly over time.",
    },
    {
      condition: totalSessions >= 3,
      text: "Consistent practice builds cognitive fitness. Aim for daily sessions to maximize compounding.",
    },
  ];

  const activeInsight = insights.find((i) => i.condition)?.text || 
    "Complete more sessions to generate personalized insights.";

  const areas = [
    { id: "focus", name: "Focus Arena", count: focusSessions, icon: Target },
    { id: "memory", name: "Memory Core", count: memorySessions, icon: Brain },
    { id: "control", name: "Control Lab", count: controlSessions, icon: Sliders },
    { id: "reasoning", name: "Critical Reasoning", count: reasoningSessions, icon: Lightbulb },
    { id: "creativity", name: "Creativity Hub", count: creativitySessions, icon: Sparkles },
  ];

  return (
    <AppShell>
      <div className="container px-6 py-10 sm:py-16">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-semibold mb-3 tracking-tight">
              Cognitive <span className="text-gradient">Insights</span>
            </h1>
            <p className="text-muted-foreground">
              Track your Neuro Gym training patterns and optimize your practice.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-6 rounded-xl bg-card border border-border shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-3xl font-semibold mb-1">{totalSessions}</p>
              <p className="text-sm text-muted-foreground">Gym Sessions</p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-3xl font-semibold mb-1">{mostUsedDuration}</p>
              <p className="text-sm text-muted-foreground">Preferred Duration</p>
            </div>
          </div>

          {/* Area Breakdown */}
          <div className="p-6 rounded-xl bg-card border border-border mb-8 shadow-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Neuro Gym Distribution
            </h3>
            <div className="space-y-4">
              {areas.map((area) => (
                <div key={area.id}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="flex items-center gap-2">
                      <area.icon className="w-4 h-4 text-muted-foreground" />
                      {area.name}
                    </span>
                    <span className="text-muted-foreground">{area.count}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-primary rounded-full transition-all"
                      style={{ width: `${totalSessions ? (area.count / totalSessions) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insight Card */}
          <div className="p-6 rounded-xl bg-gradient-surface border border-border mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Pattern Insight</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{activeInsight}</p>
              </div>
            </div>
          </div>

          {/* Premium Upsell */}
          {!isPremium && (
            <div className="p-6 rounded-xl border border-primary/20 bg-primary/5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Weekly Performance Briefing</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Upgrade to Premium for detailed weekly analysis and personalized cognitive training recommendations.
                  </p>
                  <Button asChild size="sm" variant="hero" className="rounded-xl">
                    <Link to="/app/premium">Unlock Premium</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default Insights;
