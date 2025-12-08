import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { newNeuroExercises } from "@/data/neuro_exercises";

export function useSeedNeuroExercises() {
  const seedNeuroExercises = useCallback(async () => {
    try {
      // Check which exercises already exist
      const { data: existingExercises, error: fetchError } = await supabase
        .from("cognitive_exercises")
        .select("id")
        .in("id", newNeuroExercises.map(e => e.id));
      
      if (fetchError) {
        console.error("Error fetching existing exercises:", fetchError);
        return { success: false, inserted: 0 };
      }
      
      const existingIds = new Set(existingExercises?.map(e => e.id) || []);
      
      // Filter out exercises that already exist
      const exercisesToInsert = newNeuroExercises.filter(e => !existingIds.has(e.id));
      
      if (exercisesToInsert.length === 0) {
        console.log("All neuro exercises already exist in database");
        return { success: true, inserted: 0 };
      }
      
      // Insert new exercises
      const { error: insertError } = await supabase
        .from("cognitive_exercises")
        .insert(exercisesToInsert);
      
      if (insertError) {
        console.error("Error inserting neuro exercises:", insertError);
        return { success: false, inserted: 0 };
      }
      
      console.log(`Successfully inserted ${exercisesToInsert.length} neuro exercises`);
      return { success: true, inserted: exercisesToInsert.length };
    } catch (error) {
      console.error("Error seeding neuro exercises:", error);
      return { success: false, inserted: 0 };
    }
  }, []);
  
  return { seedNeuroExercises };
}
