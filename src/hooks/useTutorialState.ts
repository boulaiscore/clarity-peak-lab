import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const TUTORIAL_SEEN_KEY = "looma-tutorial-seen";

function getTutorialSeenKey(userId: string): string {
  return `${TUTORIAL_SEEN_KEY}:${userId}`;
}

export function useTutorialState() {
  const { user } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if tutorial should be shown
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    // Only show tutorial if:
    // 1. User has completed onboarding
    // 2. User hasn't seen the tutorial yet
    const hasCompletedOnboarding = user.onboardingCompleted;
    const hasSeen = localStorage.getItem(getTutorialSeenKey(user.id)) === "true";

    if (hasCompletedOnboarding && !hasSeen) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        setShowTutorial(true);
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }

    setIsLoading(false);
  }, [user?.id, user?.onboardingCompleted]);

  const markTutorialComplete = useCallback(() => {
    if (user?.id) {
      localStorage.setItem(getTutorialSeenKey(user.id), "true");
    }
    setShowTutorial(false);
  }, [user?.id]);

  const resetTutorial = useCallback(() => {
    if (user?.id) {
      localStorage.removeItem(getTutorialSeenKey(user.id));
    }
  }, [user?.id]);

  const openTutorial = useCallback(() => {
    setShowTutorial(true);
  }, []);

  return {
    showTutorial,
    isLoading,
    markTutorialComplete,
    resetTutorial,
    openTutorial,
  };
}
