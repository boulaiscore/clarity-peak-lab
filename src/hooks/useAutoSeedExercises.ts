import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import exercisesData from "@/data/cognitive_exercises.json";

// Convert camelCase JSON keys to snake_case DB columns
function transformExercise(ex: any) {
  return {
    id: ex.id,
    category: ex.category,
    type: ex.type,
    difficulty: ex.difficulty,
    duration: ex.duration,
    title: ex.title,
    prompt: ex.prompt,
    options: ex.options || null,
    correct_option_index: ex.correctOptionIndex ?? null,
    explanation: ex.explanation || null,
    metrics_affected: ex.metricsAffected || [],
    weight: ex.weight || 1,
    gym_area: ex.gymArea || null,
    thinking_mode: ex.thinkingMode || null,
  };
}

// Track if seeding has already been attempted this session
let seedingAttempted = false;

export function useAutoSeedExercises() {
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent double execution from StrictMode or HMR
    if (hasRun.current || seedingAttempted) return;
    hasRun.current = true;
    seedingAttempted = true;

    async function checkAndSeed() {
      try {
        // Check if exercises table is empty
        const { count, error: countError } = await supabase
          .from("cognitive_exercises")
          .select("*", { count: "exact", head: true });

        if (countError) {
          console.error("Error checking exercises count:", countError);
          return;
        }

        // If already populated, skip seeding
        if (count && count > 0) {
          console.log(`Exercises already seeded: ${count} exercises found`);
          return;
        }

        console.log("Seeding cognitive exercises...");

        // Transform and insert in batches
        const exercises = exercisesData.map(transformExercise);
        const batchSize = 50;
        let successCount = 0;

        for (let i = 0; i < exercises.length; i += batchSize) {
          const batch = exercises.slice(i, i + batchSize);
          const { error: insertError } = await supabase
            .from("cognitive_exercises")
            .upsert(batch, { onConflict: "id" });

          if (insertError) {
            console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
          } else {
            successCount += batch.length;
          }
        }

        console.log(`Seeded ${successCount} exercises successfully`);
      } catch (err) {
        console.error("Seed error:", err);
      }
    }

    checkAndSeed();
  }, []);
}
