-- Update thinking_mode for all visual exercises based on Kahneman's System 1/System 2 framework

-- FAST THINKING (System 1) - Automatic, intuitive, quick responses
-- Focus exercises - rapid reaction and pattern recognition
UPDATE public.cognitive_exercises SET thinking_mode = 'fast' WHERE id IN (
  'FOCUS_DOT_001', 'FOCUS_DOT_002', 'FOCUS_SEARCH_001', 'FOCUS_SEARCH_002', 'FOCUS_SHAPE_001'
);

-- Memory exercises - immediate recall, simple patterns
UPDATE public.cognitive_exercises SET thinking_mode = 'fast' WHERE id IN (
  'MEMORY_DIGIT_001', 'MEMORY_DIGIT_002', 'MEMORY_NBACK_001', 'MEMORY_LOC_001', 'MEMORY_MATRIX_001'
);

-- Control exercises - quick inhibition responses
UPDATE public.cognitive_exercises SET thinking_mode = 'fast' WHERE id IN (
  'CONTROL_GONO_001', 'CONTROL_GONO_002', 'CONTROL_STROOP_001', 'CONTROL_STROOP_002', 'CONTROL_RULE_001'
);

-- Reasoning exercises - quick pattern completion
UPDATE public.cognitive_exercises SET thinking_mode = 'fast' WHERE id IN (
  'REASON_SEQ_001', 'REASON_SEQ_002', 'REASON_ODD_001'
);

-- Creativity exercises - rapid categorization
UPDATE public.cognitive_exercises SET thinking_mode = 'fast' WHERE id IN (
  'CREATE_ODD_001', 'CREATE_ODD_002', 'CREATE_CAT_001'
);

-- SLOW THINKING (System 2) - Deliberate, analytical, effortful
-- Focus - extended deliberate search requiring sustained attention
UPDATE public.cognitive_exercises SET thinking_mode = 'slow' WHERE id = 'FOCUS_SEARCH_SLOW_001';

-- Memory - complex patterns requiring deliberate analysis
UPDATE public.cognitive_exercises SET thinking_mode = 'slow' WHERE id IN (
  'MEMORY_NBACK_002', 'MEMORY_PATTERN_001', 'MEMORY_MATRIX_002'
);

-- Control - complex rule switching requiring cognitive flexibility
UPDATE public.cognitive_exercises SET thinking_mode = 'slow' WHERE id IN (
  'CONTROL_CAT_001', 'CONTROL_RULE_002'
);

-- Reasoning - complex logical analysis and analogies
UPDATE public.cognitive_exercises SET thinking_mode = 'slow' WHERE id IN (
  'REASON_SEQ_003', 'REASON_ANALOG_001', 'REASON_ANALOG_002'
);

-- Creativity - word association and complex analogies requiring divergent thinking
UPDATE public.cognitive_exercises SET thinking_mode = 'slow' WHERE id IN (
  'CREATE_ANALOG_001', 'CREATE_WORD_001', 'CREATE_WORD_002'
);

-- Also update the old N-series exercises with appropriate thinking modes
UPDATE public.cognitive_exercises SET thinking_mode = 'fast' WHERE id IN (
  'N001', 'N004', 'N012', 'N015'
);

UPDATE public.cognitive_exercises SET thinking_mode = 'slow' WHERE id IN (
  'N002', 'N003', 'N005', 'N006', 'N007', 'N008', 'N009', 'N010', 'N011', 'N013', 'N014'
);