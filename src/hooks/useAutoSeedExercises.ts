import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Track if seeding check has already been attempted this session
let seedingChecked = false;

/**
 * Auto-seed exercises hook - now only checks if exercises exist.
 * Actual seeding must be done by admins via the seed-exercises edge function.
 * This is a security improvement to prevent public write access to exercises.
 */
export function useAutoSeedExercises() {
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent double execution from StrictMode or HMR
    if (hasRun.current || seedingChecked) return;
    hasRun.current = true;
    seedingChecked = true;

    async function checkExercises() {
      try {
        // Check if exercises table is populated
        const { count, error: countError } = await supabase
          .from("cognitive_exercises")
          .select("*", { count: "exact", head: true });

        if (countError) {
          console.error("Error checking exercises count:", countError);
          return;
        }

        if (count && count > 0) {
          console.log(`Exercises loaded: ${count} exercises available`);
        } else {
          console.warn(
            "No exercises found in database. An admin needs to seed exercises via the seed-exercises edge function."
          );
        }
      } catch (err) {
        console.error("Exercise check error:", err);
      }
    }

    checkExercises();
  }, []);
}
