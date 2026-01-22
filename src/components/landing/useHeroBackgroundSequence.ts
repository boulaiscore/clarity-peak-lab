import { useCallback, useRef, useState } from "react";

type UseHeroBackgroundSequenceOptions = {
  sources: string[];
  maxPlays?: number; // defaults to sources.length
};

/**
 * Plays a list of video sources in sequence and stops after maxPlays.
 * Intended for hero background loops where we want a longer “experience”
 * without requiring a single long MP4 asset.
 */
export function useHeroBackgroundSequence({
  sources,
  maxPlays,
}: UseHeroBackgroundSequenceOptions) {
  const limit = maxPlays ?? sources.length;
  const [playIndex, setPlayIndex] = useState(0);
  const playsRef = useRef(0);

  const resetSequence = useCallback(() => {
    playsRef.current = 0;
    setPlayIndex(0);
  }, []);

  const advance = useCallback(() => {
    playsRef.current += 1;

    if (playsRef.current >= limit) {
      // Caller decides what to do (usually reset hero to image)
      return { done: true as const };
    }

    setPlayIndex((i) => (i + 1) % sources.length);
    return { done: false as const };
  }, [limit, sources.length]);

  return {
    src: sources[playIndex] ?? sources[0],
    resetSequence,
    advance,
  };
}
