import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type TrainingGoal = "fast_thinking" | "slow_thinking";
export type SessionDuration = "30s" | "2min" | "5min" | "7min";
export type DailyTimeCommitment = "3min" | "10min" | "30min";
export type Gender = "male" | "female" | "other" | "prefer_not_to_say";
export type WorkType = "knowledge" | "creative" | "technical" | "management" | "student" | "other";

export interface User {
  id: string;
  name: string;
  email: string;
  subscriptionStatus: "free" | "premium";
  createdAt: Date;
  
  // Personal data
  age?: number;
  gender?: Gender;
  workType?: WorkType;
  
  // Training preferences
  trainingGoals?: TrainingGoal[];
  sessionDuration?: SessionDuration;
  dailyTimeCommitment?: DailyTimeCommitment;
  
  // Legacy fields
  goal?: "stress" | "clarity" | "performance" | "decisions";
  timePreference?: "30s" | "2min" | "5min";
  
  // Onboarding completed
  onboardingCompleted?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  upgradeToPremium: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user storage (will be replaced with Supabase)
const STORAGE_KEY = "neuroloop_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser({ ...parsed, createdAt: new Date(parsed.createdAt) });
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Mock login - will be replaced with Supabase
    await new Promise((r) => setTimeout(r, 500));
    
    if (!email || !password) {
      return { success: false, error: "Please enter email and password" };
    }

    const mockUser: User = {
      id: crypto.randomUUID(),
      name: email.split("@")[0],
      email,
      subscriptionStatus: "free",
      createdAt: new Date(),
    };

    setUser(mockUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
    return { success: true };
  };

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise((r) => setTimeout(r, 500));

    if (!name || !email || !password) {
      return { success: false, error: "Please fill in all fields" };
    }

    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
    }

    const mockUser: User = {
      id: crypto.randomUUID(),
      name,
      email,
      subscriptionStatus: "free",
      createdAt: new Date(),
    };

    setUser(mockUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...updates };
      setUser(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  };

  const upgradeToPremium = () => {
    updateUser({ subscriptionStatus: "premium" });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateUser, upgradeToPremium }}>
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
