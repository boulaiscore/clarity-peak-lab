import { format } from "date-fns";
import { FileText, Calendar, Brain, Zap } from "lucide-react";
import { ReportGeneration } from "@/hooks/useReportHistory";
import { Skeleton } from "@/components/ui/skeleton";

interface ReportHistoryListProps {
  reports: ReportGeneration[];
  isLoading: boolean;
  onSelectReport?: (report: ReportGeneration) => void;
}

export function ReportHistoryList({ reports, isLoading, onSelectReport }: ReportHistoryListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No reports generated yet</p>
        <p className="text-xs mt-1">Download your first report to see it here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {reports.map((report) => (
        <button
          key={report.id}
          onClick={() => onSelectReport?.(report)}
          className="w-full p-3 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Cognitive Report</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  PDF
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(report.generated_at), "dd MMM yyyy")}
                </span>
                {report.cognitive_age && (
                  <span className="flex items-center gap-1">
                    <Brain className="w-3 h-3" />
                    Age {report.cognitive_age}
                  </span>
                )}
                {report.sci_score && (
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    SCI {Math.round(report.sci_score)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
