
# Fast Charge Voice Toggle Extension

## Overview
Add an explicit user choice between "Voice + Sound" and "Sound only" modes for Fast Charge sessions. Voice cues will use pre-generated MP3 audio files (no TTS) played at fixed timestamps based on program and duration.

## Current Flow
```
Intro → Mode+Duration Select → Pre-check → Session → Post-check → Results
```

## New Flow
```
Intro → Mode+Duration Select → Voice Mode Select → Pre-check → Session → Post-check → Results
```

---

## Implementation Steps

### Step 1: Copy Audio Files to Project
Copy all uploaded MP3 files to `public/audio/recharging/`:
- `INTRO_01.mp3`
- `OVER_01.mp3` through `OVER_04.mp3`
- `RUM_01.mp3` through `RUM_04.mp3`
- `PRE_01.mp3` through `PRE_04.mp3`
- `END_01.mp3` through `END_04.mp3`
- `OUTRO_01.mp3` (optional, for soft end tone)

Using the `public` folder allows direct URL access for Audio API playback.

### Step 2: Create Voice Mode Selection Component
**New file:** `src/components/recharging/RechargingVoiceModeSelect.tsx`

- Title: "Recharging mode"
- Two radio options:
  - "Voice + Sound" — Helper: "Short neutral voice cues during the session."
  - "Sound only" — Helper: "Background sound only, no voice."
- Load last choice from localStorage (key: `recharging_audio_mode`)
- Default to "sound_only" if no stored preference
- Save choice to localStorage on continue

### Step 3: Update Flow State Machine
**File:** `src/pages/app/RechargingRunner.tsx`

- Add new phase: `"voice-mode-select"`
- Add state: `audioMode: "voice" | "sound_only"`
- Update phase sequence:
  - After `mode-select` → transition to `voice-mode-select`
  - After `voice-mode-select` → transition to `pre-check`
- Pass `audioMode` to `RechargingSession` component

### Step 4: Define Voice Cue Mapping
**File:** `src/lib/recharging.ts`

Add type and configuration for voice cues:

```typescript
export type RechargingAudioMode = "voice" | "sound_only";

export type RechargingDuration = 5 | 10 | 15;

// Fixed cue mapping by program and duration
export const VOICE_CUE_MAP: Record<
  RechargingMode,
  Record<RechargingDuration, { timestamp: number; file: string }[]>
> = {
  overloaded: {
    5: [{ timestamp: 150, file: "OVER_01.mp3" }],
    10: [
      { timestamp: 180, file: "OVER_01.mp3" },
      { timestamp: 420, file: "OVER_02.mp3" },
    ],
    15: [
      { timestamp: 180, file: "OVER_01.mp3" },
      { timestamp: 420, file: "OVER_02.mp3" },
      { timestamp: 660, file: "OVER_03.mp3" },
    ],
  },
  ruminating: {
    5: [{ timestamp: 150, file: "RUM_01.mp3" }],
    10: [
      { timestamp: 180, file: "RUM_01.mp3" },
      { timestamp: 420, file: "RUM_02.mp3" },
    ],
    15: [
      { timestamp: 180, file: "RUM_01.mp3" },
      { timestamp: 420, file: "RUM_02.mp3" },
      { timestamp: 660, file: "RUM_03.mp3" },
    ],
  },
  "pre-decision": {
    5: [{ timestamp: 150, file: "PRE_01.mp3" }],
    10: [
      { timestamp: 180, file: "PRE_01.mp3" },
      { timestamp: 420, file: "PRE_02.mp3" },
    ],
    15: [
      { timestamp: 180, file: "PRE_01.mp3" },
      { timestamp: 420, file: "PRE_02.mp3" },
      { timestamp: 660, file: "PRE_03.mp3" },
    ],
  },
  "end-of-day": {
    5: [{ timestamp: 150, file: "END_01.mp3" }],
    10: [
      { timestamp: 180, file: "END_01.mp3" },
      { timestamp: 420, file: "END_02.mp3" },
    ],
    15: [
      { timestamp: 180, file: "END_01.mp3" },
      { timestamp: 420, file: "END_02.mp3" },
      { timestamp: 660, file: "END_03.mp3" },
    ],
  },
};
```

