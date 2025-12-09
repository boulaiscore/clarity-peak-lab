import { CognitiveExercise } from "@/lib/exercises";
import { getDrillTypeForExercise, DRILL_CONFIGS } from "@/lib/drillMapping";
import { DotTargetDrill } from "./DotTargetDrill";
import { OddOneOutDrill } from "./OddOneOutDrill";
import { ShapeMatchDrill } from "./ShapeMatchDrill";
import { VisualSearchDrill } from "./VisualSearchDrill";
import { GoNoGoDrill } from "./GoNoGoDrill";
import { StroopDrill } from "./StroopDrill";
import { LocationMatchDrill } from "./LocationMatchDrill";
import { DigitSpanDrill } from "./DigitSpanDrill";
import { NBackVisualDrill } from "./NBackVisualDrill";
import { PatternSequenceDrill } from "./PatternSequenceDrill";
import { MemoryMatrixDrill } from "./MemoryMatrixDrill";
import { MentalRotationDrill } from "./MentalRotationDrill";
import { CategorySwitchDrill } from "./CategorySwitchDrill";
import { RuleSwitchDrill } from "./RuleSwitchDrill";
import { AnalogyMatchDrill } from "./AnalogyMatchDrill";
import { SequenceLogicDrill } from "./SequenceLogicDrill";
import { WordAssociationDrill } from "./WordAssociationDrill";
import { VisualVibeDrill } from "./VisualVibeDrill";
import { ColorHarmonyDrill } from "./ColorHarmonyDrill";
import { GestaltCompletionDrill } from "./GestaltCompletionDrill";
import { RapidAssociationDrill } from "./RapidAssociationDrill";
import { OpenReflectionDrill } from "./OpenReflectionDrill";

interface DrillRendererProps {
  exercise: CognitiveExercise;
  onComplete: (result: { score: number; correct: number; avgReactionTime?: number }) => void;
}

