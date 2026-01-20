import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReportGeneration {
  id: string;
  user_id: string;
  generated_at: string;
  report_type: string;
  cognitive_age: number | null;
  sci_score: number | null;
  fast_thinking: number | null;
  slow_thinking: number | null;
  total_sessions: number | null;
}

export function useReportHistory(userId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ["report-history", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("report_generations")
        .select("*")
        .eq("user_id", userId)
        .order("generated_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching report history:", error);
        return [];
      }

      return data as ReportGeneration[];
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const saveReport = useMutation({
    mutationFn: async (params: {
      cognitiveAge?: number;
      sciScore?: number;
      fastThinking?: number;
      slowThinking?: number;
      totalSessions?: number;
    }) => {
      if (!userId) throw new Error("Not authenticated");

      const { error } = await supabase.from("report_generations").insert({
        user_id: userId,
        cognitive_age: params.cognitiveAge ?? null,
        sci_score: params.sciScore ?? null,
        fast_thinking: params.fastThinking ?? null,
        slow_thinking: params.slowThinking ?? null,
        total_sessions: params.totalSessions ?? null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-history", userId] });
    },
  });

  return {
    reports: reports ?? [],
    isLoading,
    saveReport,
  };
}
