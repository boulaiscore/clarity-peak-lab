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
    PostgrestVersion: "14.1"
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
          walking_completed: boolean | null
          walking_distance_meters: number | null
          walking_minutes: number | null
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
          walking_completed?: boolean | null
          walking_distance_meters?: number | null
          walking_minutes?: number | null
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
          walking_completed?: boolean | null
          walking_distance_meters?: number | null
          walking_minutes?: number | null
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
      game_sessions: {
        Row: {
          completed_at: string
          created_at: string
          degradation_slope: number | null
          difficulty: string | null
          difficulty_override: boolean | null
          false_alarm_rate: number | null
          game_name: string | null
          game_type: string
          gym_area: string
          hit_rate: number | null
          id: string
          perseveration_rate: number | null
          post_switch_error_rate: number | null
          recovery_speed_index: number | null
          rt_variability: number | null
          score: number
          skill_routed: string
          switch_latency_avg: number | null
          system_type: string
          thinking_mode: string
          time_in_band_pct: number | null
          user_id: string
          xp_awarded: number
        }
        Insert: {
          completed_at?: string
          created_at?: string
          degradation_slope?: number | null
          difficulty?: string | null
          difficulty_override?: boolean | null
          false_alarm_rate?: number | null
          game_name?: string | null
          game_type: string
          gym_area: string
          hit_rate?: number | null
          id?: string
          perseveration_rate?: number | null
          post_switch_error_rate?: number | null
          recovery_speed_index?: number | null
          rt_variability?: number | null
          score?: number
          skill_routed: string
          switch_latency_avg?: number | null
          system_type: string
          thinking_mode: string
          time_in_band_pct?: number | null
          user_id: string
          xp_awarded?: number
        }
        Update: {
          completed_at?: string
          created_at?: string
          degradation_slope?: number | null
          difficulty?: string | null
          difficulty_override?: boolean | null
          false_alarm_rate?: number | null
          game_name?: string | null
          game_type?: string
          gym_area?: string
          hit_rate?: number | null
          id?: string
          perseveration_rate?: number | null
          post_switch_error_rate?: number | null
          recovery_speed_index?: number | null
          rt_variability?: number | null
          score?: number
          skill_routed?: string
          switch_latency_avg?: number | null
          system_type?: string
          thinking_mode?: string
          time_in_band_pct?: number | null
          user_id?: string
          xp_awarded?: number
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
          daily_recovery_target_minutes: number | null
          daily_sessions_count: number | null
          daily_time_commitment: string | null
          degree_discipline: string | null
          detox_reminder_enabled: boolean | null
          detox_reminder_time: string | null
          education_level: string | null
          gender: string | null
          id: string
          last_session_date: string | null
          monthly_report_credits: number
          monthly_report_reset_at: string | null
          name: string | null
          onboarding_completed: boolean | null
          primary_device: string | null
          reminder_enabled: boolean | null
          reminder_time: string | null
          report_credits: number
          rri_detox_hours: string | null
          rri_mental_state: string | null
          rri_set_at: string | null
          rri_sleep_hours: string | null
          rri_value: number | null
          session_duration: string | null
          subscription_status: string | null
          timezone: string | null
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
          daily_recovery_target_minutes?: number | null
          daily_sessions_count?: number | null
          daily_time_commitment?: string | null
          degree_discipline?: string | null
          detox_reminder_enabled?: boolean | null
          detox_reminder_time?: string | null
          education_level?: string | null
          gender?: string | null
          id?: string
          last_session_date?: string | null
          monthly_report_credits?: number
          monthly_report_reset_at?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          primary_device?: string | null
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          report_credits?: number
          rri_detox_hours?: string | null
          rri_mental_state?: string | null
          rri_set_at?: string | null
          rri_sleep_hours?: string | null
          rri_value?: number | null
          session_duration?: string | null
          subscription_status?: string | null
          timezone?: string | null
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
          daily_recovery_target_minutes?: number | null
          daily_sessions_count?: number | null
          daily_time_commitment?: string | null
          degree_discipline?: string | null
          detox_reminder_enabled?: boolean | null
          detox_reminder_time?: string | null
          education_level?: string | null
          gender?: string | null
          id?: string
          last_session_date?: string | null
          monthly_report_credits?: number
          monthly_report_reset_at?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          primary_device?: string | null
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          report_credits?: number
          rri_detox_hours?: string | null
          rri_mental_state?: string | null
          rri_set_at?: string | null
          rri_sleep_hours?: string | null
          rri_value?: number | null
          session_duration?: string | null
          subscription_status?: string | null
          timezone?: string | null
          training_goals?: string[] | null
          training_plan?: string | null
          updated_at?: string
          user_id?: string
          work_type?: string | null
        }
        Relationships: []
      }
      report_credit_purchases: {
        Row: {
          amount_cents: number
          created_at: string
          credits_amount: number
          currency: string
          id: string
          purchased_at: string
          status: string
          stripe_payment_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          credits_amount: number
          currency?: string
          id?: string
          purchased_at?: string
          status?: string
          stripe_payment_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          credits_amount?: number
          currency?: string
          id?: string
          purchased_at?: string
          status?: string
          stripe_payment_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      report_purchases: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          purchased_at: string
          status: string
          stripe_payment_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          purchased_at?: string
          status?: string
          stripe_payment_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          purchased_at?: string
          status?: string
          stripe_payment_id?: string | null
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
          baseline_cal_fast_thinking: number | null
          baseline_cal_focus: number | null
          baseline_cal_reasoning: number | null
          baseline_cal_slow_thinking: number | null
          baseline_captured_at: string | null
          baseline_cognitive_age: number | null
          baseline_creativity: number | null
          baseline_demo_fast_thinking: number | null
          baseline_demo_focus: number | null
          baseline_demo_reasoning: number | null
          baseline_demo_slow_thinking: number | null
          baseline_eff_fast_thinking: number | null
          baseline_eff_focus: number | null
          baseline_eff_reasoning: number | null
          baseline_eff_slow_thinking: number | null
          baseline_fast_thinking: number | null
          baseline_focus: number | null
          baseline_is_estimated: boolean | null
          baseline_reasoning: number | null
          baseline_slow_thinking: number | null
          bias_resistance: number
          calibration_status: string | null
          clarity_score: number
          cognitive_level: number | null
          cognitive_performance_score: number | null
          cognitive_readiness_score: number | null
          consecutive_low_rec_days: number | null
          consecutive_performance_drop_days: number | null
          created_at: string
          creativity: number
          critical_thinking_score: number
          decision_quality: number
          dual_process_decay_applied: number | null
          dual_process_decay_week_start: string | null
          experience_points: number | null
          fast_thinking: number
          focus_stability: number
          id: string
          last_ae_xp_at: string | null
          last_ct_xp_at: string | null
          last_decay_calculation_date: string | null
          last_in_xp_at: string | null
          last_low_rec_check_date: string | null
          last_ra_xp_at: string | null
          last_xp_at: string | null
          low_rec_streak_days: number | null
          performance_avg_window_start_date: string | null
          performance_avg_window_start_value: number | null
          philosophical_reasoning: number
          physio_component_score: number | null
          reaction_speed: number
          readiness_classification: string | null
          readiness_decay_applied: number | null
          readiness_decay_week_start: string | null
          reasoning_accuracy: number
          rec_snapshot_date: string | null
          rec_snapshot_value: number | null
          sci_decay_applied: number | null
          sci_decay_week_start: string | null
          slow_thinking: number
          spatial_reasoning: number
          tc_last_updated_at: string | null
          tc_previous_value: number | null
          total_sessions: number
          training_capacity: number | null
          updated_at: string
          user_id: string
          visual_processing: number
        }
        Insert: {
          baseline_cal_fast_thinking?: number | null
          baseline_cal_focus?: number | null
          baseline_cal_reasoning?: number | null
          baseline_cal_slow_thinking?: number | null
          baseline_captured_at?: string | null
          baseline_cognitive_age?: number | null
          baseline_creativity?: number | null
          baseline_demo_fast_thinking?: number | null
          baseline_demo_focus?: number | null
          baseline_demo_reasoning?: number | null
          baseline_demo_slow_thinking?: number | null
          baseline_eff_fast_thinking?: number | null
          baseline_eff_focus?: number | null
          baseline_eff_reasoning?: number | null
          baseline_eff_slow_thinking?: number | null
          baseline_fast_thinking?: number | null
          baseline_focus?: number | null
          baseline_is_estimated?: boolean | null
          baseline_reasoning?: number | null
          baseline_slow_thinking?: number | null
          bias_resistance?: number
          calibration_status?: string | null
          clarity_score?: number
          cognitive_level?: number | null
          cognitive_performance_score?: number | null
          cognitive_readiness_score?: number | null
          consecutive_low_rec_days?: number | null
          consecutive_performance_drop_days?: number | null
          created_at?: string
          creativity?: number
          critical_thinking_score?: number
          decision_quality?: number
          dual_process_decay_applied?: number | null
          dual_process_decay_week_start?: string | null
          experience_points?: number | null
          fast_thinking?: number
          focus_stability?: number
          id?: string
          last_ae_xp_at?: string | null
          last_ct_xp_at?: string | null
          last_decay_calculation_date?: string | null
          last_in_xp_at?: string | null
          last_low_rec_check_date?: string | null
          last_ra_xp_at?: string | null
          last_xp_at?: string | null
          low_rec_streak_days?: number | null
          performance_avg_window_start_date?: string | null
          performance_avg_window_start_value?: number | null
          philosophical_reasoning?: number
          physio_component_score?: number | null
          reaction_speed?: number
          readiness_classification?: string | null
          readiness_decay_applied?: number | null
          readiness_decay_week_start?: string | null
          reasoning_accuracy?: number
          rec_snapshot_date?: string | null
          rec_snapshot_value?: number | null
          sci_decay_applied?: number | null
          sci_decay_week_start?: string | null
          slow_thinking?: number
          spatial_reasoning?: number
          tc_last_updated_at?: string | null
          tc_previous_value?: number | null
          total_sessions?: number
          training_capacity?: number | null
          updated_at?: string
          user_id: string
          visual_processing?: number
        }
        Update: {
          baseline_cal_fast_thinking?: number | null
          baseline_cal_focus?: number | null
          baseline_cal_reasoning?: number | null
          baseline_cal_slow_thinking?: number | null
          baseline_captured_at?: string | null
          baseline_cognitive_age?: number | null
          baseline_creativity?: number | null
          baseline_demo_fast_thinking?: number | null
          baseline_demo_focus?: number | null
          baseline_demo_reasoning?: number | null
          baseline_demo_slow_thinking?: number | null
          baseline_eff_fast_thinking?: number | null
          baseline_eff_focus?: number | null
          baseline_eff_reasoning?: number | null
          baseline_eff_slow_thinking?: number | null
          baseline_fast_thinking?: number | null
          baseline_focus?: number | null
          baseline_is_estimated?: boolean | null
          baseline_reasoning?: number | null
          baseline_slow_thinking?: number | null
          bias_resistance?: number
          calibration_status?: string | null
          clarity_score?: number
          cognitive_level?: number | null
          cognitive_performance_score?: number | null
          cognitive_readiness_score?: number | null
          consecutive_low_rec_days?: number | null
          consecutive_performance_drop_days?: number | null
          created_at?: string
          creativity?: number
          critical_thinking_score?: number
          decision_quality?: number
          dual_process_decay_applied?: number | null
          dual_process_decay_week_start?: string | null
          experience_points?: number | null
          fast_thinking?: number
          focus_stability?: number
          id?: string
          last_ae_xp_at?: string | null
          last_ct_xp_at?: string | null
          last_decay_calculation_date?: string | null
          last_in_xp_at?: string | null
          last_low_rec_check_date?: string | null
          last_ra_xp_at?: string | null
          last_xp_at?: string | null
          low_rec_streak_days?: number | null
          performance_avg_window_start_date?: string | null
          performance_avg_window_start_value?: number | null
          philosophical_reasoning?: number
          physio_component_score?: number | null
          reaction_speed?: number
          readiness_classification?: string | null
          readiness_decay_applied?: number | null
          readiness_decay_week_start?: string | null
          reasoning_accuracy?: number
          rec_snapshot_date?: string | null
          rec_snapshot_value?: number | null
          sci_decay_applied?: number | null
          sci_decay_week_start?: string | null
          slow_thinking?: number
          spatial_reasoning?: number
          tc_last_updated_at?: string | null
          tc_previous_value?: number | null
          total_sessions?: number
          training_capacity?: number | null
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
      walking_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          detox_session_id: string | null
          distance_meters: number | null
          duration_minutes: number
          id: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          detox_session_id?: string | null
          distance_meters?: number | null
          duration_minutes?: number
          id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          detox_session_id?: string | null
          distance_meters?: number | null
          duration_minutes?: number
          id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "walking_sessions_detox_session_id_fkey"
            columns: ["detox_session_id"]
            isOneToOne: false
            referencedRelation: "detox_sessions"
            referencedColumns: ["id"]
          },
        ]
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
      admin_user_overview: {
        Row: {
          age: number | null
          cognitive_level: number | null
          created_at: string | null
          creativity: number | null
          degree_discipline: string | null
          education_level: string | null
          experience_points: number | null
          fast_thinking: number | null
          focus_stability: number | null
          gender: string | null
          name: string | null
          onboarding_completed: boolean | null
          reasoning_accuracy: number | null
          report_credits: number | null
          slow_thinking: number | null
          subscription_status: string | null
          total_exercises: number | null
          total_sessions: number | null
          training_capacity: number | null
          training_plan: string | null
          user_id: string | null
          work_type: string | null
        }
        Relationships: []
      }
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
