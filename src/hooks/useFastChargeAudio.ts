import { useRef, useCallback, useEffect } from "react";
import { RechargingMode } from "@/lib/recharging";

/**
 * Web Audio API-based audio engine for Fast Charge
 * Generates pink noise, brown noise, and low-frequency tones
 * No external audio files or TTS required
 */

type AudioProgram = RechargingMode;

interface UseFastChargeAudioReturn {
  start: (program: AudioProgram, durationMinutes: number) => void;
  stop: () => void;
  isPlaying: boolean;
}

// Pink noise generator using Paul Kellet's refined method
function createPinkNoiseProcessor(audioContext: AudioContext): AudioBufferSourceNode {
  const bufferSize = 2 * audioContext.sampleRate;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const output = buffer.getChannelData(0);

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    output[i] *= 0.11; // Scale to prevent clipping
    b6 = white * 0.115926;
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

// Brown noise generator (integrated white noise)
function createBrownNoiseProcessor(audioContext: AudioContext): AudioBufferSourceNode {
  const bufferSize = 2 * audioContext.sampleRate;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const output = buffer.getChannelData(0);

  let lastOut = 0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    output[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = output[i];
    output[i] *= 3.5; // Scale for audibility
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

// Low frequency oscillator for Pre-decision program
function createLowFrequencyTone(
  audioContext: AudioContext,
  frequency: number,
  duration: number,
  startTime: number
): OscillatorNode {
  const osc = audioContext.createOscillator();
  osc.type = "sine";
  osc.frequency.value = frequency;
  
  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(0.03, startTime + 2); // Very soft fade in
  gainNode.gain.linearRampToValueAtTime(0.03, startTime + duration - 2);
  gainNode.gain.linearRampToValueAtTime(0, startTime + duration); // Fade out
  
  osc.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  return osc;
}

export function useFastChargeAudio(): UseFastChargeAudioReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const isPlayingRef = useRef(false);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    
    oscillatorsRef.current.forEach(osc => {
      try { osc.stop(); } catch (e) {}
      try { osc.disconnect(); } catch (e) {}
    });
    oscillatorsRef.current = [];

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

  const start = useCallback((program: AudioProgram, durationMinutes: number) => {
    cleanup();

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;

    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNodeRef.current = gainNode;

    const durationSeconds = durationMinutes * 60;
    let source: AudioBufferSourceNode;

    switch (program) {
      case "overloaded":
        // Soft pink noise, constant, low volume
        source = createPinkNoiseProcessor(audioContext);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 3); // Fade in
        break;

      case "ruminating":
        // Deep brown noise, steady
        source = createBrownNoiseProcessor(audioContext);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 3); // Fade in
        break;

      case "pre-decision":
        // Near silence with occasional very soft low-frequency tones
        source = createPinkNoiseProcessor(audioContext);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.02, audioContext.currentTime + 2); // Very quiet background

        // Schedule occasional low-frequency tones (30-60 Hz range)
        const toneCount = Math.floor(durationMinutes / 2); // One tone every ~2 minutes
        for (let i = 0; i < toneCount; i++) {
          const toneStart = audioContext.currentTime + 30 + (i * (durationSeconds / toneCount));
          const frequency = 30 + Math.random() * 30; // 30-60 Hz
          const toneDuration = 8 + Math.random() * 4; // 8-12 seconds
          
          const osc = createLowFrequencyTone(audioContext, frequency, toneDuration, toneStart);
          oscillatorsRef.current.push(osc);
          osc.start(toneStart);
          osc.stop(toneStart + toneDuration);
        }
        break;

      case "end-of-day":
        // Pink noise with slow fade-out toward the end
        source = createPinkNoiseProcessor(audioContext);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 3); // Fade in
        
        // Start fading out in the last 20% of the session
        const fadeStartTime = durationSeconds * 0.8;
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime + fadeStartTime);
        gainNode.gain.linearRampToValueAtTime(0.02, audioContext.currentTime + durationSeconds);
        break;

      default:
        source = createPinkNoiseProcessor(audioContext);
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    }

    source.connect(gainNode);
    sourceRef.current = source;
    source.start();
    isPlayingRef.current = true;

    // Auto-stop after duration
    setTimeout(() => {
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
