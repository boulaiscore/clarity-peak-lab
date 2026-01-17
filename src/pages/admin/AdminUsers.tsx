import { useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UserTable } from "@/components/admin/UserTable";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { Search, RefreshCw } from "lucide-react";

export default function AdminUsers() {
  const { users, isLoading, refetch } = useAdminUsers();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredUsers = users.filter((user) => {
    // Search filter
    const matchesSearch =
      !search ||
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.user_id.toLowerCase().includes(search.toLowerCase());

    // Subscription filter
    const matchesFilter =
      filter === "all" ||
      (filter === "free" && (!user.subscription_status || user.subscription_status === "free")) ||
      user.subscription_status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Users</h1>
            <p className="text-muted-foreground">
              {users.length} total users
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <UserTable users={filteredUsers} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
