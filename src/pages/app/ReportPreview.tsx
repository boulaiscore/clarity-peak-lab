import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Sparkles, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClinicalReportMockup } from "@/components/report/ClinicalReportMockup";
import "@/styles/clinical-report.css";

export default function ReportPreview() {
  const navigate = useNavigate();
  const [scale, setScale] = useState(0.4); // Start zoomed out on mobile

  const zoomIn = () => setScale((s) => Math.min(s + 0.15, 1));
  const zoomOut = () => setScale((s) => Math.max(s - 0.15, 0.25));

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-3 py-3">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold">Sample Report</h1>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Preview
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={zoomOut}
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[10px] font-medium w-10 text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={zoomIn}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Button 
              size="sm"
              onClick={() => navigate("/app/report", { replace: true })}
              className="gap-1.5 h-8 text-xs"
            >
              <Lock className="h-3 w-3" />
              Unlock
            </Button>
          </div>
        </div>
      </div>

      {/* Report Content - Fixed A4, scalable */}
      <div className="overflow-auto p-4" style={{ maxHeight: 'calc(100vh - 120px)' }}>
        <div 
          className="mx-auto bg-white shadow-lg origin-top transition-transform duration-200"
          style={{
            width: '210mm',
            minWidth: '210mm',
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
          }}
        >
          <ClinicalReportMockup />
        </div>
      </div>

      {/* Bottom CTA - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur-sm border-t">
        <Button 
          variant="premium"
          className="w-full gap-2"
          onClick={() => navigate("/app/report", { replace: true })}
        >
          <Sparkles className="h-4 w-4" />
          Unlock Your Full Report
        </Button>
      </div>
    </div>
  );
}
