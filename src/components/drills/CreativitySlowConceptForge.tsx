import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DrillResult {
  score: number;
  correct: number;
  avgReactionTime: number;
  metadata?: Record<string, any>;
}

interface CreativitySlowConceptForgeProps {
  onComplete: (result: DrillResult) => void;
}

type Phase = 'intro' | 'demo' | 'select' | 'structure' | 'projection' | 'complete';
type Concept = 'emergence' | 'constraint' | 'flow' | 'tension' | 'equilibrium' | 'entropy';
type Structure = 'linear' | 'hierarchical' | 'cyclic' | 'fractal' | 'networked' | 'chaotic';

interface ConceptPair {
  concepts: [Concept, Concept];
  idealStructure: Structure;
  projections: { id: string; text: string; match: boolean }[];
}

const CONCEPTS: { id: Concept; label: string; description: string }[] = [
  { id: 'emergence', label: 'Emergence', description: 'Complex patterns arising from simple rules' },
  { id: 'constraint', label: 'Constraint', description: 'Boundaries that shape possibilities' },
  { id: 'flow', label: 'Flow', description: 'Continuous movement and transformation' },
  { id: 'tension', label: 'Tension', description: 'Forces pulling in opposing directions' },
  { id: 'equilibrium', label: 'Equilibrium', description: 'Balance between competing forces' },
  { id: 'entropy', label: 'Entropy', description: 'Natural tendency toward disorder' },
];

const STRUCTURES: { id: Structure; label: string; icon: JSX.Element }[] = [
  { 
    id: 'linear', 
    label: 'Linear',
    icon: <svg width="32" height="32" viewBox="0 0 32 32"><line x1="4" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth="2" /><circle cx="4" cy="16" r="3" fill="currentColor" /><circle cx="28" cy="16" r="3" fill="currentColor" /></svg>
  },
  { 
    id: 'hierarchical', 
    label: 'Hierarchical',
    icon: <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="6" r="3" fill="currentColor" /><circle cx="8" cy="20" r="3" fill="currentColor" /><circle cx="24" cy="20" r="3" fill="currentColor" /><line x1="16" y1="9" x2="8" y2="17" stroke="currentColor" strokeWidth="2" /><line x1="16" y1="9" x2="24" y2="17" stroke="currentColor" strokeWidth="2" /></svg>
  },
  { 
    id: 'cyclic', 
    label: 'Cyclic',
    icon: <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="10" fill="none" stroke="currentColor" strokeWidth="2" /><polygon points="26,16 22,12 22,20" fill="currentColor" /></svg>
  },
  { 
    id: 'fractal', 
    label: 'Fractal',
    icon: <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="8" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="16" cy="16" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" /><circle cx="16" cy="16" r="2" fill="currentColor" /></svg>
  },
  { 
    id: 'networked', 
    label: 'Networked',
    icon: <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="8" r="3" fill="currentColor" /><circle cx="8" cy="24" r="3" fill="currentColor" /><circle cx="24" cy="24" r="3" fill="currentColor" /><line x1="16" y1="11" x2="8" y2="21" stroke="currentColor" strokeWidth="1.5" /><line x1="16" y1="11" x2="24" y2="21" stroke="currentColor" strokeWidth="1.5" /><line x1="11" y1="24" x2="21" y2="24" stroke="currentColor" strokeWidth="1.5" /></svg>
  },
  { 
    id: 'chaotic', 
    label: 'Chaotic',
    icon: <svg width="32" height="32" viewBox="0 0 32 32"><path d="M8,8 Q16,4 24,12 Q28,20 20,24 Q12,28 8,20 Q4,12 12,8" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
  },
];

// Pre-defined concept pair mappings
const CONCEPT_PAIR_DATA: Record<string, { structure: Structure; projections: { id: string; text: string; match: boolean }[] }> = {
  'flow-constraint': {
    structure: 'cyclic',
    projections: [
      { id: 'p1', text: 'Creative discipline system', match: true },
      { id: 'p2', text: 'Adaptive bottleneck model', match: true },
      { id: 'p3', text: 'Static control framework', match: false },
    ],
  },
  'emergence-entropy': {
    structure: 'chaotic',
    projections: [
      { id: 'p1', text: 'Self-organizing decay pattern', match: true },
      { id: 'p2', text: 'Rigid maintenance protocol', match: false },
      { id: 'p3', text: 'Evolutionary disruption model', match: true },
    ],
  },
  'tension-equilibrium': {
    structure: 'cyclic',
    projections: [
      { id: 'p1', text: 'Dynamic stability framework', match: true },
      { id: 'p2', text: 'Linear resolution process', match: false },
      { id: 'p3', text: 'Oscillating balance system', match: true },
    ],
  },
  'constraint-emergence': {
    structure: 'fractal',
    projections: [
      { id: 'p1', text: 'Bounded complexity generator', match: true },
      { id: 'p2', text: 'Free-form evolution model', match: false },
      { id: 'p3', text: 'Rule-based pattern emergence', match: true },
    ],
  },
};

