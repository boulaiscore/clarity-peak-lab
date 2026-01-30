import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { sendWelcomeEmail } from "@/lib/emailService";
import { getAuthRedirectUrl } from "@/lib/platformUtils";
import { TrainingPlanId } from "@/lib/trainingPlans";
import { calculateRRI, initializeRecoveryBaseline } from "@/lib/recoveryV2";

export type TrainingGoal = "fast_thinking" | "slow_thinking";
export type SessionDuration = "30s" | "2min" | "5min" | "7min";
export type DailyTimeCommitment = "3min" | "7min" | "10min";
export type Gender = "male" | "female" | "other" | "prefer_not_to_say";
export type WorkType = "knowledge" | "creative" | "technical" | "management" | "student" | "other";
export type EducationLevel = "high_school" | "bachelor" | "master" | "phd" | "other";
export type DegreeDiscipline = "stem" | "humanities" | "business" | "health" | "arts" | "social_sciences" | "law" | "other";

// RRI (Recovery Readiness Init) types
export type RRISleepHours = '<5h' | '5-6h' | '6-7h' | '7-8h' | '>8h';
export type RRIDetoxHours = 'almost_none' | '<30min' | '30-60min' | '1-2h' | '>2h';
export type RRIMentalState = 'very_tired' | 'bit_tired' | 'ok' | 'clear' | 'very_clear';

export type PrimaryDevice = "apple_health" | "whoop" | "oura" | "garmin" | "other";

export interface UserProfile {
  id: string;
  user_id: string;
  name: string | null;
  age: number | null;
  birth_date: string | null;
  gender: Gender | null;
  work_type: WorkType | null;
  education_level: EducationLevel | null;
  degree_discipline: DegreeDiscipline | null;
  training_goals: TrainingGoal[];
  session_duration: SessionDuration;
  daily_time_commitment: DailyTimeCommitment;
  training_plan: TrainingPlanId;
  subscription_status: "free" | "premium" | "pro";
  onboarding_completed: boolean;
  reminder_enabled: boolean | null;
  reminder_time: string | null;
  primary_device: PrimaryDevice | null;
  // RRI fields
  rri_sleep_hours: RRISleepHours | null;
  rri_detox_hours: RRIDetoxHours | null;
  rri_mental_state: RRIMentalState | null;
  rri_value: number | null;
  rri_set_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  subscriptionStatus: "free" | "premium" | "pro";
  createdAt: Date;
  
  // Personal data
  age?: number;
  birthDate?: string;
  gender?: Gender;
  workType?: WorkType;
  educationLevel?: EducationLevel;
  degreeDiscipline?: DegreeDiscipline;
  
  // Training preferences
  trainingGoals?: TrainingGoal[];
  sessionDuration?: SessionDuration;
  dailyTimeCommitment?: DailyTimeCommitment;
  trainingPlan?: TrainingPlanId;
  
  // Reminder settings
  reminderEnabled?: boolean;
  reminderTime?: string;
  
  // Health device
  primaryDevice?: PrimaryDevice;
  
  // RRI (Recovery Readiness Init) - onboarding answers
  rriSleepHours?: RRISleepHours;
  rriDetoxHours?: RRIDetoxHours;
  rriMentalState?: RRIMentalState;
  rriValue?: number;
  rriSetAt?: string;
  
