import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';

interface DrillResult {
  score: number;
  correct: number;
  avgReactionTime: number;
  metadata?: Record<string, any>;
}

interface ReasoningSlowInfiniteRegressChallengeProps {
  onComplete: (result: DrillResult) => void;
}

type LinkStrength = 'strong' | 'contributory' | 'speculative';
type Phase = 'intro' | 'demo' | 'classify' | 'summary';

interface CausalNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface CausalEdge {
  from: string;
  to: string;
  explanation: string;
  correctAnswer: LinkStrength;
}

// Simplified scenario with clear causal story
const SCENARIO = {
  title: "Sales Drop Analysis",
  story: "Your e-commerce company's sales dropped 30% last month. The team identified these potential causes. Rate how strongly each factor DIRECTLY caused the next.",
  nodes: [
    { id: 'price', label: 'Price Increase', x: 150, y: 40 },
    { id: 'traffic', label: 'Website Traffic', x: 60, y: 140 },
    { id: 'competitors', label: 'New Competitor', x: 240, y: 140 },
    { id: 'sales', label: 'Sales', x: 150, y: 240 },
  ] as CausalNode[],
  edges: [
    { 
      from: 'price', 
      to: 'sales', 
      explanation: "Higher prices often reduce purchases, but customers may still buy if product is valuable",
      correctAnswer: 'contributory' as LinkStrength
    },
    { 
      from: 'competitors', 
      to: 'traffic', 
      explanation: "A new competitor might steal some customers, reducing traffic to your site",
      correctAnswer: 'contributory' as LinkStrength
    },
    { 
      from: 'traffic', 
      to: 'sales', 
      explanation: "If fewer people visit your site, you'll have fewer potential buyers",
      correctAnswer: 'strong' as LinkStrength
    },
    { 
      from: 'competitors', 
      to: 'sales', 
      explanation: "New competitor might affect sales, but the connection isn't always direct",
      correctAnswer: 'speculative' as LinkStrength
    },
  ] as CausalEdge[],
};

const STRENGTH_INFO = {
  strong: {
    color: 'hsl(140, 70%, 50%)',
    label: 'Strong',
    description: 'Direct proven cause',
    example: 'Rain → Wet ground'
  },
  contributory: {
    color: 'hsl(45, 100%, 55%)',
    label: 'Contributory',
    description: 'One factor among many',
    example: 'Exercise → Weight loss'
  },
  speculative: {
    color: 'hsl(0, 85%, 60%)',
    label: 'Speculative',
    description: 'Uncertain connection',
    example: 'Full moon → Strange behavior'
  },
};