### Step 5: Create Voice Cue Audio Hook
**New file:** `src/hooks/useVoiceCueAudio.ts`

- Accept props: `mode`, `durationMinutes`, `audioMode`, `onSessionStart`
- If `audioMode === "voice"`:
  - Play `INTRO_01.mp3` immediately at t=0
  - Schedule cues from `VOICE_CUE_MAP` using `setTimeout`
  - Each cue plays via `new Audio(url).play()`
- If `audioMode === "sound_only"`:
  - No voice cues played
- Cleanup all scheduled timeouts on unmount
- Graceful volume handling (no jarring starts/stops)

### Step 6: Update Session Component
**File:** `src/components/recharging/RechargingSession.tsx`

- Add props: `audioMode: RechargingAudioMode`
- Import and use `useVoiceCueAudio` hook
- Pass mode, duration, and audioMode to the hook
- UI remains minimal (no text overlays during playback)
- "You can lock your phone now." message only if `audioMode === "voice"` (intro cue says it)
- For `sound_only`, show the text message briefly at start

### Step 7: Add Soft End Tone
At session end, play a subtle completion tone:
- Option A: Use `OUTRO_01.mp3` as a soft tone (if neutral enough)
- Option B: Generate a short sine wave tone via Web Audio API (already in audio engine)
- The current implementation already handles fade-out; add a ~1 second soft tone before transitioning to post-check

---

## Technical Notes

### Audio File Organization
```
public/
└── audio/
    └── recharging/
        ├── INTRO_01.mp3
        ├── OVER_01.mp3
        ├── OVER_02.mp3
        ├── OVER_03.mp3
        ├── OVER_04.mp3
        ├── RUM_01.mp3
        ├── RUM_02.mp3
        ├── RUM_03.mp3
        ├── RUM_04.mp3
        ├── PRE_01.mp3
        ├── PRE_02.mp3
        ├── PRE_03.mp3
        ├── PRE_04.mp3
        ├── END_01.mp3
        ├── END_02.mp3
        ├── END_03.mp3
        └── END_04.mp3
```

### localStorage Key
- Key: `recharging_audio_mode`
- Values: `"voice"` | `"sound_only"`
- Default (first time): `"sound_only"`

### Timestamp Reference
| Duration | Cue 1 | Cue 2 | Cue 3 |
|----------|-------|-------|-------|
| 5 min    | 2:30 (150s) | - | - |
| 10 min   | 3:00 (180s) | 7:00 (420s) | - |
| 15 min   | 3:00 (180s) | 7:00 (420s) | 11:00 (660s) |

---

## Files to Modify/Create

| File | Action |
|------|--------|
| `public/audio/recharging/*.mp3` | Copy uploaded audio files |
| `src/components/recharging/RechargingVoiceModeSelect.tsx` | Create new component |
| `src/pages/app/RechargingRunner.tsx` | Add phase and state for voice mode |
| `src/lib/recharging.ts` | Add type and cue mapping |
| `src/hooks/useVoiceCueAudio.ts` | Create new hook for voice cue scheduling |
| `src/components/recharging/RechargingSession.tsx` | Integrate voice cue hook |

---

## Waiting for Remaining Audio Files

You mentioned you will provide the remaining audio files in the next prompt. Currently received:
- INTRO_01.mp3
- PRE_01.mp3 through PRE_04.mp3
- RUM_01.mp3 through RUM_04.mp3

Still needed:
- OVER_01.mp3 through OVER_04.mp3
- END_01.mp3 through END_04.mp3
- OUTRO_01.mp3 (optional soft tone)

Once all files are uploaded, I can proceed with the full implementation.
