export type ProtocolType = "stress" | "clarity" | "decision";
export type DurationOption = "30s" | "2min" | "5min";
export type FeelingOption = "stressed" | "distracted" | "calm" | "clear" | "overloaded";

export interface ProtocolStep {
  title: string;
  description: string;
  durationSeconds: number;
}

export interface Protocol {
  id: string;
  type: ProtocolType;
  durationOption: DurationOption;
  title: string;
  description: string;
  steps: ProtocolStep[];
}

export const protocols: Protocol[] = [
  // Stress Protocols
  {
    id: "stress-30s",
    type: "stress",
    durationOption: "30s",
    title: "Rapid Stress Reset",
    description: "A quick cognitive reset to break the stress loop and regain composure.",
    steps: [
      {
        title: "Reset Cognitive Noise",
        description: "Close your eyes. For 5 seconds, imagine placing all your thoughts into a box and closing it.",
        durationSeconds: 8,
      },
      {
        title: "Box Breathing",
        description: "Inhale for 4 counts, hold for 4, exhale for 4, hold for 4. One complete cycle.",
        durationSeconds: 16,
      },
      {
        title: "Defuse from Stress",
        description: "Silently repeat: 'I am not my stress. I am the one choosing my next move.'",
        durationSeconds: 6,
      },
    ],
  },
  {
    id: "stress-2min",
    type: "stress",
    durationOption: "2min",
    title: "Deep Stress Release",
    description: "A comprehensive stress reduction protocol using breathing and cognitive reframing.",
    steps: [
      {
        title: "Acknowledge & Release",
        description: "Notice where you feel stress in your body. Acknowledge it without judgment, then consciously release tension.",
        durationSeconds: 20,
      },
      {
        title: "Extended Box Breathing",
        description: "Perform 3 cycles of box breathing: Inhale 4, hold 4, exhale 4, hold 4.",
        durationSeconds: 50,
      },
      {
        title: "Cognitive Distancing",
        description: "Ask yourself: 'Will this matter in 5 years?' Let the answer create perspective.",
        durationSeconds: 20,
      },
      {
        title: "Future Self Visualization",
        description: "Visualize yourself 1 hour from now, calm and composed, having handled this situation well.",
        durationSeconds: 30,
      },
    ],
  },
  {
    id: "stress-5min",
    type: "stress",
    durationOption: "5min",
    title: "Complete Stress Reset",
    description: "The full stress protocol for when you need a complete mental reset before critical work.",
    steps: [
      {
        title: "Body Scan",
        description: "Scan from head to toe. Notice any tension. Don't fix it yet, just observe.",
        durationSeconds: 45,
      },
      {
        title: "Progressive Release",
        description: "Starting with your shoulders, consciously relax each area of tension you identified.",
        durationSeconds: 45,
      },
      {
        title: "Breathing Ladder",
        description: "5 cycles of increasing breath: 4-4-4-4, then 5-5-5-5, then 6-6-6-6.",
        durationSeconds: 90,
      },
      {
        title: "Thought Defusion",
        description: "Label your stress thoughts as 'just thoughts' – not facts, not predictions, just mental events.",
        durationSeconds: 40,
      },
      {
        title: "Anchor Statement",
        description: "Create one sentence that defines how you want to show up. Repeat it 3 times.",
        durationSeconds: 40,
      },
      {
        title: "Return to Now",
        description: "Open your eyes. Name 5 things you can see. You are present. You are ready.",
        durationSeconds: 40,
      },
    ],
  },

  // Clarity Protocols
  {
    id: "clarity-30s",
    type: "clarity",
    durationOption: "30s",
    title: "Instant Focus Lock",
    description: "Rapidly eliminate mental fog and lock into your next task with precision.",
    steps: [
      {
        title: "Clear the Desktop",
        description: "Take 3 deep breaths. With each exhale, imagine closing unnecessary 'mental tabs'.",
        durationSeconds: 10,
      },
      {
        title: "Single Task Declaration",
        description: "State out loud or in your mind: 'For the next [X] minutes, I will only [specific task].'",
        durationSeconds: 10,
      },
      {
        title: "First Action",
        description: "Identify the literal first physical action you need to take. Be specific.",
        durationSeconds: 10,
      },
    ],
  },
  {
    id: "clarity-2min",
    type: "clarity",
    durationOption: "2min",
    title: "Pre-Performance Clarity",
    description: "Optimize your mental state before high-stakes work, meetings, or deep focus sessions.",
    steps: [
      {
        title: "Attention Lock-in",
        description: "Focus on a single point for 20 seconds. When your mind wanders, gently return. This trains focus.",
        durationSeconds: 25,
      },
      {
        title: "Inhibitory Control",
        description: "Think of 3 distractions you typically face. Consciously decide to block them for the next hour.",
        durationSeconds: 25,
      },
      {
        title: "Outcome Definition",
        description: "Define ONE clear outcome for the next 30-60 minutes. Write it down if possible.",
        durationSeconds: 25,
      },
      {
        title: "Energy Check",
        description: "Rate your energy 1-10. If below 6, stand up, take 5 deep breaths, and shake your body briefly.",
        durationSeconds: 25,
      },
      {
        title: "Commitment Statement",
        description: "Say: 'I choose to give this my full attention because [your reason].'",
        durationSeconds: 20,
      },
    ],
  },
  {
    id: "clarity-5min",
    type: "clarity",
    durationOption: "5min",
    title: "Deep Work Initiation",
    description: "The complete pre-work ritual for maximum cognitive performance and sustained focus.",
    steps: [
      {
        title: "Environment Audit",
        description: "Look around. Remove, hide, or silence anything that might distract you.",
        durationSeconds: 40,
      },
      {
        title: "Mental Warmup",
        description: "Do a quick mental math: count backward from 100 by 7s (100, 93, 86...). This activates working memory.",
        durationSeconds: 40,
      },
      {
        title: "Priority Clarification",
        description: "What is the ONE thing that would make everything else easier or unnecessary right now?",
        durationSeconds: 50,
      },
      {
        title: "Success Visualization",
        description: "Imagine completing this work session successfully. How does it feel? What did you accomplish?",
        durationSeconds: 45,
      },
      {
        title: "Implementation Intention",
        description: "Complete: 'When [obstacle] happens, I will [specific response].' Prepare for common interruptions.",
        durationSeconds: 45,
      },
      {
        title: "Begin State",
        description: "Take 3 final breaths. On the last exhale, begin your first action immediately.",
        durationSeconds: 40,
      },
    ],
  },

  // Decision Protocols
  {
    id: "decision-30s",
    type: "decision",
    durationOption: "30s",
    title: "Quick Decision Check",
    description: "Cut through decision paralysis with a rapid assessment framework.",
    steps: [
      {
        title: "Name the Decision",
        description: "State the decision in one clear sentence. If you can't, you don't understand it yet.",
        durationSeconds: 10,
      },
      {
        title: "Reversibility Check",
        description: "Is this reversible? If yes, decide faster. If no, proceed to gather more info.",
        durationSeconds: 10,
      },
      {
        title: "10/10/10 Rule",
        description: "How will you feel about this in 10 minutes? 10 months? 10 years? Decide accordingly.",
        durationSeconds: 10,
      },
    ],
  },
  {
    id: "decision-2min",
    type: "decision",
    durationOption: "2min",
    title: "Decision Pro Framework",
    description: "A structured approach to making better decisions under pressure.",
    steps: [
      {
        title: "Frame the Decision",
        description: "What are you actually deciding? Strip away the noise. One sentence.",
        durationSeconds: 20,
      },
      {
        title: "Bias Check",
        description: "Am I overreacting to short-term emotion? Am I avoiding loss more than seeking gain?",
        durationSeconds: 25,
      },
      {
        title: "Expected Value",
        description: "Best case outcome? Worst case? Most likely? What are the odds of each?",
        durationSeconds: 35,
      },
      {
        title: "Information Audit",
        description: "What information would change your decision? Can you get it quickly?",
        durationSeconds: 20,
      },
      {
        title: "Decide or Defer",
        description: "Choose: Decide now, Delay with deadline, or Gather specific information.",
        durationSeconds: 20,
      },
    ],
  },
  {
    id: "decision-5min",
    type: "decision",
    durationOption: "5min",
    title: "Strategic Decision Deep Dive",
    description: "The complete decision-making protocol for high-stakes choices that matter.",
    steps: [
      {
        title: "Decision Statement",
        description: "Write the decision as a clear yes/no or A/B choice. Ambiguous framing leads to poor decisions.",
        durationSeconds: 40,
      },
      {
        title: "Stakeholder Analysis",
        description: "Who is affected? What would your mentor/hero do? What would you advise a friend?",
        durationSeconds: 45,
      },
      {
        title: "Pre-mortem",
        description: "Assume you chose Option A and it failed spectacularly. Why did it fail?",
        durationSeconds: 50,
      },
      {
        title: "Counter Pre-mortem",
        description: "Now assume Option B failed. What went wrong? Compare failure modes.",
        durationSeconds: 45,
      },
      {
        title: "Opportunity Cost",
        description: "What are you saying no to by saying yes to this? Is that acceptable?",
        durationSeconds: 40,
      },
      {
        title: "Commitment Check",
        description: "Are you ready to fully commit to one path? If not, what's holding you back?",
        durationSeconds: 40,
      },
      {
        title: "Final Decision",
        description: "State your decision out loud. Set your first action. Begin.",
        durationSeconds: 40,
      },
    ],
  },
];

export function getProtocol(type: ProtocolType, duration: DurationOption): Protocol | undefined {
  return protocols.find((p) => p.type === type && p.durationOption === duration);
}

export const feelingOptions: { value: FeelingOption; label: string; emoji: string }[] = [
  { value: "stressed", label: "Stressed", emoji: "😰" },
  { value: "distracted", label: "Distracted", emoji: "🤯" },
  { value: "calm", label: "Calm", emoji: "😌" },
  { value: "clear", label: "Clear", emoji: "🎯" },
  { value: "overloaded", label: "Overloaded", emoji: "😵" },
];

export const durationOptions: { value: DurationOption; label: string; minutes: string }[] = [
  { value: "30s", label: "30 Seconds", minutes: "0:30" },
  { value: "2min", label: "2 Minutes", minutes: "2:00" },
  { value: "5min", label: "5 Minutes", minutes: "5:00" },
];