export const CreativitySlowConceptForge: React.FC<CreativitySlowConceptForgeProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<Phase>('intro');
  const [selectedConcepts, setSelectedConcepts] = useState<Concept[]>([]);
  const [selectedStructure, setSelectedStructure] = useState<Structure | null>(null);
  const [selectedProjection, setSelectedProjection] = useState<string | null>(null);
  const [forgeAnimation, setForgeAnimation] = useState(false);

  const conceptPairKey = useMemo(() => {
    if (selectedConcepts.length !== 2) return null;
    const sorted = [...selectedConcepts].sort();
    return `${sorted[0]}-${sorted[1]}`;
  }, [selectedConcepts]);

  const pairData = useMemo(() => {
    if (!conceptPairKey) return null;
    return CONCEPT_PAIR_DATA[conceptPairKey] || {
      structure: 'networked' as Structure,
      projections: [
        { id: 'p1', text: 'Integrated synthesis model', match: true },
        { id: 'p2', text: 'Isolated component framework', match: false },
        { id: 'p3', text: 'Adaptive fusion system', match: true },
      ],
    };
  }, [conceptPairKey]);

  const handleConceptSelect = useCallback((concept: Concept) => {
    setSelectedConcepts(prev => {
      if (prev.includes(concept)) {
        return prev.filter(c => c !== concept);
      }
      if (prev.length >= 2) {
        return [prev[1], concept];
      }
      return [...prev, concept];
    });
  }, []);

  const handleStructureSelect = useCallback((structure: Structure) => {
    setSelectedStructure(structure);
    setForgeAnimation(true);
    setTimeout(() => {
      setForgeAnimation(false);
      setPhase('projection');
    }, 1500);
  }, []);

  const handleProjectionSelect = useCallback((projectionId: string) => {
    setSelectedProjection(projectionId);
    
    setTimeout(() => {
      const structureCorrect = pairData?.structure === selectedStructure;
      const projection = pairData?.projections.find(p => p.id === projectionId);
      const projectionCorrect = projection?.match || false;
      
      const structuralCoherence = structureCorrect ? 50 : 20;
      const projectionAlignment = projectionCorrect ? 50 : 15;
      const score = structuralCoherence + projectionAlignment;
      
      onComplete({
        score,
        correct: (structureCorrect ? 1 : 0) + (projectionCorrect ? 1 : 0),
        avgReactionTime: 0,
        metadata: {
          concepts: selectedConcepts,
          structure: selectedStructure,
          structureCorrect,
          projectionCorrect,
        },
      });
    }, 500);
  }, [selectedStructure, pairData, selectedConcepts, onComplete]);

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
          <motion.div 
            className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-purple-500/20 flex items-center justify-center"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" className="text-purple-400">
              <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="16" cy="16" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="16" cy="16" r="2" fill="currentColor" />
            </svg>
          </motion.div>
          <h2 className="text-2xl font-semibold text-foreground mb-3">Concept Forge</h2>
          <p className="text-muted-foreground mb-2">Creativity Hub • Slow Thinking</p>
          <p className="text-sm text-muted-foreground mb-8">
            Combine abstract concepts into coherent structures. Select two concepts, 
            choose their interaction pattern, then project them into practice.
          </p>
          <motion.button
            className="w-full py-4 bg-purple-500 text-white rounded-xl font-medium"
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
          
          {/* Step 1: Concepts */}
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Step 1: Select two concepts</p>
            <div className="flex justify-center gap-2">
              <motion.div 
                className="px-3 py-2 bg-purple-500/20 border border-purple-500 rounded-lg text-purple-400 text-sm"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Flow
              </motion.div>
              <motion.div 
                className="px-3 py-2 bg-purple-500/20 border border-purple-500 rounded-lg text-purple-400 text-sm"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Constraint
              </motion.div>
            </div>
          </div>
          
          {/* Step 2: Structure */}
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Step 2: Choose interaction pattern</p>
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500 rounded-lg"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <svg width="24" height="24" viewBox="0 0 32 32" className="text-purple-400">
                <circle cx="16" cy="16" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                <polygon points="26,16 22,12 22,20" fill="currentColor" />
              </svg>
              <span className="text-purple-400 text-sm">Cyclic</span>
            </motion.div>
          </div>
          
          {/* Step 3: Projection */}
          <div className="mb-6">
            <p className="text-xs text-muted-foreground mb-2">Step 3: Project to practice</p>
            <motion.div 
              className="px-4 py-3 bg-green-500/20 border border-green-500 rounded-lg text-green-400 text-sm"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              "Creative discipline system" ✓
            </motion.div>
          </div>
          
          <p className="text-xs text-muted-foreground mb-6">
            Combine concepts → Choose structure → Select best practical application.
          </p>
          
          <motion.button
            className="w-full py-4 bg-purple-500 text-white rounded-xl font-medium"
            whileTap={{ scale: 0.98 }}
            onClick={() => setPhase('select')}
          >
            Start Exercise
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  if (phase === 'select') {
    return (
      <div className="min-h-screen bg-background flex flex-col p-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium text-foreground">Select Two Concepts</h3>
          <p className="text-sm text-muted-foreground">Choose concepts to forge together</p>
        </div>
        
        <div className="flex-1 grid grid-cols-2 gap-3 content-start">
          {CONCEPTS.map((concept) => {
            const isSelected = selectedConcepts.includes(concept.id);
            const index = selectedConcepts.indexOf(concept.id);
            
            return (
              <motion.button
                key={concept.id}
                className={`relative p-4 rounded-xl text-left transition-all ${
                  isSelected
                    ? 'bg-purple-500/20 border-2 border-purple-500'
                    : 'bg-card border border-border hover:border-purple-500/50'
                }`}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleConceptSelect(concept.id)}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                )}
                <h4 className="font-medium text-foreground mb-1">{concept.label}</h4>
                <p className="text-xs text-muted-foreground">{concept.description}</p>
              </motion.button>
            );
          })}
        </div>
        
        <motion.button
          className={`mt-4 w-full py-4 rounded-xl font-medium ${
            selectedConcepts.length === 2
              ? 'bg-purple-500 text-white'
              : 'bg-muted text-muted-foreground'
          }`}
          whileTap={{ scale: selectedConcepts.length === 2 ? 0.98 : 1 }}
          onClick={() => selectedConcepts.length === 2 && setPhase('structure')}
          disabled={selectedConcepts.length !== 2}
        >
          {selectedConcepts.length === 2 ? 'Proceed to Structure' : `Select ${2 - selectedConcepts.length} more`}
        </motion.button>
      </div>
    );
  }

  if (phase === 'structure') {
    return (
      <div className="min-h-screen bg-background flex flex-col p-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium text-foreground">Choose Structure</h3>
          <p className="text-sm text-muted-foreground">
            How do <span className="text-purple-400">{CONCEPTS.find(c => c.id === selectedConcepts[0])?.label}</span> and{' '}
            <span className="text-purple-400">{CONCEPTS.find(c => c.id === selectedConcepts[1])?.label}</span> interact?
          </p>
        </div>
        
        {/* Forge animation */}
        <AnimatePresence>
          {forgeAnimation && (
            <motion.div
              className="absolute inset-0 z-50 bg-background/90 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-32 h-32 rounded-full border-4 border-purple-500"
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.2, 1],
                  borderColor: ['hsl(270, 70%, 60%)', 'hsl(200, 70%, 60%)', 'hsl(270, 70%, 60%)'],
                }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              >
                <motion.div
                  className="w-full h-full flex items-center justify-center"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                >
                  <span className="text-purple-400 text-4xl">⚗️</span>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex-1 grid grid-cols-3 gap-3 content-start">
          {STRUCTURES.map((structure) => (
            <motion.button
              key={structure.id}
              className={`aspect-square p-3 rounded-xl flex flex-col items-center justify-center transition-all ${
                selectedStructure === structure.id
                  ? 'bg-purple-500/20 border-2 border-purple-500'
                  : 'bg-card border border-border hover:border-purple-500/50'
              }`}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleStructureSelect(structure.id)}
            >
              <div className="text-foreground mb-2">{structure.icon}</div>
              <span className="text-xs text-muted-foreground">{structure.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'projection') {
    return (
      <div className="min-h-screen bg-background flex flex-col p-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium text-foreground">Project to Practice</h3>
          <p className="text-sm text-muted-foreground">
            Which application best represents your forged concept?
          </p>
        </div>
        
        {/* Visual representation */}
        <div className="mb-6 flex justify-center items-center gap-4">
          <div className="px-3 py-2 bg-purple-500/20 rounded-lg text-purple-400 text-sm">
            {CONCEPTS.find(c => c.id === selectedConcepts[0])?.label}
          </div>
          <div className="text-foreground">
            {STRUCTURES.find(s => s.id === selectedStructure)?.icon}
          </div>
          <div className="px-3 py-2 bg-purple-500/20 rounded-lg text-purple-400 text-sm">
            {CONCEPTS.find(c => c.id === selectedConcepts[1])?.label}
          </div>
        </div>
        
        <div className="flex-1 space-y-3">
          {pairData?.projections.map((projection) => (
            <motion.button
              key={projection.id}
              className={`w-full p-4 rounded-xl text-left transition-all ${
                selectedProjection === projection.id
                  ? projection.match
                    ? 'bg-green-500/20 border-2 border-green-500'
                    : 'bg-red-500/20 border-2 border-red-500'
                  : 'bg-card border border-border hover:border-purple-500/50'
              }`}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleProjectionSelect(projection.id)}
              disabled={selectedProjection !== null}
            >
              <p className="text-foreground">{projection.text}</p>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default CreativitySlowConceptForge;
