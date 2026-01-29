import { useRef, useCallback, useEffect } from "react";
import { RechargingMode } from "@/lib/recharging";

/**
 * Fast Charge Audio Engine
 * 
 * Generates program-specific background audio using Web Audio API.
 * Each program has a unique noise profile - no fallbacks.
 */

type AudioProgram = RechargingMode;

interface UseFastChargeAudioReturn {
  start: (program: AudioProgram, durationMinutes: number) => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  isPlaying: boolean;
}

/**
 * Creates a Pink Noise generator using Web Audio API
 * Pink noise has equal energy per octave (1/f spectrum)
 */
function createPinkNoiseProcessor(audioContext: AudioContext): AudioWorkletNode | ScriptProcessorNode {
  // Fallback to ScriptProcessor for broader compatibility
  const bufferSize = 4096;
  const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
  
  // Pink noise coefficients (Paul Kellet's algorithm)
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  
  processor.onaudioprocess = (e) => {
    const output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  };
  
  return processor;
}

/**
 * Creates a Tibetan Singing Bowl generator
 * Simulates the harmonic overtones of singing bowls with slow amplitude modulation
 */
function createSingingBowls(audioContext: AudioContext): { nodes: AudioNode[], output: GainNode } {
  const nodes: AudioNode[] = [];
  const masterGain = audioContext.createGain();
  masterGain.gain.setValueAtTime(0, audioContext.currentTime);
  
  // Singing bowl fundamental frequencies (Hz) - based on common bowl tunings
  const bowlFrequencies = [
    { fundamental: 110, harmonics: [220, 330, 440] },   // A2 bowl
    { fundamental: 146.83, harmonics: [293.66, 440.49] }, // D3 bowl  
    { fundamental: 196, harmonics: [392, 588] },        // G3 bowl
  ];
  
  bowlFrequencies.forEach((bowl, bowlIndex) => {
    // Fundamental tone
    const fundamental = audioContext.createOscillator();
    fundamental.type = "sine";
    fundamental.frequency.setValueAtTime(bowl.fundamental, audioContext.currentTime);
    
    const fundamentalGain = audioContext.createGain();
    fundamentalGain.gain.setValueAtTime(0.15 - bowlIndex * 0.03, audioContext.currentTime);
    
    // Slow amplitude modulation (breathing effect)
    const lfo = audioContext.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.05 + bowlIndex * 0.02, audioContext.currentTime); // Very slow: 0.05-0.09 Hz
    
    const lfoGain = audioContext.createGain();
    lfoGain.gain.setValueAtTime(0.04, audioContext.currentTime);
    
    lfo.connect(lfoGain);
    lfoGain.connect(fundamentalGain.gain);
    lfo.start();
    
    fundamental.connect(fundamentalGain);
    fundamentalGain.connect(masterGain);
    fundamental.start();
    
    nodes.push(fundamental, fundamentalGain, lfo, lfoGain);
    
    // Harmonics (quieter)
    bowl.harmonics.forEach((harmFreq, hIndex) => {
      const harmonic = audioContext.createOscillator();
      harmonic.type = "sine";
      harmonic.frequency.setValueAtTime(harmFreq, audioContext.currentTime);
      
      const harmonicGain = audioContext.createGain();
      harmonicGain.gain.setValueAtTime(0.04 - hIndex * 0.01, audioContext.currentTime);
      
      harmonic.connect(harmonicGain);
      harmonicGain.connect(masterGain);
      harmonic.start();
      
      nodes.push(harmonic, harmonicGain);
    });
  });
  
  return { nodes, output: masterGain };
}

/**
 * Creates a Brown Noise generator using Web Audio API
 * Brown noise has more bass/low frequency content (1/f² spectrum)
 */
function createBrownNoiseProcessor(audioContext: AudioContext): ScriptProcessorNode {
  const bufferSize = 4096;
  const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
  
  let lastOut = 0;
  
  processor.onaudioprocess = (e) => {
    const output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Boost the output
    }
  };
  
  return processor;
}

/**
 * Creates a Low Frequency Tone generator for pre-decision mode
 * Subtle, calming low-frequency tones with gentle modulation
 */