export const ReasoningSlowInfiniteRegressChallenge: React.FC<ReasoningSlowInfiniteRegressChallengeProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentEdgeIndex, setCurrentEdgeIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<LinkStrength[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);

  const currentEdge = SCENARIO.edges[currentEdgeIndex];
  const fromNode = SCENARIO.nodes.find(n => n.id === currentEdge?.from);
  const toNode = SCENARIO.nodes.find(n => n.id === currentEdge?.to);

  const handleClassify = useCallback((strength: LinkStrength) => {
    const newAnswers = [...userAnswers, strength];
    setUserAnswers(newAnswers);
    setShowFeedback(true);

    setTimeout(() => {
      setShowFeedback(false);
      if (currentEdgeIndex < SCENARIO.edges.length - 1) {
        setCurrentEdgeIndex(prev => prev + 1);
      } else {
        setPhase('summary');
      }
    }, 1500);
  }, [userAnswers, currentEdgeIndex]);

  const score = useMemo(() => {
    let correct = 0;
    userAnswers.forEach((answer, i) => {
      if (answer === SCENARIO.edges[i].correctAnswer) {
        correct++;
      }
    });
    return {
      correct,
      total: SCENARIO.edges.length,
      percentage: Math.round((correct / SCENARIO.edges.length) * 100)
    };
  }, [userAnswers]);

  const handleComplete = useCallback(() => {
    onComplete({
      score: score.percentage,
      correct: score.correct,
      avgReactionTime: 0,
      metadata: {
        totalQuestions: SCENARIO.edges.length,
        answers: userAnswers,
      },
    });
  }, [score, userAnswers, onComplete]);

  // Intro phase
  if (phase === 'intro') {
    return (
      <motion.div
        className="min-h-screen bg-background flex flex-col items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="text-center max-w-sm"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/20 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" className="text-amber-500">
              <circle cx="8" cy="16" r="4" fill="currentColor" />
              <circle cx="24" cy="16" r="4" fill="currentColor" />
              <path d="M12 16 L17 16" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrow)" />
              <defs>
                <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" />
                </marker>
              </defs>
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-3">Causal Reasoning</h2>
          <p className="text-muted-foreground mb-2">Critical Reasoning • Slow Thinking</p>
          <p className="text-sm text-muted-foreground mb-8">
            Analyze cause-and-effect relationships. Judge how strongly one factor causes another.
          </p>
          <motion.button
            className="w-full py-4 bg-amber-500 text-black rounded-xl font-medium"
            whileTap={{ scale: 0.98 }}
            onClick={() => setPhase('demo')}
          >
            See How It Works
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  // Demo phase - explain the three link types with interactive example
  if (phase === 'demo') {
    return (
      <motion.div
        className="min-h-screen bg-background flex flex-col items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="text-center max-w-sm w-full"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h3 className="text-lg font-medium text-foreground mb-4">How to Rate Causal Links</h3>
          
          <p className="text-sm text-muted-foreground mb-6">
            You'll see a diagram showing factors that might have caused a problem. 
            For each arrow, decide how strongly A causes B.
          </p>
          
          {/* Visual example */}
          <div className="bg-card border border-border rounded-xl p-4 mb-4">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="px-3 py-2 bg-muted rounded-lg text-sm font-medium">Rain</div>
              <svg width="40" height="20" viewBox="0 0 40 20">
                <line x1="0" y1="10" x2="30" y2="10" stroke="hsl(var(--foreground))" strokeWidth="2"/>
                <polygon points="30,5 40,10 30,15" fill="hsl(var(--foreground))"/>
              </svg>
              <div className="px-3 py-2 bg-muted rounded-lg text-sm font-medium">Wet Ground</div>
            </div>
            <p className="text-xs text-muted-foreground">
              This is a <strong className="text-green-500">Strong</strong> link — rain directly causes wet ground.
            </p>
          </div>
          
          {/* Three categories */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-green-500"/>
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-green-500">Strong</p>
                <p className="text-xs text-muted-foreground">Direct, proven cause. A always leads to B.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-yellow-500"/>
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-yellow-500">Contributory</p>
                <p className="text-xs text-muted-foreground">One factor among many. A helps cause B.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-red-500"/>
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-red-500">Speculative</p>
                <p className="text-xs text-muted-foreground">Uncertain or weak. Maybe A causes B, maybe not.</p>
              </div>
            </div>
          </div>
          
          <motion.button
            className="w-full py-4 bg-amber-500 text-black rounded-xl font-medium"
            whileTap={{ scale: 0.98 }}
            onClick={() => setPhase('classify')}
          >
            Start Exercise
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  // Classify phase
  if (phase === 'classify' && currentEdge) {
    const isCorrect = showFeedback && userAnswers[userAnswers.length - 1] === currentEdge.correctAnswer;
    
    // Pure white/yellow highlight for current link - NOT green
    const highlightColor = '#ffffff';
    
    return (
      <div className="min-h-screen bg-background flex flex-col p-4">
        {/* Header */}
        <div className="text-center mb-4">
          <p className="text-xs text-muted-foreground mb-1">
            Question {currentEdgeIndex + 1} of {SCENARIO.edges.length}
          </p>
          <h3 className="text-lg font-medium text-foreground">{SCENARIO.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{SCENARIO.story}</p>
        </div>
        
        {/* Graph visualization */}
        <div className="flex-1 relative bg-card rounded-2xl border border-border overflow-hidden mb-4">
          <svg width="100%" height="280" viewBox="0 0 300 280">
            {/* Draw all edges - NO markers, arrows drawn manually */}
            {SCENARIO.edges.map((edge, i) => {
              const from = SCENARIO.nodes.find(n => n.id === edge.from)!;
              const to = SCENARIO.nodes.find(n => n.id === edge.to)!;
              const isCurrent = i === currentEdgeIndex;
              const isAnswered = i < currentEdgeIndex;
              const answer = userAnswers[i];
              
              // Calculate direction
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const nodeRadius = 32;
              const arrowGap = 8; // Gap before arrow tip
              
              // Normalize direction
              const nx = dx / length;
              const ny = dy / length;
              
              // Start point: edge of from circle
              const startX = from.x + nx * nodeRadius;
              const startY = from.y + ny * nodeRadius;
              
              // End point: BEFORE the circle edge (with gap for arrow)
              const endX = to.x - nx * (nodeRadius + arrowGap);
              const endY = to.y - ny * (nodeRadius + arrowGap);
              
              // Arrow head points (triangle pointing toward target)
              const arrowSize = 8;
              const arrowTipX = to.x - nx * nodeRadius;
              const arrowTipY = to.y - ny * nodeRadius;
              const arrowBackX = arrowTipX - nx * arrowSize;
              const arrowBackY = arrowTipY - ny * arrowSize;
              
              // Perpendicular for arrow wings
              const perpX = -ny * (arrowSize * 0.6);
              const perpY = nx * (arrowSize * 0.6);
              
              const arrowColor = isAnswered 
                ? STRENGTH_INFO[answer].color 
                : isCurrent 
                  ? highlightColor
                  : 'hsl(var(--muted-foreground))';
              
              const opacity = isAnswered ? 0.7 : isCurrent ? 1 : 0.3;
              
              return (
                <g key={`edge-${i}`} opacity={opacity}>
                  {/* Line */}
                  <line
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke={arrowColor}
                    strokeWidth={isCurrent ? 3 : 2}
                  />
                  {/* Arrow head as polygon */}
                  <polygon
                    points={`${arrowTipX},${arrowTipY} ${arrowBackX + perpX},${arrowBackY + perpY} ${arrowBackX - perpX},${arrowBackY - perpY}`}
                    fill={arrowColor}
                  />
                </g>
              );
            })}
            
            {/* Draw all nodes */}
            {SCENARIO.nodes.map((node) => {
              const isFromNode = currentEdge.from === node.id;
              const isToNode = currentEdge.to === node.id;
              const isHighlighted = isFromNode || isToNode;
              
              return (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="30"
                    fill="hsl(var(--card))"
                    stroke={isHighlighted ? highlightColor : 'hsl(var(--border))'}
                    strokeWidth={isHighlighted ? 2 : 1}
                    opacity={isHighlighted ? 1 : 0.6}
                  />
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isHighlighted ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'}
                    fontSize="10"
                    fontWeight={isHighlighted ? "600" : "500"}
                  >
                    {node.label.split(' ').map((word, i) => (
                      <tspan key={i} x={node.x} dy={i === 0 ? -5 : 12}>{word}</tspan>
                    ))}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        
        {/* Current question */}
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="font-semibold text-foreground">{fromNode?.label}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-semibold text-foreground">{toNode?.label}</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            How strongly does this cause the next?
          </p>
        </div>
        
        {/* Feedback or classification buttons */}
        {showFeedback ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 rounded-xl text-center ${isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'}`}
          >
            <p className={`font-medium ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
              {isCorrect ? '✓ Correct!' : `✗ Answer: ${STRENGTH_INFO[currentEdge.correctAnswer].label}`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {currentEdge.explanation}
            </p>
          </motion.div>
        ) : (
          <div className="flex gap-2">
            {(Object.entries(STRENGTH_INFO) as [LinkStrength, typeof STRENGTH_INFO.strong][]).map(([key, info]) => (
              <motion.button
                key={key}
                className="flex-1 py-3 rounded-xl font-medium text-sm flex flex-col items-center gap-1"
                style={{ 
                  backgroundColor: `${info.color}20`,
                  color: info.color,
                  border: `1px solid ${info.color}40`,
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleClassify(key)}
              >
                <span className="font-semibold">{info.label}</span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Summary phase
  return (
    <motion.div
      className="min-h-screen bg-background flex flex-col items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="text-center max-w-sm"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
          <span className="text-3xl font-bold text-amber-500">{score.correct}/{score.total}</span>
        </div>
        
        <h3 className="text-2xl font-semibold text-foreground mb-2">
          {score.percentage >= 75 ? 'Excellent!' : score.percentage >= 50 ? 'Good effort!' : 'Keep practicing!'}
        </h3>
        
        <p className="text-muted-foreground mb-6">
          You correctly identified {score.correct} out of {score.total} causal relationships.
        </p>
        
        {/* Review answers */}
        <div className="space-y-2 mb-6">
          {SCENARIO.edges.map((edge, i) => {
            const from = SCENARIO.nodes.find(n => n.id === edge.from);
            const to = SCENARIO.nodes.find(n => n.id === edge.to);
            const userAnswer = userAnswers[i];
            const isCorrect = userAnswer === edge.correctAnswer;
            
            return (
              <div 
                key={i}
                className={`text-xs p-2 rounded-lg ${isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'}`}
              >
                <span className="text-muted-foreground">{from?.label} → {to?.label}:</span>
                <span 
                  className="ml-1"
                  style={{ color: STRENGTH_INFO[userAnswer].color }}
                >
                  {STRENGTH_INFO[userAnswer].label}
                </span>
                {!isCorrect && (
                  <span className="text-muted-foreground">
                    {' '}(correct: {STRENGTH_INFO[edge.correctAnswer].label})
                  </span>
                )}
              </div>
            );
          })}
        </div>
        
        <motion.button
          className="w-full py-4 bg-amber-500 text-black rounded-xl font-medium"
          whileTap={{ scale: 0.98 }}
          onClick={handleComplete}
        >
          Continue
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default ReasoningSlowInfiniteRegressChallenge;
