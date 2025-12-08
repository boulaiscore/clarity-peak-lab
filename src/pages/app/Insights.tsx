import { AppShell } from "@/components/app/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "@/contexts/SessionContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { BarChart3, Flame, Brain, Scale, TrendingUp, Clock, Lightbulb, Crown, Lock } from "lucide-react";

const Insights = () => {
  const { sessions, getSessionsByType } = useSession();
  const { user } = useAuth();
  const isPremium = user?.subscriptionStatus === "premium";

  const stressSessions = getSessionsByType("stress").length;
  const claritySessions = getSessionsByType("clarity").length;
  const decisionSessions = getSessionsByType("decision").length;
  const totalSessions = sessions.length;

  // Calculate most used duration
  const durationCounts = sessions.reduce((acc, session) => {
    acc[session.durationOption] = (acc[session.durationOption] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostUsedDuration = Object.entries(durationCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Calculate time of day distribution
  const getTimeOfDay = (date: Date) => {
    const hour = new Date(date).getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  };

  const timeCounts = sessions.reduce((acc, session) => {
    const tod = getTimeOfDay(session.createdAt);
    acc[tod] = (acc[tod] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const peakTime = Object.entries(timeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Generate insights
  const freeInsights = [
    totalSessions > 0 && `You've completed ${totalSessions} session${totalSessions !== 1 ? "s" : ""} so far. Keep building the habit!`,
    mostUsedDuration && `Your preferred session length is ${mostUsedDuration}. ${mostUsedDuration === "30s" ? "Quick resets work well for you." : mostUsedDuration === "5min" ? "You value deep sessions." : "A balanced approach."}`,
  ].filter(Boolean);

  const premiumInsights = [
    peakTime && `Your peak performance time is in the ${peakTime}. Consider scheduling important work then.`,
    stressSessions > claritySessions && "You use stress protocols more often. Try starting your day with a clarity session for proactive mental prep.",
    claritySessions > stressSessions && "You're proactive about clarity. Great habit for high performers!",
    decisionSessions > 0 && "You're using Decision Pro. This is correlated with better outcomes in high-stakes situations.",
  ].filter(Boolean);

  return (
    <AppShell>
      <div className="container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Insights</h1>
            <p className="text-muted-foreground">
              Your mental performance patterns and recommendations.
            </p>
          </div>

          {totalSessions === 0 ? (
            <Card variant="elevated" className="p-8 text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
              <p className="text-muted-foreground mb-4">
                Complete your first session to start seeing insights.
              </p>
              <Button asChild variant="hero">
                <Link to="/app">Start a Session</Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card variant="elevated" className="p-4 text-center">
                  <div className="text-3xl font-bold text-gradient mb-1">{totalSessions}</div>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                </Card>
                <Card variant="elevated" className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Flame className="w-5 h-5 text-red-400" />
                    <span className="text-2xl font-bold">{stressSessions}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Stress</p>
                </Card>
                <Card variant="elevated" className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Brain className="w-5 h-5 text-blue-400" />
                    <span className="text-2xl font-bold">{claritySessions}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Clarity</p>
                </Card>
                <Card variant="elevated" className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Scale className="w-5 h-5 text-purple-400" />
                    <span className="text-2xl font-bold">{decisionSessions}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Decision</p>
                </Card>
              </div>

              {/* Free Insights */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  Your Insights
                </h2>
                <div className="space-y-3">
                  {freeInsights.map((insight, index) => (
                    <Card key={index} variant="elevated" className="p-4">
                      <p className="text-foreground">{insight}</p>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Premium Insights */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary" />
                  Weekly Performance Brief
                  {!isPremium && (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      Premium
                    </span>
                  )}
                </h2>

                {isPremium ? (
                  <div className="space-y-3">
                    {premiumInsights.map((insight, index) => (
                      <Card key={index} variant="glow" className="p-4">
                        <p className="text-foreground">{insight}</p>
                      </Card>
                    ))}
                    <Card variant="glow" className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="font-medium">This Week's Summary</span>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {totalSessions} sessions completed. Your focus is on {
                          stressSessions >= claritySessions && stressSessions >= decisionSessions
                            ? "stress management"
                            : claritySessions >= stressSessions && claritySessions >= decisionSessions
                            ? "mental clarity"
                            : "decision making"
                        }. Consider diversifying your protocols for balanced mental fitness.
                      </p>
                    </Card>
                  </div>
                ) : (
                  <Card variant="elevated" className="p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4 opacity-50">
                        <Lock className="w-5 h-5" />
                        <p className="text-sm">Premium insights are locked</p>
                      </div>
                      <p className="text-muted-foreground mb-4">
                        Unlock weekly performance briefs, personalized recommendations, and advanced analytics.
                      </p>
                      <Button asChild variant="hero">
                        <Link to="/app/premium">Unlock Premium</Link>
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default Insights;
