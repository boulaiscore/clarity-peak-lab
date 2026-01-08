import { 
  MOCK_PROFILE, 
  MOCK_METRICS, 
  MOCK_AGGREGATES 
} from "@/lib/mockReportData";
import { 
  Brain, 
  Target, 
  Zap, 
  TrendingUp, 
  Award, 
  Calendar, 
  BarChart3, 
  AlertTriangle,
  CheckCircle2,
  Activity,
  Lightbulb,
  Clock,
  Calculator,
  Info,
  Stethoscope,
  FileText,
  Shield
} from "lucide-react";

export function ReportMockupFull() {
  const generatedAt = new Date();
  const reportId = `NLP-${Date.now().toString(36).toUpperCase()}`;

  // Calculate mock values
  const cognitiveAge = 32;
  const actualAge = 36;
  const ageDiff = actualAge - cognitiveAge;

  // Mock SCI breakdown
  const sciBreakdown = {
    performance: 76,
    engagement: 82,
    recovery: 68,
    total: MOCK_METRICS.cognitive_performance_score
  };

  // Calculate clinical interpretation
  const getClinicalStatus = (score: number) => {
    if (score >= 80) return { label: "Superior", color: "text-emerald-700", bg: "bg-emerald-50" };
    if (score >= 65) return { label: "Above Average", color: "text-blue-700", bg: "bg-blue-50" };
    if (score >= 50) return { label: "Average", color: "text-gray-700", bg: "bg-gray-50" };
    if (score >= 35) return { label: "Below Average", color: "text-amber-700", bg: "bg-amber-50" };
    return { label: "Needs Attention", color: "text-red-700", bg: "bg-red-50" };
  };

  const overallStatus = getClinicalStatus(sciBreakdown.total);

  return (
    <div className="relative report-root bg-white text-gray-900">
      {/* Sample Report Watermark */}
      <div className="fixed inset-0 pointer-events-none z-10 flex items-center justify-center overflow-hidden">
        <div className="text-[80px] font-bold text-gray-200/20 rotate-[-30deg] whitespace-nowrap select-none tracking-widest">
          SAMPLE REPORT
        </div>
      </div>

      {/* Report Content */}
      <div className="relative z-0">
        
        {/* ===== COVER PAGE ===== */}
        <div className="min-h-[400px] bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 text-white p-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Brain className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">NeuroLoop Pro</h1>
                <p className="text-xs text-white/60 uppercase tracking-widest">Cognitive Performance Laboratory</p>
              </div>
            </div>
            <div className="text-right text-xs text-white/50">
              <p>Report ID: {reportId}</p>
              <p>Classification: Confidential</p>
            </div>
          </div>
          
          {/* Title */}
          <div className="mb-10">
            <p className="text-sm text-white/50 uppercase tracking-widest mb-2">Comprehensive Assessment</p>
            <h2 className="text-4xl font-bold tracking-tight mb-2">Cognitive Intelligence Report</h2>
            <div className="w-20 h-1 bg-teal-400 rounded-full" />
          </div>
          
          {/* Participant Info Grid */}
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div className="space-y-3">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Participant</span>
                <span className="font-semibold">{MOCK_PROFILE.name}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Age</span>
                <span className="font-semibold">{actualAge} years</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Training Plan</span>
                <span className="font-semibold">Expert</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Assessment Date</span>
                <span className="font-semibold">{generatedAt.toLocaleDateString("en-GB")}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Sessions Analyzed</span>
                <span className="font-semibold">{MOCK_METRICS.total_sessions}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Assessment Period</span>
                <span className="font-semibold">30 days</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== EXECUTIVE SUMMARY ===== */}
        <div className="p-8 border-b-4 border-teal-600">
          <div className="flex items-center gap-2 mb-6">
            <Stethoscope className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Executive Summary</h3>
          </div>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-4 text-center border border-teal-200">
              <div className="text-3xl font-bold text-teal-700">{cognitiveAge}</div>
              <div className="text-[10px] text-teal-600 font-semibold uppercase tracking-wide">Cognitive Age</div>
              <div className="text-xs text-teal-500 mt-1">-{ageDiff} years</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center border border-blue-200">
              <div className="text-3xl font-bold text-blue-700">{sciBreakdown.total}</div>
              <div className="text-[10px] text-blue-600 font-semibold uppercase tracking-wide">SCI Score</div>
              <div className={`text-xs mt-1 ${overallStatus.color}`}>{overallStatus.label}</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 text-center border border-orange-200">
              <div className="text-3xl font-bold text-orange-700">{MOCK_METRICS.fast_thinking}</div>
              <div className="text-[10px] text-orange-600 font-semibold uppercase tracking-wide">System 1</div>
              <div className="text-xs text-orange-500 mt-1">Fast Thinking</div>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 text-center border border-indigo-200">
              <div className="text-3xl font-bold text-indigo-700">{MOCK_METRICS.slow_thinking}</div>
              <div className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wide">System 2</div>
              <div className="text-xs text-indigo-500 mt-1">Analytical Thinking</div>
            </div>
          </div>

          {/* Clinical Summary Box */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong>Clinical Summary:</strong> The participant demonstrates <strong>{overallStatus.label.toLowerCase()}</strong> cognitive 
              performance with a Synthesized Cognitive Index of <strong>{sciBreakdown.total}/100</strong>. Cognitive age 
              assessment indicates brain function equivalent to a <strong>{cognitiveAge}-year-old</strong>, which is 
              <strong> {ageDiff} years younger</strong> than chronological age. This suggests excellent neuroplastic 
              adaptation and cognitive maintenance protocols.
            </p>
          </div>
        </div>

        {/* ===== COGNITIVE AGE ANALYSIS ===== */}
        <div className="p-8 border-b">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Cognitive Age Analysis</h3>
          </div>
          
          <div className="grid grid-cols-12 gap-6">
            {/* Age Comparison Chart */}
            <div className="col-span-5">
              <div className="relative h-48 flex items-end justify-center gap-8">
                {/* Cognitive Age Bar */}
                <div className="flex flex-col items-center">
                  <div 
                    className="w-16 bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-lg flex items-end justify-center pb-2"
                    style={{ height: `${(cognitiveAge / 50) * 160}px` }}
                  >
                    <span className="text-white font-bold text-lg">{cognitiveAge}</span>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-teal-700 text-center">Cognitive<br/>Age</div>
                </div>
                {/* Chronological Age Bar */}
                <div className="flex flex-col items-center">
                  <div 
                    className="w-16 bg-gradient-to-t from-gray-500 to-gray-400 rounded-t-lg flex items-end justify-center pb-2"
                    style={{ height: `${(actualAge / 50) * 160}px` }}
                  >
                    <span className="text-white font-bold text-lg">{actualAge}</span>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-gray-600 text-center">Chronological<br/>Age</div>
                </div>
              </div>
            </div>

            {/* Interpretation */}
            <div className="col-span-7 space-y-4">
              <div className="p-4 bg-teal-50 rounded-lg border-l-4 border-teal-500">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span className="font-semibold text-teal-800 text-sm">Favorable Result</span>
                </div>
                <p className="text-sm text-teal-700">
                  Your cognitive performance indicates a brain function age of <strong>{cognitiveAge} years</strong>, 
                  which is <strong>{ageDiff} years younger</strong> than your chronological age of {actualAge}.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-500 mb-1">Age Differential</div>
                  <div className="text-lg font-bold text-green-600">-{ageDiff} years</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-500 mb-1">Percentile Rank</div>
                  <div className="text-lg font-bold text-blue-600">Top 15%</div>
                </div>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                <strong>Note:</strong> Cognitive age is calculated based on reasoning speed, clarity, decision quality, 
                focus stability, and creative cognition metrics compared to normative age-matched samples.
              </p>
            </div>
          </div>
        </div>

        {/* ===== SYNTHESIZED COGNITIVE INDEX ===== */}
        <div className="p-8 border-b">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Synthesized Cognitive Index (SCI)</h3>
          </div>
          
          <div className="grid grid-cols-12 gap-6">
            {/* SCI Gauge */}
            <div className="col-span-4 flex justify-center">
              <div className="relative">
                <svg viewBox="0 0 140 140" className="w-36 h-36">
                  {/* Background circle */}
                  <circle cx="70" cy="70" r="60" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                  {/* Progress circle */}
                  <circle 
                    cx="70" cy="70" r="60" 
                    fill="none" stroke="url(#sciGradient)" strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(sciBreakdown.total / 100) * 377} 377`}
                    transform="rotate(-90 70 70)"
                  />
                  <defs>
                    <linearGradient id="sciGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0d9488" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-4xl font-bold text-gray-900">{sciBreakdown.total}</span>
                  <span className="text-xs text-gray-500 font-medium">/ 100</span>
                </div>
              </div>
            </div>

            {/* SCI Components */}
            <div className="col-span-8">
              <div className="space-y-4">
                {/* Component bars */}
                {[
                  { name: "Cognitive Performance", value: sciBreakdown.performance, weight: "50%", color: "bg-teal-500" },
                  { name: "Behavioral Engagement", value: sciBreakdown.engagement, weight: "30%", color: "bg-blue-500" },
                  { name: "Recovery Factor", value: sciBreakdown.recovery, weight: "20%", color: "bg-purple-500" },
                ].map((component) => (
                  <div key={component.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{component.name}</span>
                      <span className="text-gray-500">Weight: {component.weight}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${component.color} rounded-full transition-all`}
                          style={{ width: `${component.value}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-700 w-10 text-right">{component.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-800">
                  <strong>Interpretation:</strong> SCI of {sciBreakdown.total} indicates {overallStatus.label.toLowerCase()} cognitive 
                  function with strong engagement patterns. Performance component drives primary scoring contribution.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ===== DUAL-PROCESS INTEGRATION ===== */}
        <div className="p-8 border-b">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Dual-Process Integration</h3>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* System 1 */}
            <div className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-orange-800">System 1 (Fast)</h4>
                  <p className="text-xs text-orange-600">Intuitive Processing</p>
                </div>
                <div className="text-3xl font-bold text-orange-600">{MOCK_METRICS.fast_thinking}</div>
              </div>
              <div className="space-y-2 text-xs text-orange-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Quick pattern recognition</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Automatic responses</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Intuitive decision-making</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-orange-200">
                <div className="flex justify-between text-xs">
                  <span className="text-orange-600">Baseline</span>
                  <span className="font-semibold text-orange-800">{MOCK_METRICS.baseline_fast_thinking}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-orange-600">Improvement</span>
                  <span className="font-semibold text-green-600">+{MOCK_METRICS.fast_thinking - MOCK_METRICS.baseline_fast_thinking}</span>
                </div>
              </div>
            </div>

            {/* System 2 */}
            <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-indigo-800">System 2 (Slow)</h4>
                  <p className="text-xs text-indigo-600">Analytical Processing</p>
                </div>
                <div className="text-3xl font-bold text-indigo-600">{MOCK_METRICS.slow_thinking}</div>
              </div>
              <div className="space-y-2 text-xs text-indigo-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Deliberate reasoning</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Complex problem-solving</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Critical analysis</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-indigo-200">
                <div className="flex justify-between text-xs">
                  <span className="text-indigo-600">Baseline</span>
                  <span className="font-semibold text-indigo-800">{MOCK_METRICS.baseline_slow_thinking}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-indigo-600">Improvement</span>
                  <span className="font-semibold text-green-600">+{MOCK_METRICS.slow_thinking - MOCK_METRICS.baseline_slow_thinking}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Assessment */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <h5 className="text-sm font-semibold text-gray-800 mb-2">Integration Balance</h5>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-4 bg-gradient-to-r from-orange-400 via-gray-200 to-indigo-400 rounded-full relative">
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-gray-800 rounded-full"
                  style={{ left: `${50 + ((MOCK_METRICS.fast_thinking - MOCK_METRICS.slow_thinking) / 2)}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>System 1 Dominant</span>
              <span>Balanced</span>
              <span>System 2 Dominant</span>
            </div>
          </div>
        </div>

        {/* ===== COGNITIVE DOMAIN ANALYSIS ===== */}
        <div className="p-8 border-b">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Cognitive Domain Analysis</h3>
          </div>
          
          <div className="space-y-4">
            {[
              { name: "Focus & Attention", score: MOCK_METRICS.focus_stability, baseline: 65, color: "bg-purple-500", icon: "🎯" },
              { name: "Logical Reasoning", score: MOCK_METRICS.reasoning_accuracy, baseline: 62, color: "bg-blue-500", icon: "🧠" },
              { name: "Creative Cognition", score: MOCK_METRICS.creativity, baseline: 70, color: "bg-pink-500", icon: "💡" },
              { name: "Visual Processing", score: MOCK_METRICS.visual_processing, baseline: 68, color: "bg-green-500", icon: "👁️" },
              { name: "Decision Quality", score: MOCK_METRICS.decision_quality, baseline: 60, color: "bg-amber-500", icon: "⚖️" },
            ].map((domain) => {
              const delta = domain.score - domain.baseline;
              const status = getClinicalStatus(domain.score);
              return (
                <div key={domain.name} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">{domain.icon}</span>
                    <span className="font-semibold text-gray-800 text-sm flex-1">{domain.name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden relative">
                      {/* Baseline marker */}
                      <div 
                        className="absolute top-0 h-full w-0.5 bg-gray-500 z-10"
                        style={{ left: `${domain.baseline}%` }}
                      />
                      <div 
                        className={`h-full ${domain.color} rounded-full transition-all`}
                        style={{ width: `${domain.score}%` }}
                      />
                    </div>
                    <div className="text-right w-20">
                      <span className="text-lg font-bold text-gray-900">{domain.score}</span>
                      <span className={`text-xs ml-1 ${delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {delta >= 0 ? '+' : ''}{delta}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 flex items-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-gray-500" />
              <span>Baseline Score</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded" />
              <span>Current Score</span>
            </div>
          </div>
        </div>

        {/* ===== TRAINING ANALYTICS ===== */}
        <div className="p-8 border-b">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Training Analytics</h3>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Sessions", value: MOCK_METRICS.total_sessions, icon: Calendar },
              { label: "Accuracy Rate", value: `${MOCK_AGGREGATES.accuracyRatePct}%`, icon: Target },
              { label: "Total XP", value: MOCK_METRICS.experience_points.toLocaleString(), icon: Zap },
              { label: "Cognitive Level", value: `Lv.${MOCK_METRICS.cognitive_level}`, icon: Award },
            ].map((stat) => (
              <div key={stat.label} className="p-4 bg-slate-50 rounded-lg border text-center">
                <stat.icon className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
          
          {/* Sessions by Area */}
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Sessions by Training Area</h4>
          <div className="grid grid-cols-3 gap-4">
            {[
              { area: "Focus Arena", count: MOCK_AGGREGATES.sessionsByArea.focus, color: "bg-purple-100 text-purple-800 border-purple-200" },
              { area: "Critical Reasoning", count: MOCK_AGGREGATES.sessionsByArea.reasoning, color: "bg-blue-100 text-blue-800 border-blue-200" },
              { area: "Creativity Hub", count: MOCK_AGGREGATES.sessionsByArea.creativity, color: "bg-pink-100 text-pink-800 border-pink-200" },
            ].map((item) => (
              <div key={item.area} className={`${item.color} rounded-lg p-4 border`}>
                <div className="text-2xl font-bold">{item.count}</div>
                <div className="text-sm font-medium">{item.area}</div>
                <div className="text-xs opacity-70">sessions completed</div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== ACHIEVEMENTS ===== */}
        <div className="p-8 border-b">
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Achievements Earned</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: "Focus Master", desc: "90%+ accuracy in Focus Arena", icon: "🎯", date: "Jan 5" },
              { name: "Week Warrior", desc: "7-day training streak", icon: "🔥", date: "Jan 3" },
              { name: "Level 10", desc: "Reached cognitive level 10", icon: "⭐", date: "Dec 28" },
              { name: "Creative Spark", desc: "10 creativity sessions", icon: "💡", date: "Dec 22" },
            ].map((badge) => (
              <div key={badge.name} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <span className="text-2xl">{badge.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold text-amber-900 text-sm">{badge.name}</div>
                  <div className="text-xs text-amber-700">{badge.desc}</div>
                </div>
                <div className="text-xs text-amber-500">{badge.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== CLINICAL INTERPRETATION ===== */}
        <div className="p-8 border-b bg-slate-50">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Clinical Interpretation</h3>
          </div>

          <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
            <p>
              Based on comprehensive analysis of {MOCK_METRICS.total_sessions} training sessions over a 30-day period, 
              the participant demonstrates <strong>{overallStatus.label.toLowerCase()}</strong> cognitive performance 
              with notable strengths in creative cognition and visual processing.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <h5 className="font-semibold text-green-800 flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Key Strengths
                </h5>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Creative cognition ({MOCK_METRICS.creativity}) exceeds normative range</li>
                  <li>• Strong visual processing capabilities</li>
                  <li>• Balanced dual-process integration</li>
                  <li>• Consistent training engagement</li>
                </ul>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                <h5 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Areas for Development
                </h5>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Decision quality could benefit from focused training</li>
                  <li>• Recovery factor shows room for optimization</li>
                  <li>• Consider increasing System 2 exercises</li>
                </ul>
              </div>
            </div>

            <p>
              The participant's cognitive age of <strong>{cognitiveAge} years</strong> compared to chronological age 
              of <strong>{actualAge} years</strong> indicates effective cognitive maintenance. The {ageDiff}-year 
              differential places the participant in the <strong>top 15th percentile</strong> for age-matched peers.
            </p>

            <p>
              <strong>Prognosis:</strong> With continued training adherence and focus on identified development areas, 
              projected SCI improvement of 5-8 points over the next 30-day cycle is anticipated. Recommended focus 
              on logical reasoning and decision-quality exercises to achieve balanced cognitive optimization.
            </p>
          </div>
        </div>

        {/* ===== RECOMMENDATIONS ===== */}
        <div className="p-8 border-b">
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Personalized Recommendations</h3>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Priority Training Area</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    Increase focus on <strong>Logical Reasoning</strong> exercises to optimize System 2 performance. 
                    Aim for 3-4 dedicated sessions per week targeting analytical processing.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-900">Maintain Strengths</h4>
                  <p className="text-sm text-green-800 mt-1">
                    Your <strong>Creative Cognition</strong> score of {MOCK_METRICS.creativity} is excellent. 
                    Continue with 1-2 weekly creativity sessions to preserve this cognitive strength.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-purple-900">Optimal Training Schedule</h4>
                  <p className="text-sm text-purple-800 mt-1">
                    Analysis indicates peak performance during <strong>morning hours (9-11 AM)</strong>. 
                    Schedule cognitively demanding sessions during this window for optimal results.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== HOW WE CALCULATE YOUR METRICS ===== */}
        <div className="p-8 border-b">
          <div className="flex items-center gap-2 mb-6">
            <Calculator className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">How We Calculate Your Metrics</h3>
          </div>

          <div className="space-y-5 text-sm">
            {/* Cognitive Age */}
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-teal-600" />
                Cognitive Age Calculation
              </h4>
              <p className="text-gray-600 mb-3">
                Cognitive age is derived by comparing your performance across five core domains against 
                age-normalized baselines from our research database.
              </p>
              <div className="p-3 bg-white rounded border font-mono text-xs">
                <p className="text-gray-700 font-semibold mb-1">Formula:</p>
                <p className="text-gray-600">Cognitive Age = Baseline Age − (Performance Improvement ÷ 10)</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Every 10-point improvement in average domain score corresponds to 1 year of cognitive age reduction.
              </p>
            </div>

            {/* SCI Calculation */}
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-teal-600" />
                Synthesized Cognitive Index (SCI)
              </h4>
              <p className="text-gray-600 mb-3">
                SCI integrates three weighted components to provide a holistic cognitive performance score:
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                  <p className="font-semibold text-teal-700 text-xs mb-1">Performance (50%)</p>
                  <p className="text-xs text-teal-600">Core cognitive abilities from training results</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-semibold text-blue-700 text-xs mb-1">Engagement (30%)</p>
                  <p className="text-xs text-blue-600">Training consistency and session completion</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="font-semibold text-purple-700 text-xs mb-1">Recovery (20%)</p>
                  <p className="text-xs text-purple-600">Rest patterns and cognitive recovery indicators</p>
                </div>
              </div>
            </div>

            {/* XP System */}
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-teal-600" />
                XP & Level System
              </h4>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="p-2 bg-amber-50 rounded border border-amber-200 text-center">
                  <p className="font-semibold text-amber-700 text-xs">Games</p>
                  <p className="text-xs text-amber-600">3-8 XP per exercise</p>
                </div>
                <div className="p-2 bg-teal-50 rounded border border-teal-200 text-center">
                  <p className="font-semibold text-teal-700 text-xs">Tasks</p>
                  <p className="text-xs text-teal-600">8-12 XP per content</p>
                </div>
                <div className="p-2 bg-green-50 rounded border border-green-200 text-center">
                  <p className="font-semibold text-green-700 text-xs">Detox</p>
                  <p className="text-xs text-green-600">0.05 XP per minute</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Cognitive level advances every 1,000 XP earned. Higher levels unlock advanced training content 
                and provide bonus multipliers for weekly progress.
              </p>
            </div>

            {/* Score Updates */}
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-teal-600" />
                How Training Updates Your Scores
              </h4>
              <div className="p-3 bg-white rounded border font-mono text-xs mb-3">
                <p className="text-gray-700 font-semibold mb-1">Update Formula:</p>
                <p className="text-gray-600">New Value = min(100, Current Value + Earned Points × 0.5)</p>
              </div>
              <p className="text-xs text-gray-500">
                The 0.5× dampening factor prevents rapid score inflation—consistent training over time 
                is required for meaningful improvement in cognitive metrics.
              </p>
            </div>
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              <span className="font-semibold">NeuroLoop Pro</span>
            </div>
            <div className="text-xs text-white/60">
              Report ID: {reportId}
            </div>
          </div>
          
          <div className="text-xs text-white/50 leading-relaxed">
            <p className="mb-2">
              <strong className="text-white/70">Disclaimer:</strong> This cognitive assessment report is generated by 
              NeuroLoop's proprietary analysis algorithms based on user training data and performance metrics. 
              Results are intended for educational and self-improvement purposes only.
            </p>
            <p className="mb-4">
              This report does not constitute a clinical neuropsychological evaluation, medical diagnosis, 
              or professional healthcare advice. For clinical cognitive assessment, please consult a licensed 
              neuropsychologist or healthcare provider.
            </p>
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <p>Generated: {generatedAt.toLocaleDateString("en-GB")} at {generatedAt.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' })}</p>
              <p>© {generatedAt.getFullYear()} SuperHuman Labs • Cognitive Performance Engineering</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
