import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserMetricsCard } from "@/components/admin/UserMetricsCard";
import { AdminActions } from "@/components/admin/AdminActions";
import { useAdminUserDetail } from "@/hooks/useAdminUsers";
import { ArrowLeft, Crown, Zap, User, Calendar, Briefcase, GraduationCap } from "lucide-react";

export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user, isLoading, error } = useAdminUserDetail(userId);

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (error || !user) {
    return (
      <AppShell>
        <div className="p-4 text-center">
          <p className="text-muted-foreground mb-4">User not found</p>
          <Button variant="outline" onClick={() => navigate("/admin/users")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Users
          </Button>
        </div>
      </AppShell>
    );
  }

  const getSubscriptionBadge = (status: string | null) => {
    switch (status) {
      case "pro":
        return (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            <Crown className="w-3 h-3 mr-1" />
            Pro
          </Badge>
        );
      case "premium":
        return (
          <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white">
            <Zap className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        );
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/users")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{user.name || "Unnamed User"}</h1>
              {getSubscriptionBadge(user.subscription_status)}
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              {user.user_id}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p>{user.age ?? "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="capitalize">{user.gender || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p>
                      {user.created_at
                        ? format(new Date(user.created_at), "MMMM d, yyyy")
                        : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Background</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Work Type</p>
                    <p className="capitalize">{user.work_type || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Education</p>
                    <p className="capitalize">
                      {user.education_level?.replace("_", " ") || "Not set"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Discipline</p>
                    <p className="capitalize">
                      {user.degree_discipline?.replace("_", " ") || "Not set"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Training</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="capitalize">{user.training_plan || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Sessions</span>
                  <span>{user.total_sessions ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Exercises</span>
                  <span>{user.total_exercises ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Report Credits</span>
                  <span>{user.report_credits ?? 0}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="mt-4">
            <UserMetricsCard user={user} />
          </TabsContent>

          <TabsContent value="actions" className="mt-4">
            <AdminActions
              user={user}
              onUpdate={() => navigate(0)} // Force refresh
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
