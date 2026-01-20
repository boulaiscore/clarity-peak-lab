/**
 * ============================================
 * ANTI-REPETITION HOOKS
 * ============================================
 * 
 * React hooks for anti-repetition functionality.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchRecentCombos,
  recordComboHash,
  generateValidSession,
  generateComboHash,
  isComboValid,
  getSystemTypeFromGameType,
  type ComboHashParams,
  type RecentCombo,
  type SessionGeneratorResult,
} from "@/lib/antiRepetitionEngine";

// ────────────────────────────────────────────────────────────
// HOOKS
// ────────────────────────────────────────────────────────────

/**
 * Hook to fetch recent combo hashes for a specific game.
 */
export function useRecentCombos(gameName: string) {
  const { user } = useAuth();
  const [recentCombos, setRecentCombos] = useState<RecentCombo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.id || !gameName) {
      setIsLoading(false);
      return;
    }

    const loadCombos = async () => {
      try {
        setIsLoading(true);
        const combos = await fetchRecentCombos(user.id, gameName);
        setRecentCombos(combos);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch combos"));
        setRecentCombos([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCombos();
  }, [user?.id, gameName]);

  return { recentCombos, isLoading, error };
}

/**
 * Hook to record a completed session's combo hash.
 */
export function useRecordCombo() {
  const { user } = useAuth();

  const recordCombo = useCallback(
    async (
      gameName: string,
      comboHash: string,
      difficulty: string,
      options?: {
        qualityScore?: number;
        bonusApplied?: boolean;
        nearDuplicateRejected?: number;
        fallbackUsed?: boolean;
      }
    ): Promise<boolean> => {
      if (!user?.id) {
        console.warn("[AntiRepetition] Cannot record combo: no user");
        return false;
      }

      try {
        await recordComboHash(
          user.id,
          gameName,
          comboHash,
          difficulty,
          options?.qualityScore,
          options?.bonusApplied,
          options?.nearDuplicateRejected,
          options?.fallbackUsed
        );
        return true;
      } catch (err) {
        console.error("[AntiRepetition] Failed to record combo:", err);
        return false;
      }
    },
    [user?.id]
  );

  return recordCombo;
}

/**
 * Hook for generating a valid session with anti-repetition.
 * Returns the session along with metadata about the generation process.
 */
export function useValidSessionGenerator<T>(
  gameName: string,
  gameType: string,
  generator: () => T,
  getHashParams: (session: T) => ComboHashParams,
  enabled: boolean = true
) {
  const { user } = useAuth();
  const [result, setResult] = useState<SessionGeneratorResult<T> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const systemType = useMemo(() => getSystemTypeFromGameType(gameType), [gameType]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    if (!user?.id) {
      // No user, just generate without anti-repetition
      const session = generator();
      const params = getHashParams(session);
      const hash = generateComboHash(params);
      
      setResult({
        session,
        fallbackUsed: false,
        duplicatesRejected: 0,
        comboHash: hash,
      });
      setIsLoading(false);
      return;
    }

    const generateSession = async () => {
      try {
        setIsLoading(true);
        const sessionResult = await generateValidSession(
          user.id,
          gameName,
          systemType,
          generator,
          getHashParams
        );
        setResult(sessionResult);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to generate session"));
        // Fallback: generate anyway without anti-repetition
        const fallbackSession = generator();
        const params = getHashParams(fallbackSession);
        const hash = generateComboHash(params);
        
        setResult({
          session: fallbackSession,
          fallbackUsed: true,
          duplicatesRejected: 0,
          comboHash: hash,
        });
      } finally {
        setIsLoading(false);
      }
    };

    generateSession();
  }, [user?.id, gameName, gameType, systemType, enabled]); // Note: generator and getHashParams intentionally excluded

  const regenerate = useCallback(async () => {
    if (!user?.id) {
      const session = generator();
      const params = getHashParams(session);
      const hash = generateComboHash(params);
      
      setResult({
        session,
        fallbackUsed: false,
        duplicatesRejected: 0,
        comboHash: hash,
      });
      return;
    }

    try {
      setIsLoading(true);
      const sessionResult = await generateValidSession(
        user.id,
        gameName,
        systemType,
        generator,
        getHashParams
      );
      setResult(sessionResult);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to regenerate session"));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, gameName, systemType, generator, getHashParams]);

  return {
    session: result?.session ?? null,
    comboHash: result?.comboHash ?? "",
    fallbackUsed: result?.fallbackUsed ?? false,
    duplicatesRejected: result?.duplicatesRejected ?? 0,
    isLoading,
    error,
    regenerate,
  };
}

/**
 * Quick validation hook for checking if a combo is valid.
 */
export function useComboValidation(
  gameName: string,
  gameType: string
) {
  const { recentCombos, isLoading } = useRecentCombos(gameName);
  const systemType = useMemo(() => getSystemTypeFromGameType(gameType), [gameType]);

  const validateCombo = useCallback(
    (hashParams: ComboHashParams): boolean => {
      if (isLoading) return true; // Allow while loading
      
      const hash = generateComboHash(hashParams);
      const result = isComboValid(hash, recentCombos, systemType);
      return result.valid;
    },
    [recentCombos, systemType, isLoading]
  );

  return { validateCombo, isLoading };
}
