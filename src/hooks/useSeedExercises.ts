import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import cognitiveExercisesData from "@/data/cognitive_exercises.json";
import type { ExerciseCategory, ExerciseType, ExerciseDifficulty, ExerciseDuration } from "@/lib/exercises";

interface ExerciseData {
  id: string;
  category: string;
  type: string;
  difficulty: string;
  duration: string;
  title: string;
  prompt: string;
  options?: string[];
  correctOptionIndex?: number;
  explanation?: string;
  metricsAffected: string[];
  weight: number;
}

export function useSeedExercises() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const exercises = cognitiveExercisesData as ExerciseData[];
      
      // Transform to database format with proper type casting
      const dbExercises = exercises.map((ex) => ({
        id: ex.id,
        category: ex.category as ExerciseCategory,
        type: ex.type as ExerciseType,
        difficulty: ex.difficulty as ExerciseDifficulty,
        duration: ex.duration as ExerciseDuration,
        title: ex.title,
        prompt: ex.prompt,
        options: ex.options || null,
        correct_option_index: ex.correctOptionIndex ?? null,
        explanation: ex.explanation || null,
        metrics_affected: ex.metricsAffected,
        weight: ex.weight,
      }));
      
      // Upsert exercises (insert or update on conflict)
      const { data, error } = await supabase
        .from("cognitive_exercises")
        .upsert(dbExercises, { 
          onConflict: "id",
          ignoreDuplicates: false 
        })
        .select();
      
      if (error) throw error;
      return data?.length || 0;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cognitive-exercises"] });
      queryClient.invalidateQueries({ queryKey: ["exercise-count"] });
    },
  });
}