  // Onboarding completed
  onboardingCompleted?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  upgradeToPremium: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapProfileToUser(supabaseUser: SupabaseUser, profile: UserProfile | null): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    name: profile?.name || supabaseUser.email?.split("@")[0] || null,
    subscriptionStatus: (profile?.subscription_status as "free" | "premium" | "pro") || "free",
    createdAt: new Date(supabaseUser.created_at),
    age: profile?.age || undefined,
    birthDate: profile?.birth_date || undefined,
    gender: profile?.gender || undefined,
    workType: profile?.work_type || undefined,
    educationLevel: profile?.education_level || undefined,
    degreeDiscipline: profile?.degree_discipline || undefined,
    trainingGoals: profile?.training_goals || [],
    sessionDuration: profile?.session_duration || "2min",
    dailyTimeCommitment: profile?.daily_time_commitment || "10min",
    trainingPlan: (profile?.training_plan as TrainingPlanId) || "light",
    reminderEnabled: profile?.reminder_enabled ?? false,
    reminderTime: profile?.reminder_time || undefined,
    primaryDevice: profile?.primary_device || undefined,
    rriSleepHours: profile?.rri_sleep_hours || undefined,
    rriDetoxHours: profile?.rri_detox_hours || undefined,
    rriMentalState: profile?.rri_mental_state || undefined,
    rriValue: profile?.rri_value || undefined,
    rriSetAt: profile?.rri_set_at || undefined,
    onboardingCompleted: profile?.onboarding_completed || false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Ensure new users never show Recovery=0 because `user_cognitive_metrics` row is missing.
  // Runs after profile fetch; fire-and-forget.
  const ensureRecoveryBaseline = async (userId: string, profile: UserProfile | null) => {
    try {
      const { data: existing, error: readErr } = await supabase
        .from("user_cognitive_metrics")
        .select("has_recovery_baseline")
        .eq("user_id", userId)
        .maybeSingle();

      if (readErr) {
        console.warn("[Auth] ensureRecoveryBaseline read error:", readErr);
        return;
      }

      // Already initialized
      if (existing?.has_recovery_baseline) return;

      // Compute RRI from profile if present; otherwise fallback handled by initializeRecoveryBaseline
      let rriValue: number | null = null;
      if (profile) {
        if (typeof profile.rri_value === "number") {
          rriValue = profile.rri_value;
        } else if (profile.rri_sleep_hours || profile.rri_detox_hours || profile.rri_mental_state) {
          rriValue = calculateRRI(
            profile.rri_sleep_hours,
            profile.rri_detox_hours,
            profile.rri_mental_state
          );
        }
      }

      const baseline = initializeRecoveryBaseline(rriValue);

      // If row exists but not initialized -> UPDATE; if row missing -> INSERT.
      if (existing) {
        const { error: updErr } = await supabase
          .from("user_cognitive_metrics")
          .update({
            rec_value: baseline.newRecValue,
            rec_last_ts: baseline.newRecLastTs,
            has_recovery_baseline: true,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (updErr) {
          console.warn("[Auth] ensureRecoveryBaseline update error:", updErr);
          return;
        }
      } else {
        const { error: insErr } = await supabase.from("user_cognitive_metrics").insert({
          user_id: userId,
          rec_value: baseline.newRecValue,
          rec_last_ts: baseline.newRecLastTs,
          has_recovery_baseline: true,
          updated_at: new Date().toISOString(),
        });

        if (insErr) {
          console.warn("[Auth] ensureRecoveryBaseline insert error:", insErr);
          return;
        }
      }

      console.log("[Auth] Recovery baseline initialized:", baseline.newRecValue);
    } catch (e) {
      console.warn("[Auth] ensureRecoveryBaseline exception:", e);
    }
  };

  // Fetch user profile from database with retry
  const fetchProfile = async (userId: string, retries = 3): Promise<UserProfile | null> => {
    for (let i = 0; i < retries; i++) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        
        if (error) {
          console.error(`Error fetching profile (attempt ${i + 1}):`, error.message, error.code, error.details);
          if (i < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
          return null;
        }
        return data as UserProfile | null;
      } catch (err) {
        const e = err as Error;
        console.error(`Network error fetching profile (attempt ${i + 1}):`, e.message);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    let isMounted = true;
    let initialLoadDone = false;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!isMounted) return;
        
        setSession(newSession);
        
        if (newSession?.user) {
          // Skip if initial load already handled this
          if (initialLoadDone && event === 'INITIAL_SESSION') return;
          
          // Defer profile fetch to avoid deadlock
          setTimeout(async () => {
            if (!isMounted) return;
            const profile = await fetchProfile(newSession.user.id);
            if (!isMounted) return;
            setUser(mapProfileToUser(newSession.user, profile));
            setProfileLoaded(true);

              // Defer to avoid doing more Supabase calls inside auth callback turn.
              setTimeout(() => {
                ensureRecoveryBaseline(newSession.user.id, profile);
              }, 0);

            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setProfileLoaded(false);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (!isMounted) return;
      initialLoadDone = true;
      
      setSession(existingSession);
      
      if (existingSession?.user) {
        const profile = await fetchProfile(existingSession.user.id);
        if (!isMounted) return;
        setUser(mapProfileToUser(existingSession.user, profile));
        setProfileLoaded(true);

        // Fire-and-forget baseline bootstrap for Recovery.
        setTimeout(() => {
          ensureRecoveryBaseline(existingSession.user.id, profile);
        }, 0);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!email || !password) {
      return { success: false, error: "Please enter email and password" };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!name || !email || !password) {
      return { success: false, error: "Please fill in all fields" };
    }

    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
    }

    const redirectUrl = getAuthRedirectUrl();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Send welcome email (fire and forget, don't block signup)
    sendWelcomeEmail(email, name).catch((err) => {
      console.error("Failed to send welcome email:", err);
    });

    return { success: true };
  };

  const logout = async () => {
    // Import from dedicated file to avoid circular dependency
    const { queryClient } = await import("@/lib/queryClient");
    
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    
    // CRITICAL: Clear all cached queries so the next login starts fresh
    queryClient.clear();
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user || !session) return;

    // Map User updates to profile column names
    const profileUpdates: Record<string, unknown> = {};
    
    if (updates.name !== undefined) profileUpdates.name = updates.name;
    if (updates.age !== undefined) profileUpdates.age = updates.age;
    if (updates.birthDate !== undefined) profileUpdates.birth_date = updates.birthDate;
    if (updates.gender !== undefined) profileUpdates.gender = updates.gender;
    if (updates.workType !== undefined) profileUpdates.work_type = updates.workType;
    if (updates.educationLevel !== undefined) profileUpdates.education_level = updates.educationLevel;
    if (updates.degreeDiscipline !== undefined) profileUpdates.degree_discipline = updates.degreeDiscipline;
    if (updates.trainingGoals !== undefined) profileUpdates.training_goals = updates.trainingGoals;
    if (updates.sessionDuration !== undefined) profileUpdates.session_duration = updates.sessionDuration;
    if (updates.dailyTimeCommitment !== undefined) profileUpdates.daily_time_commitment = updates.dailyTimeCommitment;
    if (updates.trainingPlan !== undefined) profileUpdates.training_plan = updates.trainingPlan;
    if (updates.subscriptionStatus !== undefined) profileUpdates.subscription_status = updates.subscriptionStatus;
    if (updates.reminderEnabled !== undefined) profileUpdates.reminder_enabled = updates.reminderEnabled;
    if (updates.reminderTime !== undefined) profileUpdates.reminder_time = updates.reminderTime;
    if (updates.primaryDevice !== undefined) profileUpdates.primary_device = updates.primaryDevice;
    if (updates.onboardingCompleted !== undefined) profileUpdates.onboarding_completed = updates.onboardingCompleted;
    // RRI fields
    if (updates.rriSleepHours !== undefined) profileUpdates.rri_sleep_hours = updates.rriSleepHours;
    if (updates.rriDetoxHours !== undefined) profileUpdates.rri_detox_hours = updates.rriDetoxHours;
    if (updates.rriMentalState !== undefined) profileUpdates.rri_mental_state = updates.rriMentalState;
    if (updates.rriValue !== undefined) profileUpdates.rri_value = updates.rriValue;
    if (updates.rriSetAt !== undefined) profileUpdates.rri_set_at = updates.rriSetAt;

    // Use upsert to create profile if missing (e.g., if trigger didn't fire)
    const { error } = await supabase
      .from("profiles")
      .upsert(
        { user_id: user.id, ...profileUpdates },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Error updating profile:", error.message, error.code, error.details);
      return;
    }

    // Update local state
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  const upgradeToPremium = async () => {
    await updateUser({ subscriptionStatus: "premium" });
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, login, signup, logout, updateUser, upgradeToPremium }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
