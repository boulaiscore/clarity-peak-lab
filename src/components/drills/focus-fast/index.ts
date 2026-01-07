// Fast Focus Drills - Level 1: Reactive Focus
export { TargetLockDrill } from './TargetLockDrill';
export { FlashCountDrill } from './FlashCountDrill';
export { PeripheralAlertDrill } from './PeripheralAlertDrill';
export { ColorWordSnapDrill } from './ColorWordSnapDrill';
export { SignalFilterDrill } from './SignalFilterDrill';
export { OneBackFocusDrill } from './OneBackFocusDrill';
export { SpeedSortDrill } from './SpeedSortDrill';
export { DrillCompletionScreen } from './DrillCompletionScreen';

// Drill type for mapping
export type FastFocusDrillType = 
  | 'target_lock'
  | 'flash_count'
  | 'peripheral_alert'
  | 'color_word_snap'
  | 'signal_filter'
  | 'one_back_focus'
  | 'speed_sort';

export const FAST_FOCUS_DRILLS = [
  { id: 'target_lock', name: 'Target Lock', level: 1, xp: 15 },
  { id: 'flash_count', name: 'Flash Count', level: 1, xp: 15 },
  { id: 'peripheral_alert', name: 'Peripheral Alert', level: 1, xp: 15 },
  { id: 'color_word_snap', name: 'Color–Word Snap', level: 1, xp: 15 },
  { id: 'signal_filter', name: 'Signal Filter', level: 1, xp: 15 },
  { id: 'one_back_focus', name: 'One-Back Focus', level: 1, xp: 15 },
  { id: 'speed_sort', name: 'Speed Sort', level: 1, xp: 15 },
] as const;
