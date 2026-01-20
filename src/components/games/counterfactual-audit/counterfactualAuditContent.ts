/**
 * COUNTERFACTUAL AUDIT — Content Bank
 * 
 * S2-CT (Critical Thinking) training game.
 * Trains deliberate reasoning by identifying the minimal missing/changed evidence
 * that would flip a decision (counterfactual reasoning).
 * 
 * 24 pre-authored rounds across varied domains.
 */

// Option classification types
export type OptionClass = "core_flip" | "confounder_trap" | "proxy_symptom" | "noise_irrelevant";

export interface AuditOption {
  id: string;
  text: string;
  optionClass: OptionClass;
  feedbackLine: string; // ≤90 chars for micro-feedback
}

export interface AuditRound {
  id: string;
  domain: string;
  decisionLabel: string; // "Proceed" | "Delay" | "Approve" | "Reject" | "Hire" | "Pass"
  decisionValue: "positive" | "negative"; // The current decision direction
  evidenceBullets: string[];
  options: AuditOption[];
  correctOptionId: string;
}

// Configuration per difficulty
export const DIFFICULTY_CONFIG = {
  easy: { rounds: 8, timePerRound: 45 },
  standard: { rounds: 10, timePerRound: 45 },
  hard: { rounds: 12, timePerRound: 45 },
} as const;

export type Difficulty = keyof typeof DIFFICULTY_CONFIG;

// XP base per difficulty
export const XP_BASE: Record<Difficulty, number> = {
  easy: 16,
  standard: 20,
  hard: 24,
};

