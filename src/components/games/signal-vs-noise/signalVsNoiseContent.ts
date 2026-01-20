/**
 * ============================================
 * SIGNAL VS NOISE - CONTENT BANK
 * ============================================
 * 
 * S2 Insight game training pattern detection
 * under uncertainty with executive-style data.
 * 
 * 30 cases covering:
 * - Product growth metrics
 * - Ops/quality metrics
 * - Hiring/team performance
 * - Personal productivity
 * - Learning outcomes
 * - Scientific inference
 */

// ============================================
// TYPES
// ============================================

export interface WhyOption {
  id: string;
  text: string;
  type: "mechanism" | "confound" | "irrelevant";
}

export interface SignalCase {
  id: string;
  domain: string;
  outcomeLabel: string;
  outcomeSeries: number[]; // 6 points, normalized 0-100
  drivers: {
    A: { label: string; series: number[] };
    B: { label: string; series: number[] };
    C: { label: string; series: number[] };
  };
  correctDriver: "A" | "B" | "C";
  whyOptions: WhyOption[];
  correctWhyId: string;
  contextTags: string[]; // 2 tempting but often irrelevant tags
  isRobustnessCase: boolean;
  robustnessCorrectAnswer?: "YES" | "NO"; // Would removing a point change the answer?
  insightCue: string; // For review screen, ≤90 chars
}

export type Difficulty = "easy" | "standard" | "hard";

export const DIFFICULTY_CONFIG: Record<Difficulty, { cases: number; timePerCase: number }> = {
  easy: { cases: 6, timePerCase: 75 },
  standard: { cases: 8, timePerCase: 60 },
  hard: { cases: 10, timePerCase: 50 },
};

export const XP_BASE: Record<Difficulty, number> = {
  easy: 18,
  standard: 22,
  hard: 26,
};

// ============================================
// CONTENT BANK (30 CASES)
// ============================================

