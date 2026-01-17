import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdminUserOverview {
  user_id: string;
  name: string | null;
  subscription_status: string | null;
  training_plan: string | null;
  created_at: string;
  onboarding_completed: boolean | null;
  age: number | null;
  gender: string | null;
  education_level: string | null;
  report_credits: number | null;
  degree_discipline: string | null;
  work_type: string | null;
  slow_thinking: number | null;
  fast_thinking: number | null;
  creativity: number | null;
  reasoning_accuracy: number | null;
  focus_stability: number | null;
  training_capacity: number | null;
  experience_points: number | null;
  cognitive_level: number | null;
  total_sessions: number | null;
  total_exercises: number | null;
}

export interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  proUsers: number;
  freeUsers: number;
  onboardedUsers: number;
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUserOverview[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    premiumUsers: 0,
    proUsers: 0,
    freeUsers: 0,
    onboardedUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("admin_user_overview" as never)
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching admin users:", fetchError);
        setError(fetchError.message);
        return;
      }

      const typedData = (data || []) as AdminUserOverview[];
      setUsers(typedData);

      // Calculate stats
      setStats({
        totalUsers: typedData.length,
        premiumUsers: typedData.filter(u => u.subscription_status === "premium").length,
        proUsers: typedData.filter(u => u.subscription_status === "pro").length,
        freeUsers: typedData.filter(u => u.subscription_status === "free" || !u.subscription_status).length,
        onboardedUsers: typedData.filter(u => u.onboarding_completed).length,
      });
    } catch (err) {
      console.error("Failed to fetch admin users:", err);
      setError("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, stats, isLoading, error, refetch: fetchUsers };
}

export function useAdminUserDetail(userId: string | undefined) {
  const [user, setUser] = useState<AdminUserOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchUser = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("admin_user_overview" as never)
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (fetchError) {
          console.error("Error fetching user detail:", fetchError);
          setError(fetchError.message);
          return;
        }

        setUser(data as AdminUserOverview | null);
      } catch (err) {
        console.error("Failed to fetch user detail:", err);
        setError("Failed to load user");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { user, isLoading, error };
}
