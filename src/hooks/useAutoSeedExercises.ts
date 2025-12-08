import { useEffect, useRef } from "react";
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

// Hook that auto-seeds exercises on mount if database is empty
export function useAutoSeedExercises() {
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkAndSeed = async () => {
      try {

        // Check if exercises already exist
        const { count, error: countError } = await supabase
          .from("cognitive_exercises")
          .select("*", { count: "exact", head: true });

        if (countError) {
          console.error("Error checking exercises:", countError);
          return;
        }

        // If exercises already exist, skip seeding
        if (count && count > 0) {
          console.log(`Exercise library already loaded: ${count} exercises`);
          return;
        }

        // Seed the exercises
        console.log("Seeding exercise library...");
        const exercises = cognitiveExercisesData as ExerciseData[];

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

        const { error } = await supabase
          .from("cognitive_exercises")
          .upsert(dbExercises, { onConflict: "id" });

        if (error) {
          console.error("Error seeding exercises:", error);
        } else {
          console.log(`Successfully seeded ${exercises.length} exercises`);
        }
      } catch (err) {
        console.error("Auto-seed error:", err);
      }
    };

    checkAndSeed();
  }, []);
}
