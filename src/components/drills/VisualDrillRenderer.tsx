// Visual Drill Renderer - Routes to appropriate drill component
import { DotTargetDrill } from "./DotTargetDrill";
import { MemoryMatrixDrill } from "./MemoryMatrixDrill";
import { StroopDrill } from "./StroopDrill";
import { PatternSequenceDrill } from "./PatternSequenceDrill";
import { VisualSearchDrill } from "./VisualSearchDrill";
import { NBackVisualDrill } from "./NBackVisualDrill";
import { ShapeMatchDrill } from "./ShapeMatchDrill";
import { MentalRotationDrill } from "./MentalRotationDrill";
import { DigitSpanDrill } from "./DigitSpanDrill";
import { GoNoGoDrill } from "./GoNoGoDrill";
import { LocationMatchDrill } from "./LocationMatchDrill";
import { VisualExerciseConfig } from "@/data/visual_exercises";

interface VisualDrillRendererProps {
  config: VisualExerciseConfig;
  onComplete: (result: any) => void;
}

export function VisualDrillRenderer({ config, onComplete }: VisualDrillRendererProps) {
  switch (config.drillType) {
    case "dot_target":
      return <DotTargetDrill config={config.config as any} timeLimit={config.timeLimit} onComplete={onComplete} />;
    case "memory_matrix":
      return <MemoryMatrixDrill config={config.config as any} timeLimit={config.timeLimit} onComplete={onComplete} />;
    case "stroop_visual":
      return <StroopDrill config={config.config as any} timeLimit={config.timeLimit} onComplete={onComplete} />;
    case "pattern_sequence":
      return <PatternSequenceDrill config={config.config as any} timeLimit={config.timeLimit} onComplete={onComplete} />;
    case "visual_search":
      return <VisualSearchDrill config={config.config as any} timeLimit={config.timeLimit} onComplete={onComplete} />;
    case "n_back_visual":
      return <NBackVisualDrill config={config.config as any} timeLimit={config.timeLimit} onComplete={onComplete} />;
    case "shape_match":
      return <ShapeMatchDrill config={config.config as any} timeLimit={config.timeLimit} onComplete={onComplete} />;
    case "mental_rotation":
      return <MentalRotationDrill config={config.config as any} timeLimit={config.timeLimit} onComplete={onComplete} />;
    case "digit_span":
      return <DigitSpanDrill config={config.config as any} timeLimit={config.timeLimit} onComplete={onComplete} />;
    case "go_no_go":
      return <GoNoGoDrill config={config.config as any} timeLimit={config.timeLimit} onComplete={onComplete} />;
    case "location_match":
      return <LocationMatchDrill config={config.config as any} timeLimit={config.timeLimit} onComplete={onComplete} />;
    default:
      return <div className="p-8 text-center text-muted-foreground">Drill type not implemented yet</div>;
  }
}