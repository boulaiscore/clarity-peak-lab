import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
type Phase = 'intro' | 'demo' | 'build' | 'classify' | 'detect' | 'summary';

interface CausalNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface CausalEdge {
  from: string;
  to: string;
  strength: 'solid' | 'dashed' | 'dotted';
  userStrength?: LinkStrength;
  isCircular?: boolean;
}

interface Scenario {
  description: string;
  nodes: CausalNode[];
  edges: CausalEdge[];
  circularPaths: [string, string][];
  referenceModel: Record<string, LinkStrength>;
}

const SCENARIO: Scenario = {
  description: "A product team is analyzing why their conversion rate dropped.",
  nodes: [
    { id: 'A', label: 'New UI Design', x: 150, y: 50 },
    { id: 'B', label: 'Page Load Time', x: 80, y: 150 },
    { id: 'C', label: 'User Engagement', x: 220, y: 150 },
    { id: 'D', label: 'Server Costs', x: 50, y: 250 },
    { id: 'E', label: 'Conversion Rate', x: 150, y: 280 },
  ],
  edges: [
    { from: 'A', to: 'B', strength: 'solid' },
    { from: 'A', to: 'C', strength: 'dashed' },
    { from: 'B', to: 'C', strength: 'dashed' },
    { from: 'C', to: 'E', strength: 'solid' },
    { from: 'D', to: 'B', strength: 'dotted' },
    { from: 'E', to: 'D', strength: 'dotted' }, // Creates potential circular reasoning
  ],
  circularPaths: [['E', 'D'], ['D', 'B'], ['B', 'C'], ['C', 'E']],
  referenceModel: {
    'A-B': 'strong',
    'A-C': 'contributory',
    'B-C': 'contributory',
    'C-E': 'strong',
    'D-B': 'speculative',
    'E-D': 'speculative',
  },
};

const STRENGTH_COLORS: Record<LinkStrength, string> = {
  strong: 'hsl(140, 70%, 50%)',
  contributory: 'hsl(45, 100%, 55%)',
  speculative: 'hsl(0, 85%, 60%)',
};

