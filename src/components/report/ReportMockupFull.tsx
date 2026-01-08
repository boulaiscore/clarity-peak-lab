import { ReportCover } from "./ReportCover";
import { ReportOverview } from "./ReportOverview";
import { ReportWellbeing } from "./ReportWellbeing";
import { ReportSCI } from "./ReportSCI";
import { ReportDualProcess } from "./ReportDualProcess";
import { ReportDomains } from "./ReportDomains";
import { ReportTrainingAnalytics } from "./ReportTrainingAnalytics";
import { ReportMethodology } from "./ReportMethodology";
import { 
  MOCK_PROFILE, 
  MOCK_METRICS, 
  MOCK_SESSIONS, 
  MOCK_BADGES, 
  MOCK_WEARABLE,
  MOCK_AGGREGATES 
} from "@/lib/mockReportData";

export function ReportMockupFull() {
  const generatedAt = new Date();

  return (
    <div className="relative">
      {/* Sample Report Watermark */}
      <div className="fixed inset-0 pointer-events-none z-10 flex items-center justify-center overflow-hidden">
        <div className="text-[120px] font-bold text-muted/10 rotate-[-30deg] whitespace-nowrap select-none">
          SAMPLE REPORT
        </div>
      </div>

      {/* Report Content */}
      <div className="space-y-8 relative z-0">
        <ReportCover 
          profile={MOCK_PROFILE}
          metrics={MOCK_METRICS}
          generatedAt={generatedAt}
        />

        <ReportOverview 
          profile={MOCK_PROFILE}
          generatedAt={generatedAt}
        />

        <ReportWellbeing 
          metrics={MOCK_METRICS}
          wearable={MOCK_WEARABLE}
          aggregates={MOCK_AGGREGATES}
        />

        <ReportSCI 
          metrics={MOCK_METRICS}
        />

        <ReportDualProcess 
          profile={MOCK_PROFILE}
          metrics={MOCK_METRICS}
        />

        <ReportDomains 
          metrics={MOCK_METRICS}
          aggregates={MOCK_AGGREGATES}
        />

        <ReportTrainingAnalytics
          profile={MOCK_PROFILE}
          metrics={MOCK_METRICS}
          aggregates={MOCK_AGGREGATES}
          sessions={MOCK_SESSIONS}
        />

        <ReportMethodology />
      </div>
    </div>
  );
}
