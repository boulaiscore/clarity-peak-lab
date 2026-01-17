import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { Users, Crown, Zap, UserCheck, ArrowRight } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { stats, isLoading } = useAdminUsers();

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Premium",
      value: stats.premiumUsers,
      icon: Zap,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
    {
      title: "Pro",
      value: stats.proUsers,
      icon: Crown,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Onboarded",
      value: stats.onboardedUsers,
      icon: UserCheck,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ];

  return (
    <AppShell>
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage users and subscriptions
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {isLoading ? "—" : stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate("/admin/users")}
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                View All Users
              </span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate("/admin/subscriptions")}
            >
              <span className="flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Manage Subscriptions
              </span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
