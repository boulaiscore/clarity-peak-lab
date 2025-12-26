import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfMonth, format } from "date-fns";
import { TrainingPlanId, TRAINING_PLANS } from "@/lib/trainingPlans";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

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
  const hasAttemptedAssignment = useRef(false);
  
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const planId = (user?.trainingPlan || "light") as TrainingPlanId;
  const plan = TRAINING_PLANS[planId];

  const { data: assignments, isLoading, refetch } = useQuery({
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

  // Auto-assign content when user visits and no content exists for the month
  const assignContent = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      
      console.log("[useMonthlyContent] Requesting content suggestions...");
      
      const { data, error } = await supabase.functions.invoke("suggest-content", {
        body: {
          userId: user.id,
          planId,
          monthStart,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.alreadyAssigned) {
        console.log("[useMonthlyContent] Content was already assigned");
      } else {
        console.log(`[useMonthlyContent] Assigned ${data.assigned} content items`);
        toast.success(`${data.assigned} contenuti assegnati per questo mese`);
      }
      queryClient.invalidateQueries({ queryKey: ["monthly-content"] });
    },
    onError: (error: Error) => {
      console.error("[useMonthlyContent] Assignment error:", error);
      if (error.message.includes("429")) {
        toast.error("Troppi richieste. Riprova più tardi.");
      } else if (error.message.includes("402")) {
        toast.error("Crediti AI esauriti.");
      } else {
        toast.error("Errore nell'assegnazione contenuti");
      }
    },
  });

  // Auto-trigger content assignment when:
  // 1. User is authenticated
  // 2. No content exists for this month
  // 3. Haven't attempted assignment yet in this session
  useEffect(() => {
    if (
      user?.id && 
      !isLoading && 
      assignments && 
      assignments.length === 0 && 
      !hasAttemptedAssignment.current &&
      !assignContent.isPending
    ) {
      hasAttemptedAssignment.current = true;
      assignContent.mutate();
    }
  }, [user?.id, isLoading, assignments, assignContent.isPending]);

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
    isLoading: isLoading || assignContent.isPending,
    isAssigning: assignContent.isPending,
    addContent,
    updateContentStatus,
    addReadingTime,
    assignContent,
    refetch,
    contentByType,
    completedContent,
    totalContent,
    contentProgress,
    totalReadingTime,
    requiredContentPerWeek,
    plan,
  };
}