export function DrillRenderer({ exercise, onComplete }: DrillRendererProps) {
  const drillType = getDrillTypeForExercise(exercise.id);
  const config = DRILL_CONFIGS[drillType];
  
  // Normalize the completion result
  const handleComplete = (result: { 
    score?: number; 
    correct?: number; 
    avgReactionTime?: number;
    hits?: number;
    maxSpan?: number;
    maxLevel?: number;
    totalCorrect?: number;
    incorrect?: number;
    total?: number;
    accuracy?: number;
    misses?: number;
    falseAlarms?: number;
    reactionTimes?: number[];
  }) => {
    // Calculate score from available data
    let score = result.score ?? 0;
    if (score === 0 && result.correct !== undefined && result.total !== undefined) {
      score = Math.round((result.correct / Math.max(1, result.total)) * 100);
    }
    if (score === 0 && result.hits !== undefined) {
      score = Math.round((result.hits / Math.max(1, result.hits + (result.misses || 0) + (result.falseAlarms || 0))) * 100);
    }
    if (score === 0 && result.maxSpan) {
      score = result.maxSpan * 10;
    }
    if (score === 0 && result.maxLevel) {
      score = result.maxLevel * 15;
    }
      
    const correct = result.correct ?? result.hits ?? result.totalCorrect ?? result.maxSpan ?? result.maxLevel ?? 0;
    
    const avgReactionTime = result.avgReactionTime ?? 
      (result.reactionTimes && result.reactionTimes.length > 0 
        ? result.reactionTimes.reduce((a, b) => a + b, 0) / result.reactionTimes.length 
        : undefined);

    onComplete({ score, correct, avgReactionTime });
  };

  switch (drillType) {
    case "dot_target":
      return (
        <DotTargetDrill
          config={{
            targetColor: "#22c55e",
            distractorColors: ["#ef4444", "#eab308"],
            dotSize: 48,
            spawnInterval: 1500,
            dotLifetime: 2500,
          }}
          timeLimit={config.timeLimit}
          onComplete={(r) => handleComplete({ 
            score: r.score, 
            correct: r.correct, 
            reactionTimes: r.reactionTimes 
          })}
        />
      );

    case "odd_one_out":
      return (
        <OddOneOutDrill
          config={{
            trialsCount: 10,
            timePerTrial: 5,
            difficulty: config.difficulty,
          }}
          timeLimit={config.timeLimit}
          onComplete={(r) => handleComplete({ 
            score: r.score, 
            correct: r.correct, 
            avgReactionTime: r.avgReactionTime 
          })}
        />
      );

    case "shape_match":
      return (
        <ShapeMatchDrill
          config={{
            shapes: ["circle", "square", "triangle", "diamond", "star"],
            displayTime: 1000,
            totalTrials: 15,
            matchProbability: 0.4,
          }}
          timeLimit={config.timeLimit}
          onComplete={(r) => handleComplete({ 
            correct: r.correct, 
            total: r.total, 
            avgReactionTime: r.avgReactionTime 
          })}
        />
      );

    case "visual_search":
      return (
        <VisualSearchDrill
          config={{
            gridSize: 4,
            targetShape: "T",
            distractorShape: "L",
            trialsCount: 10,
            timePerTrial: 5,
          }}
          timeLimit={config.timeLimit}
          onComplete={(r) => handleComplete({ 
            score: r.score, 
            correct: r.correct, 
            avgReactionTime: r.avgReactionTime 
          })}
        />
      );

    case "go_no_go":
      return (
        <GoNoGoDrill
          config={{
            goColor: "#22c55e",
            noGoColor: "#ef4444",
            trialsCount: 20,
            displayTime: 800,
            goProbability: 0.7,
          }}
          timeLimit={config.timeLimit}
          onComplete={(r) => handleComplete({ 
            hits: r.hits, 
            misses: r.misses, 
            falseAlarms: r.falseAlarms, 
            avgReactionTime: r.avgReactionTime 
          })}
        />
      );

    case "stroop":
      return (
        <StroopDrill
          config={{
            words: ["RED", "BLUE", "GREEN", "YELLOW"],
            colors: ["#ef4444", "#3b82f6", "#22c55e", "#eab308"],
            trialsCount: 15,
            timePerTrial: 3,
          }}
          timeLimit={config.timeLimit}
          onComplete={(r) => handleComplete({ 
            score: r.score, 
            correct: r.correct, 
            avgReactionTime: r.avgReactionTime 
          })}
        />
      );

    case "location_match":
      return (
        <LocationMatchDrill
          config={{
            gridSize: 3,
            trialsCount: 15,
            displayTime: 1000,
            matchProbability: 0.4,
          }}
          timeLimit={config.timeLimit}
          onComplete={(r) => handleComplete({ 
            correct: r.correct, 
            total: r.total, 
            avgReactionTime: r.avgReactionTime 
          })}
        />
      );

    case "digit_span":
      return (
        <DigitSpanDrill
          config={{
            startingLength: 3,
            maxLength: 9,
            displayTime: 800,
            trialsPerLength: 2,
          }}
          timeLimit={config.timeLimit}
          onComplete={(r) => handleComplete({ 
            maxSpan: r.maxSpan, 
            correct: r.correct, 
            total: r.total 
          })}
        />
      );

    case "n_back":
      return (
        <NBackVisualDrill
          config={{
            nBack: 2,
            shapes: ["circle", "square", "triangle", "star", "diamond"],
            displayTime: 1500,
            intervalTime: 500,
            totalTrials: 20,
          }}
          timeLimit={config.timeLimit}
          onComplete={(r) => handleComplete({ 
            score: r.score, 
            correct: r.correct, 
            accuracy: r.accuracy 
          })}
        />
      );

    case "pattern_sequence":
      return (
        <PatternSequenceDrill
          config={{
            gridSize: 3,
            startingLength: 3,
            maxLength: 7,
            flashDuration: 400,
            flashInterval: 200,
          }}
          timeLimit={config.timeLimit}
          onComplete={(r) => handleComplete({ 
            score: r.score, 
            maxLevel: r.maxLevel, 
            totalCorrect: r.totalCorrect 
          })}
        />
      );

    case "memory_matrix":
      return (
        <MemoryMatrixDrill
          config={{
            gridSize: 3,
            colors: ["#22c55e", "#3b82f6", "#ef4444", "#eab308"],
            startingLength: 3,
            maxLength: 8,
            flashDuration: 500,
            pauseBetween: 300,
          }}
          timeLimit={config.timeLimit}
          onComplete={(r) => handleComplete({ 
            score: r.score, 
            maxLevel: r.maxLevel, 
            totalCorrect: r.totalCorrect 
          })}
        />
      );

    case "mental_rotation":
      return (
        <MentalRotationDrill
          config={{
            trialsCount: 10,
            timePerTrial: 6,
          }}
          timeLimit={config.timeLimit}
          onComplete={(r) => handleComplete({ 
            correct: r.correct, 
            total: r.total, 
            avgReactionTime: r.avgReactionTime 
          })}
        />
      );

    case "category_switch":
      return (
        <CategorySwitchDrill
          config={{
            trialsCount: 20,
            timePerTrial: 3,
          }}
          timeLimit={config.timeLimit}
          onComplete={(r) => handleComplete({ 
            score: r.score, 
            correct: r.correct, 
            avgReactionTime: r.avgReactionTime 
          })}
        />
      );

    case "rule_switch":
      return (
        <RuleSwitchDrill
          config={{
            trialsCount: 20,
            switchFrequency: 4,
          }}
          timeLimit={config.timeLimit}
          onComplete={(r) => handleComplete({ 
            score: r.score, 
            correct: r.correct, 
            avgReactionTime: r.avgReactionTime 
          })}
        />
      );

    case "analogy_match":
      return (
        <AnalogyMatchDrill
          config={{
            trialsCount: 8,
            timePerTrial: 8,
            difficulty: config.difficulty,
          }}
          timeLimit={config.timeLimit}
          onComplete={(r) => handleComplete({ 
            score: r.score, 
            correct: r.correct, 
            avgReactionTime: r.avgReactionTime 
          })}
        />
      );

    case "sequence_logic":
      return (
        <SequenceLogicDrill
          config={{
            trialsCount: 8,
            timePerTrial: 10,
            difficulty: config.difficulty,
          }}
          timeLimit={config.timeLimit}
          onComplete={(r) => handleComplete({ 
            score: r.score, 
            correct: r.correct 
          })}
        />
      );

    case "word_association":
      return (
        <WordAssociationDrill
          config={{
            trialsCount: 10,
            timePerTrial: 5,
          }}
          timeLimit={config.timeLimit}
          onComplete={(r) => handleComplete({ 
            score: r.score, 
            correct: r.correct, 
            avgReactionTime: r.avgReactionTime 
          })}
        />
      );

    case "visual_vibe":
      return (
        <VisualVibeDrill
          config={{
            trialsCount: 12,
            timePerTrial: 3,
            difficulty: config.difficulty,
          }}
          timeLimit={config.timeLimit}
          onComplete={(r) => handleComplete({ 
            score: r.score, 
            correct: r.correct, 
            avgReactionTime: r.avgReactionTime 
          })}
        />
      );

    case "color_harmony":
      return (
        <ColorHarmonyDrill
          config={{
            trialsCount: 12,
            timePerTrial: 3,
            difficulty: config.difficulty,
          }}
          timeLimit={config.timeLimit}
          onComplete={(r) => handleComplete({ 
            score: r.score, 
            correct: r.correct, 
            avgReactionTime: r.avgReactionTime 
          })}
        />
      );

    case "gestalt_completion":
      return (
        <GestaltCompletionDrill
          config={{
            trialsCount: 12,
            timePerTrial: 3,
            difficulty: config.difficulty,
          }}
          timeLimit={config.timeLimit}
          onComplete={(r) => handleComplete({ 
            score: r.score, 
            correct: r.correct, 
            avgReactionTime: r.avgReactionTime 
          })}
        />
      );

    case "rapid_association":
      return (
        <RapidAssociationDrill
          config={{
            trialsCount: 15,
            timePerTrial: 2,
            difficulty: config.difficulty,
          }}
          timeLimit={config.timeLimit}
          onComplete={(r) => handleComplete({ 
            score: r.score, 
            correct: r.correct, 
            avgReactionTime: r.avgReactionTime 
          })}
        />
      );

    case "open_reflection":
      return (
        <OpenReflectionDrill
          title={exercise.title}
          prompt={exercise.prompt}
          duration={exercise.duration}
          onComplete={(r) => handleComplete({ 
            score: r.score, 
            correct: r.correct
          })}
        />
      );

    default:
      return (
        <DotTargetDrill
          config={{
            targetColor: "#22c55e",
            distractorColors: ["#ef4444", "#eab308"],
            dotSize: 48,
            spawnInterval: 1500,
            dotLifetime: 2500,
          }}
          timeLimit={config.timeLimit}
          onComplete={(r) => handleComplete({ 
            score: r.score, 
            correct: r.correct, 
            reactionTimes: r.reactionTimes 
          })}
        />
      );
  }
}
