/**
 * Legacy area screens ("Focus Arena" → "Choose Training Mode") are removed.
 * Any old link now lands directly on the Lab drills library with the right
 * system already expanded.
 */

import { Navigate, useParams } from "react-router-dom";

const AREA_TO_SYSTEM: Record<string, "fast" | "slow"> = {
  focus: "fast",
  creativity: "fast",
  reasoning: "slow",
  memory: "slow",
  "neuro-activation": "fast",
};

export default function NeuroLabAreaRedirect() {
  const { area } = useParams<{ area: string }>();
  const system = (area && AREA_TO_SYSTEM[area]) ?? "fast";
  return <Navigate to={`/neuro-lab?tab=games&system=${system}`} replace />;
}
