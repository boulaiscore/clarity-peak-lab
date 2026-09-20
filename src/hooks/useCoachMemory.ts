import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CoachMemoryFact {
  id: string;
  category: string;
  fact: string;
}

/**
 * Long-term facts the coach has remembered about the user.
 * Written server-side by the looma-coach function; read and cleared from here.
 */
export function useCoachMemory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["coach-memory", user?.id];

  const query = useQuery({
    queryKey,
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async (): Promise<CoachMemoryFact[]> => {
      const { data, error } = await supabase
        .from("coach_memory")
        .select("id, category, fact")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CoachMemoryFact[];
    },
  });

  const forgetAll = async () => {
    if (!user?.id) return;
    const { error } = await supabase.from("coach_memory").delete().eq("user_id", user.id);
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey });
  };

  const forgetOne = async (id: string) => {
    const { error } = await supabase.from("coach_memory").delete().eq("id", id);
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey });
  };

  const refresh = () => queryClient.invalidateQueries({ queryKey });

  return {
    facts: query.data ?? [],
    isLoading: query.isLoading,
    forgetAll,
    forgetOne,
    refresh,
  };
}
