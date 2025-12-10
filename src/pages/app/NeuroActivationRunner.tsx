import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { StepContainer } from "@/components/neuro-activation/StepContainer";
import { IntroScreen } from "@/components/neuro-activation/modules/IntroScreen";
import { VisualStabilityModule } from "@/components/neuro-activation/modules/VisualStabilityModule";
import { CognitiveAlignmentModule } from "@/components/neuro-activation/modules/CognitiveAlignmentModule";
import { MicroPatternModule } from "@/components/neuro-activation/modules/MicroPatternModule";
import { StrategicBreathModule } from "@/components/neuro-activation/modules/StrategicBreathModule";
import { CompletionScreen } from "@/components/neuro-activation/modules/CompletionScreen";
type Step = 'intro' | 'visual' | 'alignment' | 'pattern' | 'breath' | 'complete';

interface NeuroActivationResult {
  visualStability: number | null;
  alignmentChoice: string | null;
  patternAccuracy: number | null;
  breathCompletion: boolean;
}

export default function NeuroActivationRunner() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [result, setResult] = useState<NeuroActivationResult>({
    visualStability: null,
    alignmentChoice: null,
    patternAccuracy: null,
    breathCompletion: false,
  });

  const handleExit = useCallback(() => {
    navigate('/app');
  }, [navigate]);

  const handleBegin = useCallback(() => {
    setCurrentStep('visual');
  }, []);

  const handleVisualComplete = useCallback((stability: number) => {
    setResult(prev => ({ ...prev, visualStability: stability }));
    setCurrentStep('alignment');
  }, []);

  const handleAlignmentComplete = useCallback((choice: string | null) => {
    setResult(prev => ({ ...prev, alignmentChoice: choice }));
    setCurrentStep('pattern');
  }, []);

  const handlePatternComplete = useCallback((accuracy: number) => {
    setResult(prev => ({ ...prev, patternAccuracy: accuracy }));
    setCurrentStep('breath');
  }, []);

  const handleBreathComplete = useCallback((completed: boolean) => {
    setResult(prev => ({ ...prev, breathCompletion: completed }));
    setCurrentStep('complete');
  }, []);

  const renderStep = () => {
    switch (currentStep) {
      case 'intro':
        return <IntroScreen onBegin={handleBegin} />;
      case 'visual':
        return <VisualStabilityModule duration={60} onComplete={handleVisualComplete} />;
      case 'alignment':
        return <CognitiveAlignmentModule duration={70} onComplete={handleAlignmentComplete} />;
      case 'pattern':
        return <MicroPatternModule duration={60} onComplete={handlePatternComplete} />;
      case 'breath':
        return <StrategicBreathModule duration={75} onComplete={handleBreathComplete} />;
      case 'complete':
        return <CompletionScreen result={result} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#06070A] relative">
      {/* Exit Button */}
      <button
        onClick={handleExit}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        aria-label="Exit"
      >
        <X className="w-5 h-5 text-white/60" />
      </button>
      
      <StepContainer stepKey={currentStep}>
        {renderStep()}
      </StepContainer>
    </div>
  );
}
