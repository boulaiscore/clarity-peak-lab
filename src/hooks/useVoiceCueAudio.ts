import { useEffect, useRef, useCallback } from "react";
import { RechargingMode, RechargingAudioMode, RechargingDuration, VOICE_CUE_MAP } from "@/lib/recharging";

interface UseVoiceCueAudioProps {
  mode: RechargingMode;
  durationMinutes: RechargingDuration;
  audioMode: RechargingAudioMode;
  isActive: boolean;
}

const AUDIO_BASE_PATH = "/audio/recharging/";

/**
 * Voice Cue Audio Hook
 * 
 * Plays pre-recorded voice cues at fixed timestamps during Fast Charge sessions.
 * Only active when audioMode is "voice".
 * 
 * At t=0: Plays INTRO_01.mp3 ("You can lock your phone now")
 * At program-specific timestamps: Plays program cues from VOICE_CUE_MAP
 */
export function useVoiceCueAudio({
  mode,
  durationMinutes,
  audioMode,
  isActive,
}: UseVoiceCueAudioProps) {
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = useCallback((filename: string, volume = 0.8) => {
    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(`${AUDIO_BASE_PATH}${filename}`);
      audio.volume = volume;
      audioRef.current = audio;

      audio.play().catch((err) => {
        console.warn("Voice cue playback failed:", err);
      });
    } catch (err) {
      console.warn("Voice cue error:", err);
    }
  }, []);

  const stop = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  // Schedule voice cues when session becomes active
  useEffect(() => {
    // Clear any existing timeouts
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    if (audioMode !== "voice" || !isActive) {
      return;
    }

    // Play intro immediately
    playAudio("INTRO_01.mp3");

    // Get cues for this program and duration
    const cues = VOICE_CUE_MAP[mode]?.[durationMinutes] || [];

    // Schedule each cue
    cues.forEach((cue) => {
      const timeout = setTimeout(() => {
        playAudio(cue.file);
      }, cue.timestamp * 1000);

      timeoutsRef.current.push(timeout);
    });

    return () => {
      // Cleanup on unmount or when session ends
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [mode, durationMinutes, audioMode, isActive, playAudio]);

  return { stop };
}
