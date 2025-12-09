import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  computePhysioComponent,
  computeCognitiveComponent,
  computeCognitiveReadiness,
  classifyReadiness,
  WearableSnapshot,
} from "@/lib/readiness";

export function useCognitiveReadiness() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split("T")[0];

  // Fetch today's cognitive metrics
  const { data: cognitiveMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["cognitive-metrics", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_cognitive_metrics")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch today's wearable snapshot
  const { data: wearableSnapshot, isLoading: wearableLoading } = useQuery({
    queryKey: ["wearable-snapshot", user?.id, today],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("wearable_snapshots")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Calculate readiness
  const calculateReadiness = () => {
    if (!cognitiveMetrics) {
      return {
        cognitivePerformanceScore: null,
        physioComponentScore: null,
        cognitiveReadinessScore: null,
        readinessClassification: null,
        hasWearableData: false,
      };
    }

    const cognitiveInput = {
      reasoningAccuracy: Number(cognitiveMetrics.reasoning_accuracy) || 50,
      focusIndex: Number(cognitiveMetrics.focus_stability) || 50,
      workingMemoryScore: Number(cognitiveMetrics.visual_processing) || 50,
      fastThinkingScore: Number(cognitiveMetrics.fast_thinking) || 50,
      slowThinkingScore: Number(cognitiveMetrics.slow_thinking) || 50,
    };

    const wearableData: WearableSnapshot | null = wearableSnapshot
      ? {
          hrvMs: wearableSnapshot.hrv_ms ? Number(wearableSnapshot.hrv_ms) : null,
          restingHr: wearableSnapshot.resting_hr ? Number(wearableSnapshot.resting_hr) : null,
          sleepDurationMin: wearableSnapshot.sleep_duration_min ? Number(wearableSnapshot.sleep_duration_min) : null,
          sleepEfficiency: wearableSnapshot.sleep_efficiency ? Number(wearableSnapshot.sleep_efficiency) : null,
        }
      : null;

    const cognitivePerformanceScore = computeCognitiveComponent(cognitiveInput);
    const physioComponentScore = computePhysioComponent(wearableData);
    const cognitiveReadinessScore = computeCognitiveReadiness(
      physioComponentScore,
      cognitivePerformanceScore
    );
    const readinessClassification = classifyReadiness(cognitiveReadinessScore);

    return {
      cognitivePerformanceScore,
      physioComponentScore,
      cognitiveReadinessScore,
      readinessClassification,
      hasWearableData: !!wearableSnapshot,
    };
  };

  // Mutation to update readiness in database
  const updateReadinessMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !cognitiveMetrics) return;

      const readiness = calculateReadiness();

      const { error } = await supabase
        .from("user_cognitive_metrics")
        .update({
          cognitive_performance_score: readiness.cognitivePerformanceScore,
          physio_component_score: readiness.physioComponentScore,
          cognitive_readiness_score: readiness.cognitiveReadinessScore,
          readiness_classification: readiness.readinessClassification,
        })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cognitive-metrics"] });
    },
  });

  const readiness = calculateReadiness();

  return {
    ...readiness,
    isLoading: metricsLoading || wearableLoading,
    updateReadiness: updateReadinessMutation.mutate,
    wearableSnapshot,
    cognitiveMetrics,
  };
}
