import { Navigate, useLocation } from "react-router-dom";

/** Legacy route kept so existing links open the canonical pricing page. */
export default function PaywallPage() {
  const location = useLocation();
  return <Navigate to={`/app/subscription${location.search}`} replace />;
}