function createLowToneGenerator(audioContext: AudioContext): OscillatorNode[] {
  const oscillators: OscillatorNode[] = [];
  
  // Create subtle low-frequency oscillators - higher frequencies for better audibility
  const frequencies = [80, 120, 160]; // Hz - low but audible on most speakers
  
  frequencies.forEach((freq) => {
    const osc = audioContext.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, audioContext.currentTime);
    oscillators.push(osc);
  });
  
  return oscillators;
}

export function useFastChargeAudio(): UseFastChargeAudioReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const baseVolumeRef = useRef<number>(1); // Store the base volume multiplier
  const isPlayingRef = useRef(false);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }

    // Stop and disconnect all nodes
    nodesRef.current.forEach(node => {
      try {
        if (node instanceof OscillatorNode) {
          node.stop();
        }
        node.disconnect();
      } catch (e) {
        // Ignore errors during cleanup
      }
    });
    nodesRef.current = [];

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

    const durationSeconds = durationMinutes * 60;

    try {
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create master gain node
      const gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
      gainNodeRef.current = gainNode;

      // Generate program-specific audio
      switch (program) {
        case "overloaded": {
          // Tibetan singing bowls with pink noise undertone
          
          // Pink noise layer (very soft)
          const pinkNoise = createPinkNoiseProcessor(audioContext);
          const pinkGain = audioContext.createGain();
          pinkGain.gain.setValueAtTime(0, audioContext.currentTime);
          pinkGain.gain.linearRampToValueAtTime(0.06, audioContext.currentTime + 4);
          pinkNoise.connect(pinkGain);
          pinkGain.connect(gainNode);
          nodesRef.current.push(pinkNoise, pinkGain);
          
          // Singing bowls layer
          const { nodes: bowlNodes, output: bowlOutput } = createSingingBowls(audioContext);
          bowlOutput.connect(gainNode);
          bowlOutput.gain.setValueAtTime(0, audioContext.currentTime);
          bowlOutput.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 5);
          nodesRef.current.push(...bowlNodes, bowlOutput);
          
          // Master fade in
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.8, audioContext.currentTime + 3);
          break;
        }

        case "ruminating": {
          // Brown noise - deeper, slightly louder
          const brownNoise = createBrownNoiseProcessor(audioContext);
          brownNoise.connect(gainNode);
          nodesRef.current.push(brownNoise);
          
          // Fade in (reduced volume)
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.22, audioContext.currentTime + 3);
          break;
        }

        case "pre-decision": {
          // Low tones - subtle, calming low frequencies
          const oscillators = createLowToneGenerator(audioContext);
          const oscGain = audioContext.createGain();
          oscGain.connect(gainNode);
          
          oscillators.forEach((osc, index) => {
            // Each oscillator with audible gain
            const individualGain = audioContext.createGain();
            individualGain.gain.setValueAtTime(0.3 - index * 0.05, audioContext.currentTime);
            osc.connect(individualGain);
            individualGain.connect(oscGain);
            osc.start();
            nodesRef.current.push(osc, individualGain);
          });
          
          nodesRef.current.push(oscGain);
          
          // Audible but still subtle master volume
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 4);
          break;
        }

        case "end-of-day": {
          // Pink noise with slow fade-out toward the end
          const pinkNoise = createPinkNoiseProcessor(audioContext);
          pinkNoise.connect(gainNode);
          nodesRef.current.push(pinkNoise);
          
          // Fade in (reduced volume)
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.18, audioContext.currentTime + 3);
          
          // Schedule fade-out in the last 20% of the session
          const fadeStartTime = durationSeconds * 0.8;
          gainNode.gain.setValueAtTime(0.18, audioContext.currentTime + fadeStartTime);
          gainNode.gain.linearRampToValueAtTime(0.03, audioContext.currentTime + durationSeconds);
          break;
        }
      }

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

  const setVolume = useCallback((volume: number) => {
    // volume: 0-1 range
    baseVolumeRef.current = Math.max(0, Math.min(1, volume));
    if (gainNodeRef.current && audioContextRef.current) {
      // Apply volume smoothly
      gainNodeRef.current.gain.linearRampToValueAtTime(
        baseVolumeRef.current,
        audioContextRef.current.currentTime + 0.1
      );
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    start,
    stop,
    setVolume,
    isPlaying: isPlayingRef.current,
  };
}
