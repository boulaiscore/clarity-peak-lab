export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cognitive_exercises: {
        Row: {
          category: Database["public"]["Enums"]["exercise_category"]
          correct_option_index: number | null
          created_at: string
          difficulty: Database["public"]["Enums"]["exercise_difficulty"]
          duration: Database["public"]["Enums"]["exercise_duration"]
          explanation: string | null
          gym_area: string | null
          id: string
          metrics_affected: string[]
          options: string[] | null
          prompt: string
          thinking_mode: string | null
          title: string
          type: Database["public"]["Enums"]["exercise_type"]
          updated_at: string
          weight: number
        }
        Insert: {
          category: Database["public"]["Enums"]["exercise_category"]
          correct_option_index?: number | null
          created_at?: string
          difficulty: Database["public"]["Enums"]["exercise_difficulty"]
          duration: Database["public"]["Enums"]["exercise_duration"]
          explanation?: string | null
          gym_area?: string | null
          id: string
          metrics_affected?: string[]
          options?: string[] | null
          prompt: string
          thinking_mode?: string | null
          title: string
          type: Database["public"]["Enums"]["exercise_type"]
          updated_at?: string
          weight?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["exercise_category"]
          correct_option_index?: number | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["exercise_difficulty"]
          duration?: Database["public"]["Enums"]["exercise_duration"]
          explanation?: string | null
          gym_area?: string | null
          id?: string
          metrics_affected?: string[]
          options?: string[] | null
          prompt?: string
          thinking_mode?: string | null
          title?: string
          type?: Database["public"]["Enums"]["exercise_type"]
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      detox_completions: {
        Row: {
          completed_at: string
          created_at: string
          duration_minutes: number
          id: string
          user_id: string
          week_start: string
          xp_earned: number
        }
        Insert: {
          completed_at?: string
          created_at?: string
          duration_minutes: number
          id?: string
          user_id: string
          week_start?: string
          xp_earned: number
        }
        Update: {
          completed_at?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          user_id?: string
          week_start?: string
          xp_earned?: number
        }
        Relationships: []
      }
      detox_sessions: {
        Row: {
          blocked_apps: string[]
          created_at: string
          duration_minutes: number
          end_time: string
          id: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          blocked_apps?: string[]
          created_at?: string
          duration_minutes: number
          end_time: string
          id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          blocked_apps?: string[]
          created_at?: string
          duration_minutes?: number
          end_time?: string
          id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: []
      }
      exercise_completions: {
        Row: {
          completed_at: string
          created_at: string
          difficulty: string
          exercise_id: string
          gym_area: string
          id: string
          score: number | null
          thinking_mode: string | null
          user_id: string
          week_start: string
          xp_earned: number
        }
        Insert: {
          completed_at?: string
          created_at?: string
          difficulty: string
          exercise_id: string
          gym_area: string
          id?: string
          score?: number | null
          thinking_mode?: string | null
          user_id: string
          week_start?: string
          xp_earned: number
        }
        Update: {
          completed_at?: string
          created_at?: string
          difficulty?: string
          exercise_id?: string
          gym_area?: string
          id?: string
          score?: number | null
          thinking_mode?: string | null
          user_id?: string
          week_start?: string
          xp_earned?: number
        }
        Relationships: []
      }
      monthly_content_assignments: {
        Row: {
          completed_at: string | null
          content_id: string
          content_type: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_required: boolean
          month_start: string
          session_type: string | null
          status: string
          time_spent_minutes: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          content_id: string
          content_type: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_required?: boolean
          month_start: string
          session_type?: string | null
          status?: string
          time_spent_minutes?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          content_id?: string
          content_type?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_required?: boolean
          month_start?: string
          session_type?: string | null
          status?: string
          time_spent_minutes?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      neuro_gym_sessions: {
        Row: {
          area: string
          completed_at: string
          correct_answers: number
          created_at: string
          duration_option: string
          exercises_used: string[]
          id: string
          is_daily_training: boolean | null
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          area: string
          completed_at?: string
          correct_answers?: number
          created_at?: string
          duration_option: string
          exercises_used?: string[]
          id?: string
          is_daily_training?: boolean | null
          score?: number
          total_questions?: number
          user_id: string
        }
        Update: {
          area?: string
          completed_at?: string
          correct_answers?: number
          created_at?: string
          duration_option?: string
          exercises_used?: string[]
          id?: string
          is_daily_training?: boolean | null
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          birth_date: string | null
          created_at: string
          daily_detox_goal_minutes: number | null
          daily_sessions_count: number | null
          daily_time_commitment: string | null
          degree_discipline: string | null
          detox_reminder_enabled: boolean | null
          detox_reminder_time: string | null
          education_level: string | null
          gender: string | null
          id: string
          last_session_date: string | null
          name: string | null
          onboarding_completed: boolean | null
          reminder_enabled: boolean | null
          reminder_time: string | null
          session_duration: string | null
          subscription_status: string | null
          training_goals: string[] | null
          training_plan: string | null
          updated_at: string
          user_id: string
          work_type: string | null
        }
        Insert: {
          age?: number | null
          birth_date?: string | null
          created_at?: string
          daily_detox_goal_minutes?: number | null
          daily_sessions_count?: number | null
          daily_time_commitment?: string | null
          degree_discipline?: string | null
          detox_reminder_enabled?: boolean | null
          detox_reminder_time?: string | null
          education_level?: string | null
          gender?: string | null
          id?: string
          last_session_date?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          session_duration?: string | null
          subscription_status?: string | null
          training_goals?: string[] | null
          training_plan?: string | null
          updated_at?: string
          user_id: string
          work_type?: string | null
        }
        Update: {
          age?: number | null
          birth_date?: string | null
          created_at?: string
          daily_detox_goal_minutes?: number | null
          daily_sessions_count?: number | null
          daily_time_commitment?: string | null
          degree_discipline?: string | null
          detox_reminder_enabled?: boolean | null
          detox_reminder_time?: string | null
          education_level?: string | null
          gender?: string | null
          id?: string
          last_session_date?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          session_duration?: string | null
          subscription_status?: string | null
          training_goals?: string[] | null
          training_plan?: string | null
          updated_at?: string
          user_id?: string
          work_type?: string | null
        }
        Relationships: []
      }
      training_sessions: {
        Row: {
          completed_at: string
          correct_answers: number
          created_at: string
          duration_option: Database["public"]["Enums"]["exercise_duration"]
          exercises_used: string[]
          id: string
          score: number
          total_questions: number
          training_mode: Database["public"]["Enums"]["exercise_category"]
          user_id: string
        }
        Insert: {
          completed_at?: string
          correct_answers?: number
          created_at?: string
          duration_option: Database["public"]["Enums"]["exercise_duration"]
          exercises_used?: string[]
          id?: string
          score?: number
          total_questions?: number
          training_mode: Database["public"]["Enums"]["exercise_category"]
          user_id: string
        }
        Update: {
          completed_at?: string
          correct_answers?: number
          created_at?: string
          duration_option?: Database["public"]["Enums"]["exercise_duration"]
          exercises_used?: string[]
          id?: string
          score?: number
          total_questions?: number
          training_mode?: Database["public"]["Enums"]["exercise_category"]
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_category: string
          badge_description: string | null
          badge_id: string
          badge_name: string
          created_at: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_category: string
          badge_description?: string | null
          badge_id: string
          badge_name: string
          created_at?: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_category?: string
          badge_description?: string | null
          badge_id?: string
          badge_name?: string
          created_at?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_cognitive_metrics: {
        Row: {
          baseline_captured_at: string | null
          baseline_cognitive_age: number | null
          baseline_creativity: number | null
          baseline_fast_thinking: number | null
          baseline_focus: number | null
          baseline_reasoning: number | null
          baseline_slow_thinking: number | null
          bias_resistance: number
          clarity_score: number
          cognitive_level: number | null
          cognitive_performance_score: number | null
          cognitive_readiness_score: number | null
          created_at: string
          creativity: number
          critical_thinking_score: number
          decision_quality: number
          experience_points: number | null
          fast_thinking: number
          focus_stability: number
          id: string
          philosophical_reasoning: number
          physio_component_score: number | null
          reaction_speed: number
          readiness_classification: string | null
          reasoning_accuracy: number
          slow_thinking: number
          spatial_reasoning: number
          total_sessions: number
          updated_at: string
          user_id: string
          visual_processing: number
        }
        Insert: {
          baseline_captured_at?: string | null
          baseline_cognitive_age?: number | null
          baseline_creativity?: number | null
          baseline_fast_thinking?: number | null
          baseline_focus?: number | null
          baseline_reasoning?: number | null
          baseline_slow_thinking?: number | null
          bias_resistance?: number
          clarity_score?: number
          cognitive_level?: number | null
          cognitive_performance_score?: number | null
          cognitive_readiness_score?: number | null
          created_at?: string
          creativity?: number
          critical_thinking_score?: number
          decision_quality?: number
          experience_points?: number | null
          fast_thinking?: number
          focus_stability?: number
          id?: string
          philosophical_reasoning?: number
          physio_component_score?: number | null
          reaction_speed?: number
          readiness_classification?: string | null
          reasoning_accuracy?: number
          slow_thinking?: number
          spatial_reasoning?: number
          total_sessions?: number
          updated_at?: string
          user_id: string
          visual_processing?: number
        }
        Update: {
          baseline_captured_at?: string | null
          baseline_cognitive_age?: number | null
          baseline_creativity?: number | null
          baseline_fast_thinking?: number | null
          baseline_focus?: number | null
          baseline_reasoning?: number | null
          baseline_slow_thinking?: number | null
          bias_resistance?: number
          clarity_score?: number
          cognitive_level?: number | null
          cognitive_performance_score?: number | null
          cognitive_readiness_score?: number | null
          created_at?: string
          creativity?: number
          critical_thinking_score?: number
          decision_quality?: number
          experience_points?: number | null
          fast_thinking?: number
          focus_stability?: number
          id?: string
          philosophical_reasoning?: number
          physio_component_score?: number | null
          reaction_speed?: number
          readiness_classification?: string | null
          reasoning_accuracy?: number
          slow_thinking?: number
          spatial_reasoning?: number
          total_sessions?: number
          updated_at?: string
          user_id?: string
          visual_processing?: number
        }
        Relationships: []
      }
      user_listened_podcasts: {
        Row: {
          created_at: string
          id: string
          listened_at: string
          podcast_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listened_at?: string
          podcast_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listened_at?: string
          podcast_id?: string
          user_id?: string
        }
        Relationships: []
      }
      wearable_snapshots: {
        Row: {
          activity_score: number | null
          created_at: string
          date: string
          hrv_ms: number | null
          id: string
          raw_json: Json | null
          resting_hr: number | null
          sleep_duration_min: number | null
          sleep_efficiency: number | null
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_score?: number | null
          created_at?: string
          date: string
          hrv_ms?: number | null
          id?: string
          raw_json?: Json | null
          resting_hr?: number | null
          sleep_duration_min?: number | null
          sleep_efficiency?: number | null
          source: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_score?: number | null
          created_at?: string
          date?: string
          hrv_ms?: number | null
          id?: string
          raw_json?: Json | null
          resting_hr?: number | null
          sleep_duration_min?: number | null
          sleep_efficiency?: number | null
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_training_progress: {
        Row: {
          created_at: string
          id: string
          plan_id: string
          sessions_completed: Json
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_id?: string
          sessions_completed?: Json
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_id?: string
          sessions_completed?: Json
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      exercise_category:
        | "reasoning"
        | "clarity"
        | "decision"
        | "fast"
        | "slow"
        | "bias"
        | "logic_puzzle"
        | "creative"
        | "attention"
        | "working_memory"
        | "inhibition"
        | "cognitive_control"
        | "executive_control"
        | "insight"
        | "reflection"
        | "philosophical"
        | "visual"
        | "spatial"
        | "game"
        | "visual_memory"
      exercise_difficulty: "easy" | "medium" | "hard"
      exercise_duration:
        | "30s"
        | "2min"
        | "5min"
        | "3min"
        | "7min"
        | "90s"
        | "1min"
      exercise_type:
        | "multiple_choice"
        | "detect_fallacy"
        | "open_reflection"
        | "logic_puzzle"
        | "scenario_choice"
        | "probability_estimation"
        | "visual_drill"
        | "visual_task"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      exercise_category: [
        "reasoning",
        "clarity",
        "decision",
        "fast",
        "slow",
        "bias",
        "logic_puzzle",
        "creative",
        "attention",
        "working_memory",
        "inhibition",
        "cognitive_control",
        "executive_control",
        "insight",
        "reflection",
        "philosophical",
        "visual",
        "spatial",
        "game",
        "visual_memory",
      ],
      exercise_difficulty: ["easy", "medium", "hard"],
      exercise_duration: ["30s", "2min", "5min", "3min", "7min", "90s", "1min"],
      exercise_type: [
        "multiple_choice",
        "detect_fallacy",
        "open_reflection",
        "logic_puzzle",
        "scenario_choice",
        "probability_estimation",
        "visual_drill",
        "visual_task",
      ],
    },
  },
} as const
