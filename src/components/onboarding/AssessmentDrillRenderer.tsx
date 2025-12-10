// Assessment drill renderer using the new 6 elite drills
import React from 'react';
import { FocusFastDynamicAttentionSplit } from '../drills/FocusFastDynamicAttentionSplit';
import { ReasoningFastCognitiveWhiplash } from '../drills/ReasoningFastCognitiveWhiplash';
import { CreativityFastAssociativeFlashMatrix } from '../drills/CreativityFastAssociativeFlashMatrix';
import { FocusSlowBlindspotPatternExtraction } from '../drills/FocusSlowBlindspotPatternExtraction';
import { ReasoningSlowInfiniteRegressChallenge } from '../drills/ReasoningSlowInfiniteRegressChallenge';
import { CreativitySlowConceptForge } from '../drills/CreativitySlowConceptForge';

export interface AssessmentDrillResult {
  score: number;
  correct: number;
  avgReactionTime: number;
  metadata?: Record<string, any>;
}

interface AssessmentDrillRendererProps {
  exerciseIndex: number;
  onComplete: (result: AssessmentDrillResult) => void;
}

// Assessment drill config for integration
export const ASSESSMENT_DRILLS = [
  { id: 'focus_fast', area: 'focus', thinkingMode: 'fast', label: 'Focus Arena', name: 'Dynamic Attention Split' },
  { id: 'reasoning_fast', area: 'reasoning', thinkingMode: 'fast', label: 'Critical Reasoning', name: 'Cognitive Whiplash' },
  { id: 'creativity_fast', area: 'creativity', thinkingMode: 'fast', label: 'Creativity Hub', name: 'Associative Flash Matrix' },
  { id: 'focus_slow', area: 'focus', thinkingMode: 'slow', label: 'Focus Arena', name: 'Blindspot Pattern' },
  { id: 'reasoning_slow', area: 'reasoning', thinkingMode: 'slow', label: 'Critical Reasoning', name: 'Infinite Regress' },
  { id: 'creativity_slow', area: 'creativity', thinkingMode: 'slow', label: 'Creativity Hub', name: 'Concept Forge' },
] as const;

export const AssessmentDrillRenderer: React.FC<AssessmentDrillRendererProps> = ({ 
  exerciseIndex, 
  onComplete 
}) => {
  const handleComplete = (result: AssessmentDrillResult) => {
    onComplete({
      score: result.score,
      correct: result.correct,
      avgReactionTime: result.avgReactionTime || 0,
      metadata: result.metadata,
    });
  };

  switch (exerciseIndex) {
    case 0:
      return <FocusFastDynamicAttentionSplit onComplete={handleComplete} />;
    case 1:
      return <ReasoningFastCognitiveWhiplash onComplete={handleComplete} />;
    case 2:
      return <CreativityFastAssociativeFlashMatrix onComplete={handleComplete} />;
    case 3:
      return <FocusSlowBlindspotPatternExtraction onComplete={handleComplete} />;
    case 4:
      return <ReasoningSlowInfiniteRegressChallenge onComplete={handleComplete} />;
    case 5:
      return <CreativitySlowConceptForge onComplete={handleComplete} />;
    default:
      return <FocusFastDynamicAttentionSplit onComplete={handleComplete} />;
  }
};

export default AssessmentDrillRenderer;
