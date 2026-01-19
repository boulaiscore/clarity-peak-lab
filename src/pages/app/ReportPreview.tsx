import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClinicalReportMockup } from "@/components/report/ClinicalReportMockup";
import "@/styles/clinical-report.css";

export default function ReportPreview() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">Sample Report</h1>
                <Badge variant="secondary" className="text-xs">
                  Preview
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Medical-grade cognitive performance assessment
              </p>
            </div>
          </div>

          <Button 
            onClick={() => navigate("/app/report", { replace: true })}
            className="gap-2"
          >
            <Lock className="h-4 w-4" />
            Unlock Your Report
          </Button>
        </div>
      </div>

      {/* Report Content - Fixed A4, scaled on mobile */}
      <div className="py-8 overflow-x-auto">
        <div 
          className="mx-auto bg-white shadow-lg"
          style={{
            width: '210mm',
            minWidth: '210mm',
          }}
        >
          <ClinicalReportMockup />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="container mx-auto px-4 pb-8">
        <div className="max-w-4xl mx-auto p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl border border-primary/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-semibold flex items-center gap-2 justify-center sm:justify-start">
                <Sparkles className="h-5 w-5 text-primary" />
                Ready to see your real results?
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Unlock your personalized Cognitive Performance Assessment based on your actual training data.
              </p>
            </div>
            <Button 
              size="lg"
              onClick={() => navigate("/app/report", { replace: true })}
              className="gap-2 shrink-0"
            >
              <Lock className="h-4 w-4" />
              Unlock Full Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
