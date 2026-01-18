// Triage Sprint - The new S1-AE game
export { TriageSprintDrill } from './TriageSprintDrill';
export { TriageSprintResults } from './TriageSprintResults';
export { DrillCompletionScreen } from './DrillCompletionScreen';

// Drill type for mapping
export type FastFocusDrillType = 'triage_sprint';

export const FAST_FOCUS_DRILLS = [
  { id: 'triage_sprint', name: 'Triage Sprint', level: 1, xp: { easy: 15, medium: 25, hard: 40 } },
] as const;
