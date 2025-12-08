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
          id: string
          metrics_affected: string[]
          options: string[] | null
          prompt: string
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
          id: string
          metrics_affected?: string[]
          options?: string[] | null
          prompt: string
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
          id?: string
          metrics_affected?: string[]
          options?: string[] | null
          prompt?: string
          title?: string
          type?: Database["public"]["Enums"]["exercise_type"]
          updated_at?: string
          weight?: number
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
          score?: number
          total_questions?: number
          user_id?: string
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
      user_cognitive_metrics: {
        Row: {
          bias_resistance: number
          clarity_score: number
          created_at: string
          creativity: number
          critical_thinking_score: number
          decision_quality: number
          fast_thinking: number
          id: string
          philosophical_reasoning: number
          reasoning_accuracy: number
          slow_thinking: number
          total_sessions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bias_resistance?: number
          clarity_score?: number
          created_at?: string
          creativity?: number
          critical_thinking_score?: number
          decision_quality?: number
          fast_thinking?: number
          id?: string
          philosophical_reasoning?: number
          reasoning_accuracy?: number
          slow_thinking?: number
          total_sessions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bias_resistance?: number
          clarity_score?: number
          created_at?: string
          creativity?: number
          critical_thinking_score?: number
          decision_quality?: number
          fast_thinking?: number
          id?: string
          philosophical_reasoning?: number
          reasoning_accuracy?: number
          slow_thinking?: number
          total_sessions?: number
          updated_at?: string
          user_id?: string
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
      exercise_difficulty: "easy" | "medium" | "hard"
      exercise_duration: "30s" | "2min" | "5min" | "3min" | "7min"
      exercise_type:
        | "multiple_choice"
        | "detect_fallacy"
        | "open_reflection"
        | "logic_puzzle"
        | "scenario_choice"
        | "probability_estimation"
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
      ],
      exercise_difficulty: ["easy", "medium", "hard"],
      exercise_duration: ["30s", "2min", "5min", "3min", "7min"],
      exercise_type: [
        "multiple_choice",
        "detect_fallacy",
        "open_reflection",
        "logic_puzzle",
        "scenario_choice",
        "probability_estimation",
      ],
    },
  },
} as const
