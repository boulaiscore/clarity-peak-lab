import { useRef, useCallback, useEffect } from "react";
import { RechargingMode } from "@/lib/recharging";

/**
 * Fast Charge Audio Engine
 * 
 * Plays program-specific background audio files.
 * Each program MUST have its own distinct MP3 file - no fallbacks.
 * Duration controls looping/fading only.
 */

type AudioProgram = RechargingMode;

interface UseFastChargeAudioReturn {
  start: (program: AudioProgram, durationMinutes: number) => void;
  stop: () => void;
  isPlaying: boolean;
}

const AUDIO_BASE_PATH = "/audio/recharging/";

/**
 * Strict program-to-file mapping.
 * Each program has a unique background audio file.
 * NO fallback - if file is missing, we throw an error.
 */
const PROGRAM_AUDIO_MAP: Record<RechargingMode, string> = {
  overloaded: "overloaded.mp3",      // Pink noise
  ruminating: "ruminating.mp3",       // Brown noise (deeper)
  "pre-decision": "pre_decision.mp3", // Near silence with soft low tones
  "end-of-day": "end_of_day.mp3",     // Pink noise with slow fade-out
};

export function useFastChargeAudio(): UseFastChargeAudioReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const isPlayingRef = useRef(false);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }

    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (e) {}
      try { sourceRef.current.disconnect(); } catch (e) {}
      sourceRef.current = null;
    }

    if (gainNodeRef.current) {
      try { gainNodeRef.current.disconnect(); } catch (e) {}
      gainNodeRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    isPlayingRef.current = false;
  }, []);

  const start = useCallback(async (program: AudioProgram, durationMinutes: number) => {
    cleanup();

    // Get the program-specific audio file
    const audioFile = PROGRAM_AUDIO_MAP[program];
    if (!audioFile) {
      throw new Error(`No audio file mapped for program: ${program}`);
    }

    const audioUrl = `${AUDIO_BASE_PATH}${audioFile}`;
    const durationSeconds = durationMinutes * 60;

    try {
      // Fetch the audio file
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to load audio file for program "${program}": ${audioUrl} (${response.status})`);
      }

      const arrayBuffer = await response.arrayBuffer();

      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Decode the audio
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Create gain node for volume control
      const gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
      gainNodeRef.current = gainNode;

      // Create source and connect
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true; // Loop the audio for the duration
      source.connect(gainNode);
      sourceRef.current = source;

      // Apply program-specific volume and fade behavior
      switch (program) {
        case "overloaded":
          // Soft pink noise, constant volume
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 3); // Fade in
          break;

        case "ruminating":
          // Brown noise, slightly louder
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 3); // Fade in
          break;

        case "pre-decision":
          // Near silence - very quiet
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 3); // Fade in to low volume
          break;

        case "end-of-day":
          // Pink noise with slow fade-out toward the end
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 3); // Fade in
          
          // Start fading out in the last 20% of the session
          const fadeStartTime = durationSeconds * 0.8;
          gainNode.gain.setValueAtTime(0.4, audioContext.currentTime + fadeStartTime);
          gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + durationSeconds);
          break;
      }

      // Start playback
      source.start();
      isPlayingRef.current = true;

      // Auto-stop after duration
      stopTimeoutRef.current = setTimeout(() => {
        // Final fade out
        if (gainNodeRef.current && audioContextRef.current) {
          const currentGain = gainNodeRef.current.gain.value;
          gainNodeRef.current.gain.setValueAtTime(currentGain, audioContextRef.current.currentTime);
          gainNodeRef.current.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 2);
          
          setTimeout(cleanup, 2500);
        } else {
          cleanup();
        }
      }, durationSeconds * 1000);

    } catch (error) {
      cleanup();
      console.error(`Fast Charge audio error for program "${program}":`, error);
      throw error; // Re-throw to let caller handle the error
    }
  }, [cleanup]);

  const stop = useCallback(() => {
    // Graceful fade out
    if (gainNodeRef.current && audioContextRef.current && isPlayingRef.current) {
      const currentGain = gainNodeRef.current.gain.value;
      gainNodeRef.current.gain.setValueAtTime(currentGain, audioContextRef.current.currentTime);
      gainNodeRef.current.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 1);
      
      setTimeout(cleanup, 1200);
    } else {
      cleanup();
    }
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    start,
    stop,
    isPlaying: isPlayingRef.current,
  };
}
