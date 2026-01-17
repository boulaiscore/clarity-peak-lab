import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AdminUserOverview } from "@/hooks/useAdminUsers";

interface UserMetricsCardProps {
  user: AdminUserOverview;
}

interface MetricRowProps {
  label: string;
  value: number | null;
  maxValue?: number;
}

function MetricRow({ label, value, maxValue = 100 }: MetricRowProps) {
  const displayValue = value ?? 0;
  const percentage = (displayValue / maxValue) * 100;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">{displayValue.toFixed(1)}</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}

export function UserMetricsCard({ user }: UserMetricsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cognitive Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <MetricRow label="Fast Thinking" value={user.fast_thinking} />
        <MetricRow label="Slow Thinking" value={user.slow_thinking} />
        <MetricRow label="Creativity" value={user.creativity} />
        <MetricRow label="Reasoning" value={user.reasoning_accuracy} />
        <MetricRow label="Focus" value={user.focus_stability} />
        
        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Training Capacity</span>
            <span className="font-mono">{user.training_capacity?.toFixed(1) ?? "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Experience Points</span>
            <span className="font-mono">{user.experience_points ?? 0} XP</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Cognitive Level</span>
            <span className="font-mono">Level {user.cognitive_level ?? 1}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
