// Fast Focus Drills - Level 1: Reactive Focus
export { TargetLockDrill } from './TargetLockDrill';
export { FlashCountDrill } from './FlashCountDrill';
export { PeripheralAlertDrill } from './PeripheralAlertDrill';
export { ColorWordSnapDrill } from './ColorWordSnapDrill';
export { SignalFilterDrill } from './SignalFilterDrill';
export { OneBackFocusDrill } from './OneBackFocusDrill';
export { SpeedSortDrill } from './SpeedSortDrill';
export { DrillCompletionScreen } from './DrillCompletionScreen';

// Level 2: Selective Pressure
export { DualTargetDrill } from './DualTargetDrill';
export { FalseAlarmDrill } from './FalseAlarmDrill';
export { RuleSwitchFocusDrill } from './RuleSwitchFocusDrill';
export { FocusWindowDrill } from './FocusWindowDrill';
export { DistractorBurstDrill } from './DistractorBurstDrill';
export { OddPrecisionDrill } from './OddPrecisionDrill';
export { RapidTrackingDrill } from './RapidTrackingDrill';

// Drill type for mapping
export type FastFocusDrillType = 
  | 'target_lock' | 'flash_count' | 'peripheral_alert' | 'color_word_snap' 
  | 'signal_filter' | 'one_back_focus' | 'speed_sort'
  | 'dual_target' | 'false_alarm' | 'rule_switch_focus' | 'focus_window'
  | 'distractor_burst' | 'odd_precision' | 'rapid_tracking'
  | 'hidden_rule' | 'temporal_gate' | 'multi_feature_lock' | 'cognitive_interference'
  | 'acceleration' | 'error_recovery' | 'chaos_focus';

export const FAST_FOCUS_DRILLS = [
  // Level 1
  { id: 'target_lock', name: 'Target Lock', level: 1, xp: 15 },
  { id: 'flash_count', name: 'Flash Count', level: 1, xp: 15 },
  { id: 'peripheral_alert', name: 'Peripheral Alert', level: 1, xp: 15 },
  { id: 'color_word_snap', name: 'Color–Word Snap', level: 1, xp: 15 },
  { id: 'signal_filter', name: 'Signal Filter', level: 1, xp: 15 },
  { id: 'one_back_focus', name: 'One-Back Focus', level: 1, xp: 15 },
  { id: 'speed_sort', name: 'Speed Sort', level: 1, xp: 15 },
  // Level 2
  { id: 'dual_target', name: 'Dual Target', level: 2, xp: 20 },
  { id: 'false_alarm', name: 'False Alarm', level: 2, xp: 20 },
  { id: 'rule_switch_focus', name: 'Rule Switch', level: 2, xp: 20 },
  { id: 'focus_window', name: 'Focus Window', level: 2, xp: 20 },
  { id: 'distractor_burst', name: 'Distractor Burst', level: 2, xp: 20 },
  { id: 'odd_precision', name: 'Odd Precision', level: 2, xp: 20 },
  { id: 'rapid_tracking', name: 'Rapid Tracking', level: 2, xp: 20 },
  // Level 3
  { id: 'hidden_rule', name: 'Hidden Rule', level: 3, xp: 25 },
  { id: 'temporal_gate', name: 'Temporal Gate', level: 3, xp: 25 },
  { id: 'multi_feature_lock', name: 'Multi-Feature Lock', level: 3, xp: 25 },
  { id: 'cognitive_interference', name: 'Cognitive Interference', level: 3, xp: 25 },
  { id: 'acceleration', name: 'Acceleration', level: 3, xp: 25 },
  { id: 'error_recovery', name: 'Error Recovery', level: 3, xp: 25 },
  { id: 'chaos_focus', name: 'Chaos Focus', level: 3, xp: 25 },
] as const;
