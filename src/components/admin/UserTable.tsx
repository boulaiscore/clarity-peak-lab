import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
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
import { Eye, Crown, Zap } from "lucide-react";
import { AdminUserOverview } from "@/hooks/useAdminUsers";

interface UserTableProps {
  users: AdminUserOverview[];
  isLoading: boolean;
}

export function UserTable({ users, isLoading }: UserTableProps) {
  const navigate = useNavigate();

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No users found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Sessions</TableHead>
          <TableHead>Level</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.user_id}>
            <TableCell className="font-medium">
              <div>
                <p>{user.name || "—"}</p>
                <p className="text-xs text-muted-foreground">
                  {user.onboarding_completed ? "Onboarded" : "Incomplete"}
                </p>
              </div>
            </TableCell>
            <TableCell>{getSubscriptionBadge(user.subscription_status)}</TableCell>
            <TableCell className="capitalize">{user.training_plan || "—"}</TableCell>
            <TableCell>{user.total_sessions ?? 0}</TableCell>
            <TableCell>
              <span className="font-mono text-sm">
                Lv.{user.cognitive_level ?? 1}
              </span>
            </TableCell>
            <TableCell>
              {user.created_at
                ? format(new Date(user.created_at), "MMM d, yyyy")
                : "—"}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/admin/users/${user.user_id}`)}
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