// Content bank: 24 rounds
const ROUNDS: AuditRound[] = [
  // ========== PRODUCT/MARKET DECISIONS (1-4) ==========
  {
    id: "pm_001",
    domain: "Product",
    decisionLabel: "Proceed",
    decisionValue: "positive",
    evidenceBullets: [
      "Survey shows 78% interest in the feature",
      "3 competitors launched similar features last quarter",
      "Engineering estimates 4-week build time",
      "Current users request it in 23% of support tickets",
    ],
    options: [
      {
        id: "a",
        text: "The 78% interest was from non-paying users only",
        optionClass: "core_flip",
        feedbackLine: "Willingness to pay changes the core economics.",
      },
      {
        id: "b",
        text: "Competitors are larger companies with more resources",
        optionClass: "confounder_trap",
        feedbackLine: "Competitor size doesn't flip your build decision.",
      },
      {
        id: "c",
        text: "Support tickets have increased 10% this month",
        optionClass: "proxy_symptom",
        feedbackLine: "Ticket volume is a symptom, not a decision driver.",
      },
      {
        id: "d",
        text: "The survey was conducted on a Tuesday",
        optionClass: "noise_irrelevant",
        feedbackLine: "Survey timing is irrelevant to feature value.",
      },
    ],
    correctOptionId: "a",
  },
  {
    id: "pm_002",
    domain: "Product",
    decisionLabel: "Delay",
    decisionValue: "negative",
    evidenceBullets: [
      "Beta testers report 45% completion rate on core flow",
      "NPS score of 32 from early adopters",
      "Main competitor launches in 6 weeks",
      "Team has 2 critical bugs in backlog",
    ],
    options: [
      {
        id: "a",
        text: "The 45% completion rate is industry-average for beta",
        optionClass: "core_flip",
        feedbackLine: "Benchmark context changes the quality assessment.",
      },
      {
        id: "b",
        text: "The competitor has been delayed twice before",
        optionClass: "confounder_trap",
        feedbackLine: "Past delays don't guarantee future delays.",
      },
      {
        id: "c",
        text: "NPS scores fluctuate weekly",
        optionClass: "proxy_symptom",
        feedbackLine: "Score volatility is a symptom, not a quality signal.",
      },
      {
        id: "d",
        text: "The team prefers a later launch date",
        optionClass: "noise_irrelevant",
        feedbackLine: "Team preference doesn't affect product readiness.",
      },
    ],
    correctOptionId: "a",
  },
  {
    id: "pm_003",
    domain: "Market",
    decisionLabel: "Reject",
    decisionValue: "negative",
    evidenceBullets: [
      "Market size estimated at $50M annually",
      "Only 2 potential enterprise customers identified",
      "Sales cycle expected to be 9+ months",
      "Requires specialized compliance certifications",
    ],
    options: [
      {
        id: "a",
        text: "The 2 customers account for 80% of market spend",
        optionClass: "core_flip",
        feedbackLine: "Customer concentration changes market viability.",
      },
      {
        id: "b",
        text: "Compliance certifications are getting easier to obtain",
        optionClass: "confounder_trap",
        feedbackLine: "Easier compliance doesn't change customer count.",
      },
      {
        id: "c",
        text: "Competitors are also struggling in this market",
        optionClass: "proxy_symptom",
        feedbackLine: "Competitor struggles confirm, not flip, the decision.",
      },
      {
        id: "d",
        text: "The market research was done 6 months ago",
        optionClass: "noise_irrelevant",
        feedbackLine: "6 months is within acceptable research validity.",
      },
    ],
    correctOptionId: "a",
  },
  {
    id: "pm_004",
    domain: "Product",
    decisionLabel: "Approve",
    decisionValue: "positive",
    evidenceBullets: [
      "A/B test shows 12% increase in conversion",
      "Test ran for 14 days with 50,000 users",
      "Statistical significance reached at p<0.05",
      "Revenue per user unchanged during test",
    ],
    options: [
      {
        id: "a",
        text: "The test only included users from one geography",
        optionClass: "core_flip",
        feedbackLine: "Sample bias invalidates generalization.",
      },
      {
        id: "b",
        text: "The test period included a holiday weekend",
        optionClass: "confounder_trap",
        feedbackLine: "Holiday effects are factored into significance testing.",
      },
      {
        id: "c",
        text: "Some users complained about the new design",
        optionClass: "proxy_symptom",
        feedbackLine: "Complaints exist; conversion still improved.",
      },
      {
        id: "d",
        text: "The product team worked overtime during the test",
        optionClass: "noise_irrelevant",
        feedbackLine: "Team effort doesn't affect test validity.",
      },
    ],
    correctOptionId: "a",
  },

  // ========== HIRING DECISIONS (5-8) ==========
  {
    id: "hr_001",
    domain: "Hiring",
    decisionLabel: "Hire",
    decisionValue: "positive",
    evidenceBullets: [
      "Candidate has 8 years of relevant experience",
      "Strong technical interview performance (4.2/5)",
      "Positive references from two previous managers",
      "Salary expectations within budget",
    ],
    options: [
      {
        id: "a",
        text: "All 8 years were at a single company with different tech stack",
        optionClass: "core_flip",
        feedbackLine: "Single-company experience limits skill transferability.",
      },
      {
        id: "b",
        text: "The candidate prefers remote work",
        optionClass: "noise_irrelevant",
        feedbackLine: "Work location preference doesn't affect capability.",
      },
      {
        id: "c",
        text: "References are from managers who left the company",
        optionClass: "proxy_symptom",
        feedbackLine: "Manager departures don't invalidate their assessment.",
      },
      {
        id: "d",
        text: "Other candidates also had strong interviews",
        optionClass: "confounder_trap",
        feedbackLine: "Other candidates' strength doesn't weaken this one.",
      },
    ],
    correctOptionId: "a",
  },
  {
    id: "hr_002",
    domain: "Hiring",
    decisionLabel: "Pass",
    decisionValue: "negative",
    evidenceBullets: [
      "Candidate changed jobs 4 times in 5 years",
      "Technical skills slightly below team average",
      "Asked for 15% above budget salary",
      "No management experience for a senior role",
    ],
    options: [
      {
        id: "a",
        text: "Each job change was due to company acquisitions or layoffs",
        optionClass: "core_flip",
        feedbackLine: "Context behind job changes removes the red flag.",
      },
      {
        id: "b",
        text: "The candidate has a strong social media presence",
        optionClass: "noise_irrelevant",
        feedbackLine: "Social presence is irrelevant to role fit.",
      },
      {
        id: "c",
        text: "Other team members also asked for above-budget salaries",
        optionClass: "confounder_trap",
        feedbackLine: "Others' salary asks don't change this candidate's fit.",
      },
      {
        id: "d",
        text: "The candidate seemed nervous during the interview",
        optionClass: "proxy_symptom",
        feedbackLine: "Interview nerves don't predict job performance.",
      },
    ],
    correctOptionId: "a",
  },
  {
    id: "hr_003",
    domain: "Hiring",
    decisionLabel: "Hire",
    decisionValue: "positive",
    evidenceBullets: [
      "Candidate designed award-winning products at previous company",
      "Portfolio shows consistent design quality",
      "Team unanimously recommends hiring",
      "Available to start immediately",
    ],
    options: [
      {
        id: "a",
        text: "The award-winning products were team efforts with unclear individual contribution",
        optionClass: "core_flip",
        feedbackLine: "Unclear contribution invalidates the achievement.",
      },
      {
        id: "b",
        text: "The candidate's commute would be 45 minutes",
        optionClass: "noise_irrelevant",
        feedbackLine: "Commute length is a personal preference.",
      },
      {
        id: "c",
        text: "The team has made hiring mistakes before",
        optionClass: "confounder_trap",
        feedbackLine: "Past mistakes don't predict this specific decision.",
      },
      {
        id: "d",
        text: "Other designers in the market are also available",
        optionClass: "proxy_symptom",
        feedbackLine: "Market availability doesn't change this candidate's quality.",
      },
    ],
    correctOptionId: "a",
  },
  {
    id: "hr_004",
    domain: "Hiring",
    decisionLabel: "Pass",
    decisionValue: "negative",
    evidenceBullets: [
      "Candidate's coding test score was 65% (threshold: 70%)",
      "Communication skills rated as average",
      "No experience with company's primary language",
      "References were slow to respond",
    ],
    options: [
      {
        id: "a",
        text: "The coding test had a known grading bug that affected 20% of questions",
        optionClass: "core_flip",
        feedbackLine: "Grading bug invalidates the test score threshold.",
      },
      {
        id: "b",
        text: "The candidate is relocating from another city",
        optionClass: "noise_irrelevant",
        feedbackLine: "Relocation is irrelevant to skill assessment.",
      },
      {
        id: "c",
        text: "The team is understaffed and needs someone quickly",
        optionClass: "confounder_trap",
        feedbackLine: "Urgency doesn't change candidate quality.",
      },
      {
        id: "d",
        text: "References eventually responded positively",
        optionClass: "proxy_symptom",
        feedbackLine: "Response speed was a symptom, not a quality signal.",
      },
    ],
    correctOptionId: "a",
  },

  // ========== HEALTH/PRODUCTIVITY DECISIONS (9-12) ==========
  {
    id: "hp_001",
    domain: "Productivity",
    decisionLabel: "Proceed",
    decisionValue: "positive",
    evidenceBullets: [
      "New morning routine increased focus time by 2 hours",
      "Energy levels feel higher throughout the day",
      "Started waking up 1 hour earlier",
      "Adopted the routine 3 weeks ago",
    ],
    options: [
      {
        id: "a",
        text: "The past 3 weeks coincided with a lighter workload period",
        optionClass: "core_flip",
        feedbackLine: "Confounded with workload changes, can't attribute to routine.",
      },
      {
        id: "b",
        text: "Friends don't follow the same routine",
        optionClass: "noise_irrelevant",
        feedbackLine: "Others' routines are irrelevant to your results.",
      },
      {
        id: "c",
        text: "Sleep tracking app shows similar sleep quality",
        optionClass: "proxy_symptom",
        feedbackLine: "App data is a proxy, not the outcome metric.",
      },
      {
        id: "d",
        text: "The routine is recommended by a popular productivity guru",
        optionClass: "confounder_trap",
        feedbackLine: "Source popularity doesn't validate effectiveness.",
      },
    ],
    correctOptionId: "a",
  },
  {
    id: "hp_002",
    domain: "Health",
    decisionLabel: "Delay",
    decisionValue: "negative",
    evidenceBullets: [
      "New supplement shows no measurable energy change after 4 weeks",
      "Study cited by manufacturer had 30 participants",
      "Price is 3x higher than alternatives",
      "No side effects observed",
    ],
    options: [
      {
        id: "a",
        text: "The supplement requires 8 weeks for effects to manifest",
        optionClass: "core_flip",
        feedbackLine: "Evaluation period was too short for valid assessment.",
      },
      {
        id: "b",
        text: "A friend had good results with the same supplement",
        optionClass: "confounder_trap",
        feedbackLine: "Anecdotal results don't generalize to your response.",
      },
      {
        id: "c",
        text: "The supplement has positive online reviews",
        optionClass: "proxy_symptom",
        feedbackLine: "Reviews are proxies, not your direct experience.",
      },
      {
        id: "d",
        text: "The brand recently changed its packaging",
        optionClass: "noise_irrelevant",
        feedbackLine: "Packaging is irrelevant to product efficacy.",
      },
    ],
    correctOptionId: "a",
  },
  {
    id: "hp_003",
    domain: "Productivity",
    decisionLabel: "Approve",
    decisionValue: "positive",
    evidenceBullets: [
      "Time-blocking method reduced meeting time by 40%",
      "Implemented for the past month",
      "Team reports feeling less interrupted",
      "Email response time increased by 2 hours on average",
    ],
    options: [
      {
        id: "a",
        text: "Several key stakeholders have been on leave during the month",
        optionClass: "core_flip",
        feedbackLine: "Reduced stakeholder presence confounds meeting reduction.",
      },
      {
        id: "b",
        text: "Other teams use different scheduling methods",
        optionClass: "noise_irrelevant",
        feedbackLine: "Other teams' methods don't affect your results.",
      },
      {
        id: "c",
        text: "Some team members prefer the old system",
        optionClass: "proxy_symptom",
        feedbackLine: "Preference is a symptom, not an outcome metric.",
      },
      {
        id: "d",
        text: "The method was featured in a business magazine",
        optionClass: "confounder_trap",
        feedbackLine: "Media coverage doesn't validate your specific results.",
      },
    ],
    correctOptionId: "a",
  },
  {
    id: "hp_004",
    domain: "Health",
    decisionLabel: "Reject",
    decisionValue: "negative",
    evidenceBullets: [
      "Fitness tracker shows declining step count over 2 months",
      "Sleep score dropped from 82 to 71",
      "Weight unchanged despite diet changes",
      "Resting heart rate stable at 68 bpm",
    ],
    options: [
      {
        id: "a",
        text: "The fitness tracker's sensors have been malfunctioning",
        optionClass: "core_flip",
        feedbackLine: "Faulty data invalidates the trend assessment.",
      },
      {
        id: "b",
        text: "Weather has been unusually cold for outdoor activities",
        optionClass: "confounder_trap",
        feedbackLine: "Weather is a factor but doesn't flip the conclusion.",
      },
      {
        id: "c",
        text: "Gym membership was paused last month",
        optionClass: "proxy_symptom",
        feedbackLine: "Membership status is a symptom, not a health metric.",
      },
      {
        id: "d",
        text: "Friends are also experiencing similar trends",
        optionClass: "noise_irrelevant",
        feedbackLine: "Others' trends don't affect your health assessment.",
      },
    ],
    correctOptionId: "a",
  },

  // ========== TIME ALLOCATION DECISIONS (13-16) ==========
  {
    id: "ta_001",
    domain: "Time",
    decisionLabel: "Proceed",
    decisionValue: "positive",
    evidenceBullets: [
      "Side project generates $500/month passive income",
      "Requires 5 hours/week to maintain",
      "Income has been stable for 6 months",
      "Primary job satisfaction is declining",
    ],
    options: [
      {
        id: "a",
        text: "The income comes from a single client who may churn",
        optionClass: "core_flip",
        feedbackLine: "Client concentration makes income unstable.",
      },
      {
        id: "b",
        text: "Other side projects in the space are more popular",
        optionClass: "noise_irrelevant",
        feedbackLine: "Others' popularity doesn't affect your project's value.",
      },
      {
        id: "c",
        text: "Job satisfaction has been declining for years",
        optionClass: "proxy_symptom",
        feedbackLine: "Long-term decline is a symptom, not a project metric.",
      },
      {
        id: "d",
        text: "Friends think the side project is risky",
        optionClass: "confounder_trap",
        feedbackLine: "Friends' opinions don't change the financial reality.",
      },
    ],
    correctOptionId: "a",
  },
  {
    id: "ta_002",
    domain: "Time",
    decisionLabel: "Reject",
    decisionValue: "negative",
    evidenceBullets: [
      "Online course requires 10 hours/week for 12 weeks",
      "Course completion rate industry-wide is 15%",
      "Skill taught is in high demand in job market",
      "Current schedule has limited free time",
    ],
    options: [
      {
        id: "a",
        text: "The course offers flexible deadlines and lifetime access",
        optionClass: "core_flip",
        feedbackLine: "Flexible format removes the time constraint issue.",
      },
      {
        id: "b",
        text: "A colleague also started the same course",
        optionClass: "noise_irrelevant",
        feedbackLine: "Colleague's enrollment doesn't affect your constraints.",
      },
      {
        id: "c",
        text: "Previous courses were also hard to complete",
        optionClass: "proxy_symptom",
        feedbackLine: "Past struggles are symptoms, not this course's issue.",
      },
      {
        id: "d",
        text: "The instructor has mixed reviews",
        optionClass: "confounder_trap",
        feedbackLine: "Instructor reviews don't change your time constraint.",
      },
    ],
    correctOptionId: "a",
  },
  {
    id: "ta_003",
    domain: "Time",
    decisionLabel: "Approve",
    decisionValue: "positive",
    evidenceBullets: [
      "New delegation system freed up 8 hours/week",
      "Team handling delegated tasks effectively",
      "No quality complaints in 4 weeks",
      "Manager praised the efficiency improvement",
    ],
    options: [
      {
        id: "a",
        text: "The delegated tasks were unusually simple this month",
        optionClass: "core_flip",
        feedbackLine: "Task simplicity confounds the effectiveness assessment.",
      },
      {
        id: "b",
        text: "Other managers don't use delegation systems",
        optionClass: "noise_irrelevant",
        feedbackLine: "Others' practices don't affect your results.",
      },
      {
        id: "c",
        text: "One team member requested additional training",
        optionClass: "proxy_symptom",
        feedbackLine: "Training requests are growth signals, not quality issues.",
      },
      {
        id: "d",
        text: "Industry articles recommend more delegation",
        optionClass: "confounder_trap",
        feedbackLine: "Industry advice doesn't validate your specific case.",
      },
    ],
    correctOptionId: "a",
  },
  {
    id: "ta_004",
    domain: "Time",
    decisionLabel: "Delay",
    decisionValue: "negative",
    evidenceBullets: [
      "Networking events haven't led to direct business in 6 months",
      "Average 4 hours/week spent on networking",
      "Made 50+ new connections this year",
      "No measurable ROI from time invested",
    ],
    options: [
      {
        id: "a",
        text: "Two major deals in pipeline were sourced from these connections",
        optionClass: "core_flip",
        feedbackLine: "Pipeline attribution changes the ROI assessment.",
      },
      {
        id: "b",
        text: "Competitors spend less time on networking",
        optionClass: "confounder_trap",
        feedbackLine: "Competitor behavior doesn't change your results.",
      },
      {
        id: "c",
        text: "Some events were poorly organized",
        optionClass: "proxy_symptom",
        feedbackLine: "Event quality is a symptom, not an ROI metric.",
      },
      {
        id: "d",
        text: "LinkedIn connections have increased significantly",
        optionClass: "noise_irrelevant",
        feedbackLine: "Connection count doesn't equal business value.",
      },
    ],
    correctOptionId: "a",
  },

  // ========== INVESTMENT-LIKE DECISIONS (17-20) ==========
  {
    id: "inv_001",
    domain: "Investment",
    decisionLabel: "Proceed",
    decisionValue: "positive",
    evidenceBullets: [
      "Project shows 25% projected return over 2 years",
      "Management team has 15+ years experience",
      "Market for the product is growing 10% annually",
      "Initial investment is within risk tolerance",
    ],
    options: [
      {
        id: "a",
        text: "The projection assumes regulatory approval that's uncertain",
        optionClass: "core_flip",
        feedbackLine: "Regulatory uncertainty invalidates the projection.",
      },
      {
        id: "b",
        text: "Similar projects have failed in other markets",
        optionClass: "confounder_trap",
        feedbackLine: "Other market failures don't predict this specific case.",
      },
      {
        id: "c",
        text: "The team had one underperforming project 5 years ago",
        optionClass: "proxy_symptom",
        feedbackLine: "One past failure doesn't predict current performance.",
      },
      {
        id: "d",
        text: "The project office is in a less prestigious location",
        optionClass: "noise_irrelevant",
        feedbackLine: "Office location is irrelevant to project returns.",
      },
    ],
    correctOptionId: "a",
  },
  {
    id: "inv_002",
    domain: "Investment",
    decisionLabel: "Reject",
    decisionValue: "negative",
    evidenceBullets: [
      "Startup has negative cash flow for 18 months",
      "Customer acquisition cost exceeds lifetime value",
      "Founders have no prior successful exits",
      "Market competition is intensifying",
    ],
    options: [
      {
        id: "a",
        text: "A new enterprise contract will flip unit economics next quarter",
        optionClass: "core_flip",
        feedbackLine: "Imminent contract changes the financial trajectory.",
      },
      {
        id: "b",
        text: "The startup has won industry awards",
        optionClass: "noise_irrelevant",
        feedbackLine: "Awards don't change the financial fundamentals.",
      },
      {
        id: "c",
        text: "The founders are very passionate about their vision",
        optionClass: "proxy_symptom",
        feedbackLine: "Passion is admirable but doesn't fix unit economics.",
      },
      {
        id: "d",
        text: "Other investors also passed on this round",
        optionClass: "confounder_trap",
        feedbackLine: "Other investors' decisions don't inform yours directly.",
      },
    ],
    correctOptionId: "a",
  },
  {
    id: "inv_003",
    domain: "Investment",
    decisionLabel: "Approve",
    decisionValue: "positive",
    evidenceBullets: [
      "Real estate property has 7% rental yield",
      "Location has 5% annual appreciation history",
      "Current tenant has 2 years remaining on lease",
      "Property passed all inspections",
    ],
    options: [
      {
        id: "a",
        text: "Zoning changes pending could allow competing developments nearby",
        optionClass: "core_flip",
        feedbackLine: "Future competition threatens yield and appreciation.",
      },
      {
        id: "b",
        text: "Interest rates may rise next year",
        optionClass: "confounder_trap",
        feedbackLine: "Rate changes affect all properties equally.",
      },
      {
        id: "c",
        text: "The property needs minor cosmetic updates",
        optionClass: "proxy_symptom",
        feedbackLine: "Cosmetic updates are normal, not deal-breakers.",
      },
      {
        id: "d",
        text: "The seller is relocating for personal reasons",
        optionClass: "noise_irrelevant",
        feedbackLine: "Seller motivation doesn't affect property value.",
      },
    ],
    correctOptionId: "a",
  },
  {
    id: "inv_004",
    domain: "Investment",
    decisionLabel: "Delay",
    decisionValue: "negative",
    evidenceBullets: [
      "Stock has dropped 30% from 52-week high",
      "Analyst downgrades from 3 major firms",
      "Company missed earnings twice this year",
      "CEO recently sold significant shares",
    ],
    options: [
      {
        id: "a",
        text: "The share sales were pre-scheduled for estate planning 2 years ago",
        optionClass: "core_flip",
        feedbackLine: "Pre-scheduled sales remove the insider selling signal.",
      },
      {
        id: "b",
        text: "The broader market is also down",
        optionClass: "confounder_trap",
        feedbackLine: "Market trends don't explain company-specific issues.",
      },
      {
        id: "c",
        text: "Social media sentiment about the stock is negative",
        optionClass: "proxy_symptom",
        feedbackLine: "Social sentiment is a symptom, not a fundamental.",
      },
      {
        id: "d",
        text: "The stock has a memorable ticker symbol",
        optionClass: "noise_irrelevant",
        feedbackLine: "Ticker memorability is irrelevant to investment quality.",
      },
    ],
    correctOptionId: "a",
  },

  // ========== SCIENTIFIC INFERENCE DECISIONS (21-24) ==========
  {
    id: "sci_001",
    domain: "Research",
    decisionLabel: "Approve",
    decisionValue: "positive",
    evidenceBullets: [
      "Study shows treatment reduces symptoms by 40%",
      "Double-blind randomized controlled trial design",
      "Sample size of 500 participants",
      "Published in peer-reviewed journal",
    ],
    options: [
      {
        id: "a",
        text: "The control group received an active placebo with known minor effects",
        optionClass: "core_flip",
        feedbackLine: "Active placebo confounds the treatment effect.",
      },
      {
        id: "b",
        text: "The lead researcher works for the treatment manufacturer",
        optionClass: "confounder_trap",
        feedbackLine: "Conflict of interest doesn't invalidate the methodology.",
      },
      {
        id: "c",
        text: "Participant dropout was 15%",
        optionClass: "proxy_symptom",
        feedbackLine: "Moderate dropout is expected in trials.",
      },
      {
        id: "d",
        text: "The study was conducted in multiple countries",
        optionClass: "noise_irrelevant",
        feedbackLine: "Multi-country design is generally a strength.",
      },
    ],
    correctOptionId: "a",
  },
  {
    id: "sci_002",
    domain: "Research",
    decisionLabel: "Reject",
    decisionValue: "negative",
    evidenceBullets: [
      "Observational study links behavior X to outcome Y",
      "Correlation coefficient of 0.35",
      "Study conducted over 5 years",
      "Data from 10,000 participants",
    ],
    options: [
      {
        id: "a",
        text: "Researchers controlled for 15 major confounding variables",
        optionClass: "core_flip",
        feedbackLine: "Confounder control strengthens causal inference.",
      },
      {
        id: "b",
        text: "Similar studies have found different results",
        optionClass: "confounder_trap",
        feedbackLine: "Conflicting studies don't invalidate methodology.",
      },
      {
        id: "c",
        text: "Some participants self-reported their data",
        optionClass: "proxy_symptom",
        feedbackLine: "Self-reporting is common in observational studies.",
      },
      {
        id: "d",
        text: "The research institution has a new building",
        optionClass: "noise_irrelevant",
        feedbackLine: "Facilities are irrelevant to study quality.",
      },
    ],
    correctOptionId: "a",
  },
  {
    id: "sci_003",
    domain: "Research",
    decisionLabel: "Proceed",
    decisionValue: "positive",
    evidenceBullets: [
      "Meta-analysis combines 30 studies on intervention effectiveness",
      "Overall effect size is moderate (d=0.45)",
      "Low heterogeneity across studies (I²=25%)",
      "Funnel plot suggests minimal publication bias",
    ],
    options: [
      {
        id: "a",
        text: "25 of 30 studies used the same flawed measurement instrument",
        optionClass: "core_flip",
        feedbackLine: "Shared measurement bias invalidates aggregated results.",
      },
      {
        id: "b",
        text: "The meta-analysis was funded by the intervention developer",
        optionClass: "confounder_trap",
        feedbackLine: "Funding source doesn't change the pooled data.",
      },
      {
        id: "c",
        text: "Three studies had unusually large effect sizes",
        optionClass: "proxy_symptom",
        feedbackLine: "Outliers are expected and handled in meta-analysis.",
      },
      {
        id: "d",
        text: "The publication was delayed due to formatting issues",
        optionClass: "noise_irrelevant",
        feedbackLine: "Publication delays don't affect scientific validity.",
      },
    ],
    correctOptionId: "a",
  },
  {
    id: "sci_004",
    domain: "Research",
    decisionLabel: "Delay",
    decisionValue: "negative",
    evidenceBullets: [
      "Preliminary study shows promising results (n=25)",
      "Effect size is large but confidence interval is wide",
      "Study not yet replicated",
      "Mechanism of action is unclear",
    ],
    options: [
      {
        id: "a",
        text: "An independent lab has confirmed findings in a preprint with n=200",
        optionClass: "core_flip",
        feedbackLine: "Independent replication with larger sample changes certainty.",
      },
      {
        id: "b",
        text: "The research team is highly regarded in the field",
        optionClass: "confounder_trap",
        feedbackLine: "Team reputation doesn't overcome statistical limitations.",
      },
      {
        id: "c",
        text: "Media coverage of the study has been positive",
        optionClass: "proxy_symptom",
        feedbackLine: "Media coverage is a symptom, not validation.",
      },
      {
        id: "d",
        text: "The study used modern laboratory equipment",
        optionClass: "noise_irrelevant",
        feedbackLine: "Equipment modernity doesn't address sample size issues.",
      },
    ],
    correctOptionId: "a",
  },
];

/**
 * Generate a session with N rounds (no repetition within session)
 */
export function generateSession(difficulty: Difficulty): AuditRound[] {
  const config = DIFFICULTY_CONFIG[difficulty];
  const shuffled = [...ROUNDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, config.rounds);
}

/**
 * Get all rounds (for testing/review)
 */
export function getAllRounds(): AuditRound[] {
  return ROUNDS;
}

// ============================================
// ANTI-REPETITION HASH GENERATION
// ============================================

/**
 * Generate combo hash parameters for Counterfactual Audit session.
 * Used by anti-repetition engine to detect duplicate sessions.
 */
export function getSessionHashParams(
  rounds: AuditRound[],
  difficulty: Difficulty
): { stimulusIds: string[]; difficulty: string } {
  return {
    stimulusIds: rounds.map(r => r.id),
    difficulty,
  };
}
