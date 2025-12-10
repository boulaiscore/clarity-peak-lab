import React from 'react';
import AuditoryFocusActivation from './AuditoryFocusActivation';

interface VisualStabilityModuleProps {
  duration?: number;
  onComplete: (stability: number) => void;
}

export function VisualStabilityModule({ onComplete }: VisualStabilityModuleProps) {
  const handleComplete = (result: { score: number; correct: number; avgReactionTime: number }) => {
    onComplete(result.score);
  };

  return (
    <AuditoryFocusActivation onComplete={handleComplete} />
  );
}

export default VisualStabilityModule;
