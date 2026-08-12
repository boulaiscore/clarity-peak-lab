import { Navigate } from "react-router-dom";

/** Legacy sample-report route. Reports are now a live Elite deliverable. */
export default function ReportPreview() {
  return <Navigate to="/app/report" replace />;
}
