import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfMonth, format } from "date-fns";
import { TrainingPlanId, TRAINING_PLANS } from "@/lib/trainingPlans";

export type ContentType = "podcast" | "reading" | "book";
export type ContentStatus = "pending" | "in_progress" | "completed" | "skipped";

export interface ContentAssignment {
  id: string;
  user_id: string;
  month_start: string;
  content_type: ContentType;
  content_id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  is_required: boolean;
  status: ContentStatus;
  time_spent_minutes: number;
  completed_at: string | null;
  session_type: string | null;
}

export function useMonthlyContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const planId = (user?.trainingPlan || "light") as TrainingPlanId;
  const plan = TRAINING_PLANS[planId];

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["monthly-content", user?.id, monthStart],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("monthly_content_assignments")
        .select("*")
        .eq("user_id", user.id)
        .eq("month_start", monthStart)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return (data || []) as ContentAssignment[];
    },
    enabled: !!user?.id,
  });

  const addContent = useMutation({
    mutationFn: async (content: {
      content_type: ContentType;
      content_id: string;
      title: string;
      description?: string;
      duration_minutes?: number;
      is_required?: boolean;
      session_type?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("monthly_content_assignments")
        .insert({
          user_id: user.id,
          month_start: monthStart,
          ...content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-content"] });
    },
  });

  const updateContentStatus = useMutation({
    mutationFn: async ({ 
      contentId, 
      status, 
      timeSpent 
    }: { 
      contentId: string; 
      status?: ContentStatus;
      timeSpent?: number;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const updates: Record<string, unknown> = {};
      if (status) {
        updates.status = status;
        if (status === "completed") {
          updates.completed_at = new Date().toISOString();
        }
      }
      if (typeof timeSpent === "number") {
        updates.time_spent_minutes = timeSpent;
      }

      const { data, error } = await supabase
        .from("monthly_content_assignments")
        .update(updates)
        .eq("id", contentId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-content"] });
    },
  });

  const addReadingTime = useMutation({
    mutationFn: async ({ contentId, minutes }: { contentId: string; minutes: number }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const current = assignments?.find(a => a.id === contentId);
      const newTime = (current?.time_spent_minutes || 0) + minutes;

      const { data, error } = await supabase
        .from("monthly_content_assignments")
        .update({ 
          time_spent_minutes: newTime,
          status: "in_progress" 
        })
        .eq("id", contentId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-content"] });
    },
  });

  // Calculate content metrics
  const contentByType = {
    podcast: assignments?.filter(a => a.content_type === "podcast") || [],
    reading: assignments?.filter(a => a.content_type === "reading") || [],
    book: assignments?.filter(a => a.content_type === "book") || [],
  };

  const completedContent = assignments?.filter(a => a.status === "completed").length || 0;
  const totalContent = assignments?.length || 0;
  const contentProgress = totalContent > 0 ? (completedContent / totalContent) * 100 : 0;

  const totalReadingTime = assignments?.reduce((sum, a) => sum + a.time_spent_minutes, 0) || 0;

  const requiredContentPerWeek = plan.contentPerWeek;

  return {
    assignments,
    isLoading,
    addContent,
    updateContentStatus,
    addReadingTime,
    contentByType,
    completedContent,
    totalContent,
    contentProgress,
    totalReadingTime,
    requiredContentPerWeek,
    plan,
  };
}