export const CASES: SignalCase[] = [
  // ========== PRODUCT GROWTH (1-5) ==========
  {
    id: "prod-1",
    domain: "Product Growth",
    outcomeLabel: "Weekly Active Users",
    outcomeSeries: [45, 48, 52, 58, 67, 78],
    drivers: {
      A: { label: "Marketing Spend", series: [60, 62, 58, 55, 52, 50] },
      B: { label: "Feature Releases", series: [30, 35, 45, 55, 68, 80] },
      C: { label: "Support Tickets", series: [40, 42, 45, 48, 52, 55] },
    },
    correctDriver: "B",
    whyOptions: [
      { id: "w1", text: "New features directly increase user engagement and retention.", type: "mechanism" },
      { id: "w2", text: "Marketing creates awareness that compounds over time.", type: "confound" },
      { id: "w3", text: "Lower support burden means users stay active.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["Q4 Holiday Season", "Competitor Launch"],
    isRobustnessCase: true,
    robustnessCorrectAnswer: "NO",
    insightCue: "Feature releases track the growth curve; marketing is declining.",
  },
  {
    id: "prod-2",
    domain: "Product Growth",
    outcomeLabel: "Conversion Rate",
    outcomeSeries: [12, 14, 13, 18, 22, 25],
    drivers: {
      A: { label: "Page Load Speed", series: [75, 78, 82, 88, 92, 95] },
      B: { label: "Ad Impressions", series: [50, 55, 52, 60, 58, 62] },
      C: { label: "Team Size", series: [10, 10, 12, 12, 14, 14] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Faster pages reduce friction at checkout.", type: "mechanism" },
      { id: "w2", text: "More ads bring more qualified leads.", type: "confound" },
      { id: "w3", text: "Larger teams build better products.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["New CTO Hired", "Price Increase"],
    isRobustnessCase: false,
    insightCue: "Speed improvements directly reduce checkout abandonment.",
  },
  {
    id: "prod-3",
    domain: "Product Growth",
    outcomeLabel: "Churn Rate",
    outcomeSeries: [18, 16, 14, 11, 9, 7],
    drivers: {
      A: { label: "Customer Success Calls", series: [20, 28, 35, 42, 50, 58] },
      B: { label: "Bug Count", series: [45, 42, 40, 38, 35, 32] },
      C: { label: "Pricing Tier Mix", series: [30, 32, 31, 33, 34, 35] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Proactive outreach addresses issues before users leave.", type: "mechanism" },
      { id: "w2", text: "Fewer bugs means fewer frustrated users.", type: "confound" },
      { id: "w3", text: "Higher-tier users churn less naturally.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["Market Downturn", "New Competitor"],
    isRobustnessCase: true,
    robustnessCorrectAnswer: "NO",
    insightCue: "Customer success intervention directly prevents at-risk churn.",
  },
  {
    id: "prod-4",
    domain: "Product Growth",
    outcomeLabel: "Revenue Growth",
    outcomeSeries: [100, 105, 108, 115, 128, 142],
    drivers: {
      A: { label: "Sales Team Size", series: [8, 8, 10, 10, 12, 12] },
      B: { label: "Upsell Rate", series: [5, 8, 12, 18, 28, 40] },
      C: { label: "Website Traffic", series: [1000, 1100, 1050, 1200, 1150, 1250] },
    },
    correctDriver: "B",
    whyOptions: [
      { id: "w1", text: "Existing customers expanding creates predictable revenue growth.", type: "mechanism" },
      { id: "w2", text: "More salespeople close more deals.", type: "confound" },
      { id: "w3", text: "Higher traffic means more potential buyers.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["Industry Award Won", "CEO Change"],
    isRobustnessCase: false,
    insightCue: "Upsell rate acceleration matches revenue curve precisely.",
  },
  {
    id: "prod-5",
    domain: "Product Growth",
    outcomeLabel: "NPS Score",
    outcomeSeries: [32, 35, 40, 48, 55, 62],
    drivers: {
      A: { label: "Response Time", series: [48, 42, 35, 28, 22, 18] },
      B: { label: "Feature Count", series: [50, 55, 60, 65, 70, 75] },
      C: { label: "Employee Count", series: [25, 28, 30, 32, 35, 38] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Faster support creates immediate positive impressions.", type: "mechanism" },
      { id: "w2", text: "More features give users more reasons to recommend.", type: "confound" },
      { id: "w3", text: "Larger teams can serve customers better.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["Rebranding", "Office Move"],
    isRobustnessCase: true,
    robustnessCorrectAnswer: "NO",
    insightCue: "Response time drop (inverse) aligns with NPS rise.",
  },

  // ========== OPS/QUALITY (6-10) ==========
  {
    id: "ops-1",
    domain: "Operations",
    outcomeLabel: "Defect Rate",
    outcomeSeries: [8.5, 7.8, 6.5, 5.2, 4.1, 3.2],
    drivers: {
      A: { label: "Inspection Frequency", series: [2, 3, 4, 5, 6, 7] },
      B: { label: "Shift Length", series: [10, 10, 9, 9, 8, 8] },
      C: { label: "Raw Material Cost", series: [45, 48, 50, 52, 55, 58] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "More frequent checks catch issues before they compound.", type: "mechanism" },
      { id: "w2", text: "Shorter shifts reduce fatigue-related errors.", type: "confound" },
      { id: "w3", text: "Better materials produce fewer defects.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["New Supplier", "Equipment Upgrade"],
    isRobustnessCase: false,
    insightCue: "Inspection frequency rise mirrors defect rate decline.",
  },
  {
    id: "ops-2",
    domain: "Operations",
    outcomeLabel: "On-Time Delivery",
    outcomeSeries: [72, 75, 80, 85, 88, 92],
    drivers: {
      A: { label: "Inventory Buffer", series: [15, 18, 22, 28, 32, 38] },
      B: { label: "Order Volume", series: [100, 105, 108, 112, 115, 118] },
      C: { label: "Staff Training Hours", series: [4, 5, 5, 6, 6, 7] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Higher buffer absorbs demand variability.", type: "mechanism" },
      { id: "w2", text: "Growing volume pushes the team to perform.", type: "confound" },
      { id: "w3", text: "Better trained staff work faster.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["Peak Season", "Warehouse Expansion"],
    isRobustnessCase: true,
    robustnessCorrectAnswer: "NO",
    insightCue: "Inventory buffer growth directly enables reliable fulfillment.",
  },
  {
    id: "ops-3",
    domain: "Operations",
    outcomeLabel: "Throughput",
    outcomeSeries: [850, 880, 920, 980, 1050, 1120],
    drivers: {
      A: { label: "Machine Uptime %", series: [88, 90, 92, 94, 96, 97] },
      B: { label: "Overtime Hours", series: [20, 25, 30, 28, 32, 35] },
      C: { label: "Supplier Lead Time", series: [14, 13, 12, 11, 10, 9] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "More machine availability directly increases output.", type: "mechanism" },
      { id: "w2", text: "Overtime hours add production capacity.", type: "confound" },
      { id: "w3", text: "Faster supplier delivery keeps lines moving.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["New Manager", "Union Negotiation"],
    isRobustnessCase: false,
    insightCue: "Uptime percentage tracks throughput almost 1:1.",
  },
  {
    id: "ops-4",
    domain: "Operations",
    outcomeLabel: "Safety Incidents",
    outcomeSeries: [12, 10, 8, 6, 4, 3],
    drivers: {
      A: { label: "Safety Training Hrs", series: [2, 3, 4, 5, 6, 7] },
      B: { label: "Headcount", series: [150, 155, 160, 165, 170, 175] },
      C: { label: "Equipment Age", series: [8, 8, 7, 7, 6, 6] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Training builds awareness and preventive habits.", type: "mechanism" },
      { id: "w2", text: "More people dilutes incident rate per person.", type: "confound" },
      { id: "w3", text: "Newer equipment is inherently safer.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["OSHA Audit", "Insurance Review"],
    isRobustnessCase: true,
    robustnessCorrectAnswer: "NO",
    insightCue: "Training hours rise as incidents fall—direct behavioral effect.",
  },
  {
    id: "ops-5",
    domain: "Operations",
    outcomeLabel: "Cost Per Unit",
    outcomeSeries: [4.50, 4.35, 4.20, 4.00, 3.85, 3.70],
    drivers: {
      A: { label: "Automation %", series: [25, 30, 38, 45, 52, 60] },
      B: { label: "Batch Size", series: [100, 105, 110, 115, 120, 125] },
      C: { label: "Energy Price", series: [0.12, 0.11, 0.12, 0.13, 0.12, 0.11] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Automation reduces labor cost per unit produced.", type: "mechanism" },
      { id: "w2", text: "Larger batches spread fixed costs.", type: "confound" },
      { id: "w3", text: "Lower energy costs reduce production expense.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["Tariff Changes", "Competitor Pricing"],
    isRobustnessCase: false,
    insightCue: "Automation percentage growth explains declining unit costs.",
  },

  // ========== HIRING/TEAM (11-15) ==========
  {
    id: "team-1",
    domain: "Team Performance",
    outcomeLabel: "Project Velocity",
    outcomeSeries: [40, 45, 52, 60, 72, 85],
    drivers: {
      A: { label: "Pair Programming %", series: [10, 20, 35, 50, 65, 80] },
      B: { label: "Team Size", series: [5, 6, 6, 7, 7, 8] },
      C: { label: "Meeting Hours", series: [15, 14, 12, 10, 8, 6] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Pair programming reduces rework and speeds knowledge transfer.", type: "mechanism" },
      { id: "w2", text: "More developers means more code written.", type: "confound" },
      { id: "w3", text: "Fewer meetings free up coding time.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["New Agile Coach", "Remote Transition"],
    isRobustnessCase: true,
    robustnessCorrectAnswer: "NO",
    insightCue: "Pair programming adoption tracks velocity acceleration precisely.",
  },
  {
    id: "team-2",
    domain: "Hiring",
    outcomeLabel: "Offer Acceptance Rate",
    outcomeSeries: [55, 58, 65, 72, 78, 84],
    drivers: {
      A: { label: "Time to Offer", series: [21, 18, 14, 10, 7, 5] },
      B: { label: "Salary Percentile", series: [50, 52, 55, 58, 60, 62] },
      C: { label: "Glassdoor Rating", series: [3.5, 3.6, 3.7, 3.8, 3.9, 4.0] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Faster offers prevent candidates from accepting elsewhere.", type: "mechanism" },
      { id: "w2", text: "Higher salaries attract more acceptances.", type: "confound" },
      { id: "w3", text: "Better reputation makes candidates prefer you.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["Hiring Freeze Lifted", "Recruiter Bonus"],
    isRobustnessCase: false,
    insightCue: "Time-to-offer drop (inverse) matches acceptance rate rise.",
  },
  {
    id: "team-3",
    domain: "Team Performance",
    outcomeLabel: "Employee Engagement",
    outcomeSeries: [60, 62, 68, 75, 82, 88],
    drivers: {
      A: { label: "1:1 Meeting Frequency", series: [0.5, 1, 2, 3, 4, 4] },
      B: { label: "Bonus Pool", series: [50, 52, 55, 58, 60, 62] },
      C: { label: "Office Perks", series: [5, 6, 7, 8, 9, 10] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Regular 1:1s create psychological safety and feedback loops.", type: "mechanism" },
      { id: "w2", text: "Bigger bonuses motivate higher engagement.", type: "confound" },
      { id: "w3", text: "More perks make employees happier.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["New HR System", "CEO Town Hall"],
    isRobustnessCase: true,
    robustnessCorrectAnswer: "YES",
    insightCue: "1:1 frequency jump at week 3 precedes engagement spike.",
  },
  {
    id: "team-4",
    domain: "Team Performance",
    outcomeLabel: "Code Review Time",
    outcomeSeries: [48, 42, 35, 28, 22, 18],
    drivers: {
      A: { label: "Reviewer Specialization", series: [20, 30, 45, 60, 75, 85] },
      B: { label: "PR Size", series: [500, 480, 450, 420, 400, 380] },
      C: { label: "Tool Count", series: [5, 6, 6, 7, 7, 8] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Specialized reviewers understand context faster.", type: "mechanism" },
      { id: "w2", text: "Smaller PRs are quicker to review.", type: "confound" },
      { id: "w3", text: "More tools automate parts of review.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["Monorepo Migration", "New Linter"],
    isRobustnessCase: false,
    insightCue: "Reviewer specialization rise directly reduces review latency.",
  },
  {
    id: "team-5",
    domain: "Hiring",
    outcomeLabel: "Quality of Hire Score",
    outcomeSeries: [65, 68, 72, 78, 85, 90],
    drivers: {
      A: { label: "Structured Interview %", series: [30, 45, 60, 75, 88, 95] },
      B: { label: "Referral Rate", series: [20, 22, 25, 28, 30, 32] },
      C: { label: "Recruiter Experience", series: [3, 3.5, 4, 4.5, 5, 5.5] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Structured interviews reduce bias and improve prediction.", type: "mechanism" },
      { id: "w2", text: "Referrals bring pre-vetted candidates.", type: "confound" },
      { id: "w3", text: "Experienced recruiters spot talent better.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["DEI Initiative", "New ATS"],
    isRobustnessCase: true,
    robustnessCorrectAnswer: "NO",
    insightCue: "Structured interview adoption predicts quality score gains.",
  },

  // ========== PERSONAL PRODUCTIVITY (16-20) ==========
  {
    id: "prod-p1",
    domain: "Productivity",
    outcomeLabel: "Deep Work Hours",
    outcomeSeries: [2, 2.5, 3, 4, 5, 5.5],
    drivers: {
      A: { label: "Phone Notifications Off %", series: [20, 40, 60, 80, 95, 100] },
      B: { label: "Coffee Intake", series: [2, 2, 3, 3, 4, 4] },
      C: { label: "Exercise Days", series: [1, 2, 2, 3, 3, 4] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Removing interruptions protects focus blocks.", type: "mechanism" },
      { id: "w2", text: "Caffeine increases alertness for concentration.", type: "confound" },
      { id: "w3", text: "Exercise boosts cognitive function.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["New Project", "Vacation Week"],
    isRobustnessCase: false,
    insightCue: "Notification reduction directly enables uninterrupted work.",
  },
  {
    id: "prod-p2",
    domain: "Productivity",
    outcomeLabel: "Tasks Completed",
    outcomeSeries: [8, 10, 12, 15, 18, 22],
    drivers: {
      A: { label: "Morning Routine Consistency", series: [40, 55, 70, 82, 92, 98] },
      B: { label: "Task App Usage", series: [30, 40, 50, 60, 70, 80] },
      C: { label: "Work Hours", series: [8, 8.5, 9, 9, 9.5, 10] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Consistent mornings prime decision energy for the day.", type: "mechanism" },
      { id: "w2", text: "Better task tracking improves follow-through.", type: "confound" },
      { id: "w3", text: "More hours means more time to complete tasks.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["New Manager", "Office Renovation"],
    isRobustnessCase: true,
    robustnessCorrectAnswer: "NO",
    insightCue: "Morning routine consistency predicts daily task completion.",
  },
  {
    id: "prod-p3",
    domain: "Productivity",
    outcomeLabel: "Email Response Time",
    outcomeSeries: [4, 3.5, 3, 2.2, 1.5, 1],
    drivers: {
      A: { label: "Batch Processing %", series: [10, 25, 40, 60, 80, 95] },
      B: { label: "Inbox Zero Days", series: [0, 1, 2, 3, 4, 5] },
      C: { label: "Email Volume", series: [100, 95, 90, 85, 80, 75] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Batching creates dedicated response windows.", type: "mechanism" },
      { id: "w2", text: "Inbox zero keeps you organized.", type: "confound" },
      { id: "w3", text: "Fewer emails means less to respond to.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["New Email Client", "Team Restructure"],
    isRobustnessCase: false,
    insightCue: "Batch processing adoption inversely tracks response time.",
  },
  {
    id: "prod-p4",
    domain: "Productivity",
    outcomeLabel: "Creative Output",
    outcomeSeries: [3, 4, 5, 7, 9, 12],
    drivers: {
      A: { label: "Walking Minutes", series: [10, 20, 35, 50, 70, 90] },
      B: { label: "Reading Hours", series: [0.5, 1, 1.5, 2, 2.5, 3] },
      C: { label: "Social Events", series: [1, 2, 2, 3, 3, 4] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Walking activates default mode network for insight.", type: "mechanism" },
      { id: "w2", text: "Reading provides raw material for new ideas.", type: "confound" },
      { id: "w3", text: "Social interaction sparks collaborative thinking.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["Deadline Week", "New Hobby"],
    isRobustnessCase: true,
    robustnessCorrectAnswer: "NO",
    insightCue: "Walking time expansion parallels creative output curve.",
  },
  {
    id: "prod-p5",
    domain: "Productivity",
    outcomeLabel: "Decision Quality Score",
    outcomeSeries: [55, 60, 68, 75, 82, 88],
    drivers: {
      A: { label: "Sleep Quality %", series: [50, 60, 72, 82, 90, 95] },
      B: { label: "Meetings/Day", series: [6, 5, 4, 3, 2, 2] },
      C: { label: "Decision Journal Entries", series: [0, 2, 4, 6, 8, 10] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Sleep restores prefrontal function for judgment.", type: "mechanism" },
      { id: "w2", text: "Fewer meetings reduce decision fatigue.", type: "confound" },
      { id: "w3", text: "Journaling improves reflection over time.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["Major Life Event", "Diet Change"],
    isRobustnessCase: false,
    insightCue: "Sleep quality improvement directly predicts decision quality.",
  },

  // ========== LEARNING OUTCOMES (21-25) ==========
  {
    id: "learn-1",
    domain: "Learning",
    outcomeLabel: "Retention Rate",
    outcomeSeries: [45, 52, 60, 70, 80, 88],
    drivers: {
      A: { label: "Spaced Repetition Use", series: [10, 25, 45, 65, 82, 95] },
      B: { label: "Study Hours", series: [2, 2.5, 3, 3.5, 4, 4.5] },
      C: { label: "Highlighter Usage", series: [50, 55, 60, 65, 70, 75] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Spaced repetition exploits memory consolidation timing.", type: "mechanism" },
      { id: "w2", text: "More study time increases exposure.", type: "confound" },
      { id: "w3", text: "Highlighting marks important concepts.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["Exam Week", "New Study Group"],
    isRobustnessCase: true,
    robustnessCorrectAnswer: "NO",
    insightCue: "Spaced repetition adoption curve matches retention gains.",
  },
  {
    id: "learn-2",
    domain: "Learning",
    outcomeLabel: "Skill Assessment Score",
    outcomeSeries: [50, 55, 62, 72, 82, 90],
    drivers: {
      A: { label: "Deliberate Practice Hrs", series: [1, 2, 3, 5, 7, 9] },
      B: { label: "Tutorial Videos", series: [5, 8, 12, 15, 18, 22] },
      C: { label: "Peer Study Time", series: [1, 1.5, 2, 2.5, 3, 3.5] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Deliberate practice targets weaknesses systematically.", type: "mechanism" },
      { id: "w2", text: "More tutorials provide more knowledge.", type: "confound" },
      { id: "w3", text: "Peer learning offers social motivation.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["Course Change", "Mentor Assignment"],
    isRobustnessCase: false,
    insightCue: "Deliberate practice hours predict skill score progression.",
  },
  {
    id: "learn-3",
    domain: "Learning",
    outcomeLabel: "Course Completion Rate",
    outcomeSeries: [30, 38, 48, 60, 72, 82],
    drivers: {
      A: { label: "Commitment Device %", series: [0, 20, 45, 68, 85, 95] },
      B: { label: "Course Length", series: [40, 38, 35, 32, 30, 28] },
      C: { label: "Certificate Value", series: [50, 55, 60, 65, 70, 75] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Commitment devices create accountability for follow-through.", type: "mechanism" },
      { id: "w2", text: "Shorter courses are easier to finish.", type: "confound" },
      { id: "w3", text: "Valuable certificates motivate completion.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["Promotion Pending", "Company Learning Budget"],
    isRobustnessCase: true,
    robustnessCorrectAnswer: "NO",
    insightCue: "Commitment device adoption directly predicts completion.",
  },
  {
    id: "learn-4",
    domain: "Learning",
    outcomeLabel: "Transfer to Practice",
    outcomeSeries: [20, 28, 38, 52, 68, 82],
    drivers: {
      A: { label: "Immediate Application %", series: [10, 22, 38, 55, 72, 88] },
      B: { label: "Quiz Scores", series: [70, 75, 78, 82, 85, 88] },
      C: { label: "Note-Taking Volume", series: [100, 120, 140, 160, 180, 200] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Applying knowledge immediately encodes procedural memory.", type: "mechanism" },
      { id: "w2", text: "High quiz scores show strong understanding.", type: "confound" },
      { id: "w3", text: "More notes capture more information.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["Career Transition", "Manager Expectation"],
    isRobustnessCase: false,
    insightCue: "Immediate application rate tracks transfer-to-practice curve.",
  },
  {
    id: "learn-5",
    domain: "Learning",
    outcomeLabel: "Conceptual Understanding",
    outcomeSeries: [40, 48, 58, 70, 82, 92],
    drivers: {
      A: { label: "Elaborative Interrogation", series: [5, 15, 30, 50, 70, 88] },
      B: { label: "Textbook Pages Read", series: [50, 80, 110, 140, 170, 200] },
      C: { label: "Flashcard Count", series: [100, 150, 200, 250, 300, 350] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Asking 'why' forces deeper causal connections.", type: "mechanism" },
      { id: "w2", text: "More reading covers more material.", type: "confound" },
      { id: "w3", text: "More flashcards improve recall.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["Capstone Project", "Tutor Sessions"],
    isRobustnessCase: true,
    robustnessCorrectAnswer: "YES",
    insightCue: "Elaborative interrogation use predicts conceptual depth.",
  },

  // ========== SCIENTIFIC INFERENCE (26-30) ==========
  {
    id: "sci-1",
    domain: "Scientific",
    outcomeLabel: "Experiment Replication",
    outcomeSeries: [40, 48, 58, 70, 82, 90],
    drivers: {
      A: { label: "Protocol Detail Level", series: [30, 42, 56, 72, 85, 95] },
      B: { label: "Funding Amount", series: [50, 55, 60, 65, 70, 75] },
      C: { label: "Lab Size", series: [5, 6, 7, 8, 9, 10] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Detailed protocols reduce ambiguity in replication.", type: "mechanism" },
      { id: "w2", text: "More funding allows better equipment.", type: "confound" },
      { id: "w3", text: "Larger labs have more expertise.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["Journal Policy Change", "PI Retirement"],
    isRobustnessCase: false,
    insightCue: "Protocol detail level directly enables successful replication.",
  },
  {
    id: "sci-2",
    domain: "Scientific",
    outcomeLabel: "Citation Impact",
    outcomeSeries: [10, 15, 22, 35, 50, 68],
    drivers: {
      A: { label: "Open Data %", series: [5, 18, 35, 55, 75, 92] },
      B: { label: "Author Count", series: [3, 4, 5, 6, 7, 8] },
      C: { label: "Journal Prestige", series: [50, 52, 55, 58, 60, 62] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Open data enables others to build on and cite the work.", type: "mechanism" },
      { id: "w2", text: "More authors means more networks sharing.", type: "confound" },
      { id: "w3", text: "Prestigious journals are read more.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["Funder Mandate", "Field Controversy"],
    isRobustnessCase: true,
    robustnessCorrectAnswer: "NO",
    insightCue: "Open data availability predicts citation growth curve.",
  },
  {
    id: "sci-3",
    domain: "Scientific",
    outcomeLabel: "Discovery Rate",
    outcomeSeries: [2, 3, 4, 6, 9, 13],
    drivers: {
      A: { label: "Cross-Discipline Collab", series: [10, 20, 35, 55, 75, 90] },
      B: { label: "Equipment Budget", series: [100, 110, 120, 130, 140, 150] },
      C: { label: "PhD Students", series: [2, 3, 3, 4, 4, 5] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Cross-discipline work combines diverse methods for breakthroughs.", type: "mechanism" },
      { id: "w2", text: "Better equipment enables new experiments.", type: "confound" },
      { id: "w3", text: "More students produce more research.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["New Institute", "Grant Cycle"],
    isRobustnessCase: false,
    insightCue: "Cross-discipline collaboration rate predicts discovery acceleration.",
  },
  {
    id: "sci-4",
    domain: "Scientific",
    outcomeLabel: "Hypothesis Confirmation",
    outcomeSeries: [35, 42, 52, 65, 78, 88],
    drivers: {
      A: { label: "Pre-Registration %", series: [10, 25, 45, 65, 82, 95] },
      B: { label: "Sample Size", series: [50, 60, 70, 80, 90, 100] },
      C: { label: "Statistician Access", series: [0, 1, 1, 2, 2, 3] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Pre-registration prevents p-hacking and ensures honest tests.", type: "mechanism" },
      { id: "w2", text: "Larger samples detect true effects better.", type: "confound" },
      { id: "w3", text: "Statisticians improve analysis quality.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["Replication Crisis", "New Journal"],
    isRobustnessCase: true,
    robustnessCorrectAnswer: "NO",
    insightCue: "Pre-registration adoption tracks hypothesis confirmation rate.",
  },
  {
    id: "sci-5",
    domain: "Scientific",
    outcomeLabel: "Theory Development",
    outcomeSeries: [25, 32, 42, 55, 70, 85],
    drivers: {
      A: { label: "Negative Result Pub %", series: [5, 15, 30, 48, 68, 85] },
      B: { label: "Conference Presentations", series: [2, 4, 6, 8, 10, 12] },
      C: { label: "Review Paper Count", series: [1, 2, 2, 3, 3, 4] },
    },
    correctDriver: "A",
    whyOptions: [
      { id: "w1", text: "Publishing negatives eliminates dead ends, sharpening theory.", type: "mechanism" },
      { id: "w2", text: "Conferences spread ideas that refine theories.", type: "confound" },
      { id: "w3", text: "Reviews synthesize existing knowledge.", type: "irrelevant" },
    ],
    correctWhyId: "w1",
    contextTags: ["Paradigm Shift", "Major Critique Published"],
    isRobustnessCase: false,
    insightCue: "Negative result publication enables faster theory pruning.",
  },
];

// ============================================
// SESSION GENERATION
// ============================================

export function generateSession(difficulty: Difficulty): SignalCase[] {
  const config = DIFFICULTY_CONFIG[difficulty];
  const shuffled = [...CASES].sort(() => Math.random() - 0.5);
  
  // Ensure at least 3 robustness cases for standard/hard
  const robustnessCases = shuffled.filter(c => c.isRobustnessCase);
  const otherCases = shuffled.filter(c => !c.isRobustnessCase);
  
  const minRobustness = difficulty === "easy" ? 2 : 3;
  const selectedRobustness = robustnessCases.slice(0, minRobustness);
  const remaining = config.cases - selectedRobustness.length;
  const selectedOthers = otherCases.slice(0, remaining);
  
  // Combine and shuffle final order
  return [...selectedRobustness, ...selectedOthers].sort(() => Math.random() - 0.5);
}

export function getAllCases(): SignalCase[] {
  return CASES;
}
