import { ReportCover } from "./ReportCover";
import { ReportSCI } from "./ReportSCI";
import { ReportDualProcess } from "./ReportDualProcess";
import { ReportDomains } from "./ReportDomains";
import { ReportTrainingAnalytics } from "./ReportTrainingAnalytics";
import { 
  MOCK_PROFILE, 
  MOCK_METRICS, 
  MOCK_SESSIONS, 
  MOCK_AGGREGATES 
} from "@/lib/mockReportData";
import { Brain, Target, Zap, TrendingUp, Award, Calendar, Clock, BarChart3 } from "lucide-react";

export function ReportMockupFull() {
  const generatedAt = new Date();

  // Calculate some mock values
  const cognitiveAge = 32;
  const actualAge = 36;
  const ageDiff = actualAge - cognitiveAge;

  return (
    <div className="relative report-root">
      {/* Sample Report Watermark */}
      <div className="fixed inset-0 pointer-events-none z-10 flex items-center justify-center overflow-hidden">
        <div className="text-[100px] font-bold text-gray-200/30 rotate-[-30deg] whitespace-nowrap select-none">
          SAMPLE REPORT
        </div>
      </div>

      {/* Report Content */}
      <div className="relative z-0">
        {/* Cover Page */}
        <div className="p-8 bg-gradient-to-br from-teal-600 to-teal-700 text-white">
          <div className="flex items-center gap-3 mb-8">
            <Brain className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">NeuroLoop Pro</h1>
              <p className="text-sm opacity-80">Cognitive Performance Lab</p>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold mb-2">Cognitive Intelligence Report</h2>
          <p className="opacity-80 mb-8">Comprehensive Assessment Results</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="opacity-70">Participant:</span>
              <span className="ml-2 font-semibold">{MOCK_PROFILE.name}</span>
            </div>
            <div>
              <span className="opacity-70">Date:</span>
              <span className="ml-2 font-semibold">{generatedAt.toLocaleDateString("en-GB")}</span>
            </div>
          </div>
        </div>

        {/* Cognitive Age Section */}
        <div className="p-8 border-b">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-teal-600" />
            Cognitive Age Analysis
          </h3>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-teal-700">{cognitiveAge}</div>
              <div className="text-sm text-teal-600 font-medium">Cognitive Age</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-gray-700">{actualAge}</div>
              <div className="text-sm text-gray-600 font-medium">Chronological Age</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-green-600">-{ageDiff}</div>
              <div className="text-sm text-green-600 font-medium">Years Younger</div>
            </div>
          </div>
          
          <p className="mt-6 text-sm text-gray-600 leading-relaxed">
            Your cognitive performance suggests a brain age of <strong>{cognitiveAge} years</strong>, 
            which is <strong>{ageDiff} years younger</strong> than your chronological age. 
            This indicates excellent cognitive maintenance and neuroplastic potential.
          </p>
        </div>

        {/* SCI Score Section */}
        <div className="p-8 border-b">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-teal-600" />
            Synthesized Cognitive Index (SCI)
          </h3>
          
          <div className="flex items-center gap-8">
            <div className="relative">
              <svg viewBox="0 0 120 120" className="w-32 h-32">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                <circle 
                  cx="60" cy="60" r="50" 
                  fill="none" stroke="#0d9488" strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(MOCK_METRICS.cognitive_performance_score / 100) * 314} 314`}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold text-gray-900">{MOCK_METRICS.cognitive_performance_score}</span>
                <span className="text-xs text-gray-500">SCI Score</span>
              </div>
            </div>
            
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">{MOCK_METRICS.fast_thinking}</div>
                <div className="text-sm text-orange-700">System 1 (Fast)</div>
                <div className="text-xs text-gray-500">Intuitive thinking</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{MOCK_METRICS.slow_thinking}</div>
                <div className="text-sm text-blue-700">System 2 (Slow)</div>
                <div className="text-xs text-gray-500">Analytical thinking</div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-teal-50 rounded-lg border border-teal-100">
            <p className="text-sm text-teal-800">
              <strong>Interpretation:</strong> Your SCI of {MOCK_METRICS.cognitive_performance_score} places you in the 
              <strong> HIGH performance</strong> category. This reflects strong cognitive functioning across 
              multiple domains with balanced dual-process thinking.
            </p>
          </div>
        </div>

        {/* Domain Scores */}
        <div className="p-8 border-b">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            Cognitive Domain Analysis
          </h3>
          
          <div className="space-y-4">
            {[
              { name: "Focus & Attention", score: MOCK_METRICS.focus_stability, color: "bg-purple-500", baseline: 65 },
              { name: "Logical Reasoning", score: MOCK_METRICS.reasoning_accuracy, color: "bg-blue-500", baseline: 62 },
              { name: "Creative Cognition", score: MOCK_METRICS.creativity, color: "bg-pink-500", baseline: 70 },
              { name: "Visual Processing", score: MOCK_METRICS.visual_processing, color: "bg-green-500", baseline: 68 },
              { name: "Decision Quality", score: MOCK_METRICS.decision_quality, color: "bg-amber-500", baseline: 60 },
            ].map((domain) => (
              <div key={domain.name} className="flex items-center gap-4">
                <div className="w-36 text-sm font-medium text-gray-700">{domain.name}</div>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                  <div 
                    className={`h-full ${domain.color} rounded-full transition-all`}
                    style={{ width: `${domain.score}%` }}
                  />
                  <div 
                    className="absolute top-0 h-full w-0.5 bg-gray-400"
                    style={{ left: `${domain.baseline}%` }}
                    title={`Baseline: ${domain.baseline}`}
                  />
                </div>
                <div className="w-16 text-right">
                  <span className="text-lg font-bold text-gray-900">{domain.score}</span>
                  <span className="text-xs text-green-600 ml-1">+{domain.score - domain.baseline}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-gray-400" />
              <span>Baseline</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded" />
              <span>Current Score</span>
            </div>
          </div>
        </div>

        {/* Training Stats */}
        <div className="p-8 border-b">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            Training Analytics
          </h3>
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{MOCK_METRICS.total_sessions}</div>
              <div className="text-xs text-gray-500">Total Sessions</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{MOCK_AGGREGATES.accuracyRatePct}%</div>
              <div className="text-xs text-gray-500">Accuracy Rate</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-teal-600">{MOCK_METRICS.experience_points}</div>
              <div className="text-xs text-gray-500">Total XP</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">Lv.{MOCK_METRICS.cognitive_level}</div>
              <div className="text-xs text-gray-500">Cognitive Level</div>
            </div>
          </div>
          
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Sessions by Area</h4>
          <div className="grid grid-cols-3 gap-4">
            {[
              { area: "Focus Arena", count: MOCK_AGGREGATES.sessionsByArea.focus, color: "bg-purple-100 text-purple-700" },
              { area: "Critical Reasoning", count: MOCK_AGGREGATES.sessionsByArea.reasoning, color: "bg-blue-100 text-blue-700" },
              { area: "Creativity Hub", count: MOCK_AGGREGATES.sessionsByArea.creativity, color: "bg-pink-100 text-pink-700" },
            ].map((item) => (
              <div key={item.area} className={`${item.color} rounded-lg p-4`}>
                <div className="text-2xl font-bold">{item.count}</div>
                <div className="text-sm font-medium">{item.area}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="p-8 border-b">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-teal-600" />
            Achievements Earned
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: "Focus Master", desc: "90%+ accuracy in Focus", icon: "🎯" },
              { name: "Week Warrior", desc: "7-day training streak", icon: "🔥" },
              { name: "Level 10", desc: "Reached cognitive level 10", icon: "⭐" },
              { name: "Creative Spark", desc: "10 creativity sessions", icon: "💡" },
            ].map((badge) => (
              <div key={badge.name} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <span className="text-2xl">{badge.icon}</span>
                <div>
                  <div className="font-semibold text-amber-800">{badge.name}</div>
                  <div className="text-xs text-amber-600">{badge.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            Personalized Recommendations
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <h4 className="font-semibold text-blue-900">Priority Training Area</h4>
              <p className="text-sm text-blue-800 mt-1">
                Focus on <strong>Logical Reasoning</strong> exercises to balance your cognitive profile. 
                Aim for 3-4 sessions per week targeting this domain.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <h4 className="font-semibold text-green-900">Maintain Strengths</h4>
              <p className="text-sm text-green-800 mt-1">
                Your <strong>Creativity</strong> score is excellent. Continue with weekly creativity 
                sessions to maintain this cognitive strength.
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
              <h4 className="font-semibold text-purple-900">Optimal Training Schedule</h4>
              <p className="text-sm text-purple-800 mt-1">
                Based on your patterns, training in the <strong>morning (9-11 AM)</strong> yields 
                your best performance. Consider scheduling sessions during this window.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 text-center text-xs text-gray-500 border-t">
          <p>
            This cognitive assessment report is generated by NeuroLoop's analysis algorithms based on training data.
            Results are for educational and self-improvement purposes. This is not a clinical neuropsychological evaluation.
          </p>
          <p className="mt-2 font-medium">
            NeuroLoop Pro • Generated {generatedAt.toLocaleDateString("en-GB")}
          </p>
        </div>
      </div>
    </div>
  );
}