export const ReasoningSlowInfiniteRegressChallenge: React.FC<ReasoningSlowInfiniteRegressChallengeProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<Phase>('intro');
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [edgeClassifications, setEdgeClassifications] = useState<Record<string, LinkStrength>>({});
  const [currentEdge, setCurrentEdge] = useState<CausalEdge | null>(null);
  const [detectedCircular, setDetectedCircular] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<string[]>([]);

  const scenario = SCENARIO;

  const handlePathSelect = useCallback((nodeId: string) => {
    setSelectedPath(prev => {
      if (prev.includes(nodeId)) {
        return prev.slice(0, prev.indexOf(nodeId) + 1);
      }
      return [...prev, nodeId];
    });
  }, []);

  const handleEdgeClassify = useCallback((strength: LinkStrength) => {
    if (!currentEdge) return;
    
    const edgeKey = `${currentEdge.from}-${currentEdge.to}`;
    setEdgeClassifications(prev => ({ ...prev, [edgeKey]: strength }));
    
    // Move to next unclassified edge
    const nextEdge = scenario.edges.find(e => {
      const key = `${e.from}-${e.to}`;
      return !edgeClassifications[key] && key !== edgeKey;
    });
    
    if (nextEdge) {
      setCurrentEdge(nextEdge);
    } else {
      setPhase('detect');
    }
  }, [currentEdge, edgeClassifications, scenario.edges]);

  const handleCircularDetect = useCallback((fromId: string, toId: string) => {
    const key = `${fromId}-${toId}`;
    setDetectedCircular(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }, []);

  const calculateScore = useMemo(() => {
    // Classification accuracy
    let classificationScore = 0;
    let totalEdges = Object.keys(scenario.referenceModel).length;
    
    Object.entries(edgeClassifications).forEach(([key, userStrength]) => {
      const reference = scenario.referenceModel[key];
      if (reference === userStrength) {
        classificationScore += 100 / totalEdges;
      } else if (
        (reference === 'strong' && userStrength === 'contributory') ||
        (reference === 'contributory' && userStrength === 'speculative')
      ) {
        classificationScore += 50 / totalEdges;
      }
    });
    
    // Circular detection accuracy
    const circularKeys = scenario.circularPaths.map(([a, b]) => `${a}-${b}`);
    const correctDetections = circularKeys.filter(k => detectedCircular.has(k)).length;
    const falseDetections = [...detectedCircular].filter(k => !circularKeys.includes(k)).length;
    const regressScore = ((correctDetections / circularKeys.length) * 100) - (falseDetections * 10);
    
    return {
      causalIntegrity: Math.round(classificationScore),
      regressDetection: Math.round(Math.max(0, regressScore)),
      total: Math.round((classificationScore * 0.6) + (Math.max(0, regressScore) * 0.4)),
    };
  }, [edgeClassifications, detectedCircular, scenario]);

  const handleComplete = useCallback(() => {
    const scores = calculateScore;
    
    // Generate feedback
    const feedbackItems: string[] = [];
    Object.entries(edgeClassifications).forEach(([key, userStrength]) => {
      const reference = scenario.referenceModel[key];
      if (reference !== userStrength) {
        const [from, to] = key.split('-');
        const fromNode = scenario.nodes.find(n => n.id === from);
        const toNode = scenario.nodes.find(n => n.id === to);
        feedbackItems.push(
          `${fromNode?.label} → ${toNode?.label}: marked as ${userStrength}, likely ${reference}`
        );
      }
    });
    setFeedback(feedbackItems);
    
    setPhase('summary');
    
    setTimeout(() => {
      onComplete({
        score: scores.total,
        correct: Object.entries(edgeClassifications).filter(
          ([key, value]) => scenario.referenceModel[key] === value
        ).length,
        avgReactionTime: 0,
        metadata: {
          causalIntegrity: scores.causalIntegrity,
          regressDetection: scores.regressDetection,
        },
      });
    }, 3000);
  }, [calculateScore, edgeClassifications, scenario, onComplete]);

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
              <circle cx="8" cy="8" r="4" fill="currentColor" />
              <circle cx="24" cy="8" r="4" fill="currentColor" />
              <circle cx="16" cy="24" r="4" fill="currentColor" />
              <line x1="10" y1="10" x2="14" y2="22" stroke="currentColor" strokeWidth="2" />
              <line x1="22" y1="10" x2="18" y2="22" stroke="currentColor" strokeWidth="2" />
              <line x1="12" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="2" strokeDasharray="4" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-3">Causal Analysis</h2>
          <p className="text-muted-foreground mb-2">Critical Reasoning • Slow Thinking</p>
          <p className="text-sm text-muted-foreground mb-8">
            Analyze causal relationships between factors. Classify link strengths and detect circular reasoning patterns.
          </p>
          <motion.button
            className="w-full py-4 bg-amber-500 text-black rounded-xl font-medium"
            whileTap={{ scale: 0.98 }}
            onClick={() => setPhase('demo')}
          >
            See Example
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

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
          <h3 className="text-lg font-medium text-foreground mb-4">Example</h3>
          
          {/* Demo causal chain */}
          <div className="bg-card border border-border rounded-xl p-4 mb-4">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="px-3 py-1 bg-muted rounded text-sm text-foreground">Price Cut</div>
              <span className="text-muted-foreground">→</span>
              <div className="px-3 py-1 bg-muted rounded text-sm text-foreground">More Sales</div>
            </div>
            <p className="text-xs text-muted-foreground">How strong is this link?</p>
          </div>
          
          {/* Demo classification */}
          <div className="flex gap-2 mb-6">
            <motion.div
              className="flex-1 py-2 rounded-lg text-center text-sm"
              style={{ backgroundColor: 'hsl(140, 70%, 50%, 0.2)', color: 'hsl(140, 70%, 50%)' }}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              Strong ✓
            </motion.div>
            <div className="flex-1 py-2 rounded-lg text-center text-sm bg-muted/30 text-muted-foreground">
              Contributory
            </div>
            <div className="flex-1 py-2 rounded-lg text-center text-sm bg-muted/30 text-muted-foreground">
              Speculative
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mb-6">
            <strong>Strong</strong> = proven direct cause. <strong>Contributory</strong> = one factor among many. <strong>Speculative</strong> = uncertain link.
          </p>
          
          <motion.button
            className="w-full py-4 bg-amber-500 text-black rounded-xl font-medium"
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setCurrentEdge(scenario.edges[0]);
              setPhase('classify');
            }}
          >
            Start Exercise
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  if (phase === 'classify') {
    return (
      <div className="min-h-screen bg-background flex flex-col p-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-medium text-foreground">Classify Relationships</h3>
          <p className="text-sm text-muted-foreground">{scenario.description}</p>
        </div>
        
        {/* Graph visualization */}
        <div className="flex-1 relative bg-card rounded-2xl border border-border overflow-hidden">
          <svg width="100%" height="300" viewBox="0 0 300 320">
            {/* Edges */}
            {scenario.edges.map((edge, i) => {
              const from = scenario.nodes.find(n => n.id === edge.from)!;
              const to = scenario.nodes.find(n => n.id === edge.to)!;
              const edgeKey = `${edge.from}-${edge.to}`;
              const classified = edgeClassifications[edgeKey];
              const isCurrent = currentEdge?.from === edge.from && currentEdge?.to === edge.to;
              
              return (
                <g key={`edge-${i}`}>
                  <motion.line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={classified ? STRENGTH_COLORS[classified] : isCurrent ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                    strokeWidth={isCurrent ? 3 : 2}
                    strokeDasharray={edge.strength === 'dashed' ? '8,4' : edge.strength === 'dotted' ? '2,4' : undefined}
                    animate={{ strokeWidth: isCurrent ? 3 : 2 }}
                  />
                  {/* Arrow */}
                  <polygon
                    points={`0,-5 10,0 0,5`}
                    fill={classified ? STRENGTH_COLORS[classified] : isCurrent ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                    transform={`translate(${to.x - (to.x - from.x) * 0.2}, ${to.y - (to.y - from.y) * 0.2}) rotate(${Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI})`}
                  />
                </g>
              );
            })}
            
            {/* Nodes */}
            {scenario.nodes.map((node) => (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="25"
                  fill="hsl(var(--card))"
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                />
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="hsl(var(--foreground))"
                  fontSize="10"
                  fontWeight="500"
                >
                  {node.id}
                </text>
                <text
                  x={node.x}
                  y={node.y + 40}
                  textAnchor="middle"
                  fill="hsl(var(--muted-foreground))"
                  fontSize="8"
                >
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
        
        {/* Current edge classification */}
        {currentEdge && (
          <div className="mt-4">
            <div className="text-center mb-4">
              <p className="text-foreground">
                <span className="font-medium">
                  {scenario.nodes.find(n => n.id === currentEdge.from)?.label}
                </span>
                {' → '}
                <span className="font-medium">
                  {scenario.nodes.find(n => n.id === currentEdge.to)?.label}
                </span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">How strong is this causal link?</p>
            </div>
            
            <div className="flex gap-2">
              {(['strong', 'contributory', 'speculative'] as LinkStrength[]).map((strength) => (
                <motion.button
                  key={strength}
                  className="flex-1 py-3 rounded-xl font-medium capitalize"
                  style={{ 
                    backgroundColor: `${STRENGTH_COLORS[strength]}20`,
                    color: STRENGTH_COLORS[strength],
                    border: `1px solid ${STRENGTH_COLORS[strength]}50`,
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleEdgeClassify(strength)}
                >
                  {strength}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'detect') {
    return (
      <div className="min-h-screen bg-background flex flex-col p-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-medium text-foreground">Detect Circular Reasoning</h3>
          <p className="text-sm text-muted-foreground">Tap edges that form circular or infinite regress patterns</p>
        </div>
        
        {/* Graph visualization */}
        <div className="flex-1 relative bg-card rounded-2xl border border-border overflow-hidden">
          <svg width="100%" height="300" viewBox="0 0 300 320">
            {scenario.edges.map((edge, i) => {
              const from = scenario.nodes.find(n => n.id === edge.from)!;
              const to = scenario.nodes.find(n => n.id === edge.to)!;
              const edgeKey = `${edge.from}-${edge.to}`;
              const isDetected = detectedCircular.has(edgeKey);
              
              return (
                <g 
                  key={`edge-${i}`} 
                  onClick={() => handleCircularDetect(edge.from, edge.to)}
                  className="cursor-pointer"
                >
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={isDetected ? 'hsl(0, 85%, 60%)' : 'hsl(var(--muted-foreground))'}
                    strokeWidth={isDetected ? 4 : 2}
                    strokeDasharray={edge.strength === 'dashed' ? '8,4' : edge.strength === 'dotted' ? '2,4' : undefined}
                  />
                  {isDetected && (
                    <motion.circle
                      cx={(from.x + to.x) / 2}
                      cy={(from.y + to.y) / 2}
                      r="8"
                      fill="hsl(0, 85%, 60%)"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <text fill="white" fontSize="10" textAnchor="middle" dominantBaseline="middle">!</text>
                    </motion.circle>
                  )}
                </g>
              );
            })}
            
            {scenario.nodes.map((node) => (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="25"
                  fill="hsl(var(--card))"
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                />
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="hsl(var(--foreground))"
                  fontSize="10"
                  fontWeight="500"
                >
                  {node.id}
                </text>
              </g>
            ))}
          </svg>
        </div>
        
        <div className="mt-4">
          <p className="text-center text-sm text-muted-foreground mb-4">
            Flagged: {detectedCircular.size} edges
          </p>
          <motion.button
            className="w-full py-4 bg-amber-500 text-black rounded-xl font-medium"
            whileTap={{ scale: 0.98 }}
            onClick={handleComplete}
          >
            Complete Analysis
          </motion.button>
        </div>
      </div>
    );
  }

  if (phase === 'summary') {
    return (
      <motion.div
        className="min-h-screen bg-background flex flex-col items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center max-w-sm">
          <h3 className="text-lg font-medium text-foreground mb-4">Analysis Complete</h3>
          
          <div className="space-y-3 mb-6">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground">Causal Integrity</p>
              <p className="text-2xl font-semibold text-foreground">{calculateScore.causalIntegrity}%</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground">Regress Detection</p>
              <p className="text-2xl font-semibold text-foreground">{calculateScore.regressDetection}%</p>
            </div>
          </div>
          
          {feedback.length > 0 && (
            <div className="text-left bg-muted/50 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-foreground mb-2">Feedback:</p>
              {feedback.slice(0, 2).map((f, i) => (
                <p key={i} className="text-xs text-muted-foreground mb-1">• {f}</p>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return null;
};

export default ReasoningSlowInfiniteRegressChallenge;
