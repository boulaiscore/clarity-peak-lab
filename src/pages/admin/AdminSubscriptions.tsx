import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { format } from "date-fns";
import { Crown, Zap, Eye, RefreshCw } from "lucide-react";

export default function AdminSubscriptions() {
  const navigate = useNavigate();
  const { users, stats, isLoading, refetch } = useAdminUsers();

  // Filter to show only paid users first, then free
  const sortedUsers = [...users].sort((a, b) => {
    const order = { pro: 0, premium: 1, free: 2 };
    const aOrder = order[a.subscription_status as keyof typeof order] ?? 2;
    const bOrder = order[b.subscription_status as keyof typeof order] ?? 2;
    return aOrder - bOrder;
  });

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Subscriptions</h1>
            <p className="text-muted-foreground">
              Manage user subscription status
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-amber-500">{stats.proUsers}</p>
              <p className="text-xs text-muted-foreground">Pro</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-violet-500">{stats.premiumUsers}</p>
              <p className="text-xs text-muted-foreground">Premium</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{stats.freeUsers}</p>
              <p className="text-xs text-muted-foreground">Free</p>
            </CardContent>
          </Card>
        </div>

        {/* Subscriptions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Users</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium">
                        {user.name || "—"}
                      </TableCell>
                      <TableCell>
                        {getSubscriptionBadge(user.subscription_status)}
                      </TableCell>
                      <TableCell>{user.report_credits ?? 0}</TableCell>
                      <TableCell>
                        {user.created_at
                          ? format(new Date(user.created_at), "MMM d")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/users/${user.user_id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
