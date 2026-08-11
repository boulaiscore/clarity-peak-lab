import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthedUser, unauthorizedResponse } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL = "google/gemini-2.5-flash";
const MODEL_VERSION = "daily-outlook-copy-gemini-2.5-flash-v3-conversational-health";
const ACTION_KEYS = new Set([
  "recover",
  "protect_attention",
  "protect_capacity",
  "use_capacity",
  "train_focus",
  "train_reasoning",
  "normal_plan",
]);

interface SafeEvidence {
  code: string;
  label: string;
  detail: string;
  tone: "support" | "limit" | "neutral";
}

interface SafeAction {
  key: string;
  label: string;
  shortLabel: string;
  durationMinutes: number | null;
  kind: "guidance" | "lab";
  route: string | null;
  metricCode: string;
  metricLabel: string;
  metricDetail: string;
}

interface SafeHealthSignals {
  sleepDurationMin: number | null;
  sleepEfficiency: number | null;
  hrvMs: number | null;
  restingHr: number | null;
  steps: number | null;
  activeMinutes: number | null;
  observedDate: string | null;
  sources: string[];
}

interface SafeOutlook {
  policyVersion: string;
  headline: string;
  summary: string;
  intensity: "protective" | "steady" | "strong";
  windowLabel: string | null;
  action: SafeAction;
  evidence: SafeEvidence[];
  confidence: number;
  healthSignals: SafeHealthSignals | null;
  stateSnapshot: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function safeText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength ? trimmed : null;
}

function boundedNumber(value: unknown, minimum: number, maximum: number): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null;
}

function parseHealthSignals(value: unknown): SafeHealthSignals | null {
  if (!isRecord(value)) return null;
  const healthSignals: SafeHealthSignals = {
    sleepDurationMin: boundedNumber(value.sleepDurationMin, 0, 24 * 60),
    sleepEfficiency: boundedNumber(value.sleepEfficiency, 0, 100),
    hrvMs: boundedNumber(value.hrvMs, 0, 500),
    restingHr: boundedNumber(value.restingHr, 20, 250),
    steps: boundedNumber(value.steps, 0, 100_000),
    activeMinutes: boundedNumber(value.activeMinutes, 0, 24 * 60),
    observedDate: typeof value.observedDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.observedDate)
      ? value.observedDate
      : null,
    sources: Array.isArray(value.sources)
      ? value.sources.flatMap((source) => {
        const parsed = safeText(source, 40);
        return parsed ? [parsed] : [];
      }).slice(0, 3)
      : [],
  };
  return [
    healthSignals.sleepDurationMin,
    healthSignals.sleepEfficiency,
    healthSignals.hrvMs,
    healthSignals.restingHr,
    healthSignals.steps,
    healthSignals.activeMinutes,
  ].some((item) => item !== null) ? healthSignals : null;
}

function healthSignalsFromStateSnapshot(value: unknown): SafeHealthSignals | null {
  if (!isRecord(value)) return null;
  const passive = isRecord(value.passive) ? value.passive : null;
  return parseHealthSignals(passive?.healthSignals);
}

function parseOutlook(value: unknown): SafeOutlook | null {
  if (!isRecord(value) || !isRecord(value.action) || !Array.isArray(value.evidence)) return null;
  const policyVersion = safeText(value.policyVersion, 80);
  const headline = safeText(value.headline, 160);
  const summary = safeText(value.summary, 1200);
  const intensity = value.intensity;
  const confidence = Number(value.confidence);
  const action = value.action;
  const actionKey = safeText(action.key, 40);
  const actionLabel = safeText(action.label, 160);
  const actionShortLabel = safeText(action.shortLabel, 80);
  const durationMinutes = action.durationMinutes == null ? null : Number(action.durationMinutes);
  const kind = action.kind;
  const metricCode = safeText(action.metricCode, 8);
  const metricLabel = safeText(action.metricLabel, 80);
  const metricDetail = safeText(action.metricDetail, 180);

  if (
    !policyVersion || !headline || !summary ||
    !["protective", "steady", "strong"].includes(String(intensity)) ||
    !Number.isFinite(confidence) || confidence < 0 || confidence > 1 ||
    !actionKey || !ACTION_KEYS.has(actionKey) || !actionLabel || !actionShortLabel ||
    (durationMinutes !== null && (!Number.isFinite(durationMinutes) || durationMinutes < 1 || durationMinutes > 120)) ||
    (kind !== "guidance" && kind !== "lab") ||
    !metricCode || !metricLabel || !metricDetail
  ) {
    return null;
  }

  const evidence = value.evidence.slice(0, 5).flatMap((entry): SafeEvidence[] => {
    if (!isRecord(entry)) return [];
    const code = safeText(entry.code, 8);
    const label = safeText(entry.label, 80);
    const detail = safeText(entry.detail, 180);
    const tone = entry.tone;
    return code && label && detail && (tone === "support" || tone === "limit" || tone === "neutral")
      ? [{ code, label, detail, tone }]
      : [];
  });

  return {
    policyVersion,
    headline,
    summary,
    intensity: intensity as SafeOutlook["intensity"],
    windowLabel: safeText(value.windowLabel, 80),
    action: {
      key: actionKey,
      label: actionLabel,
      shortLabel: actionShortLabel,
      durationMinutes: durationMinutes === null ? null : Math.round(durationMinutes),
      kind,
      route: typeof action.route === "string" ? action.route.slice(0, 160) : null,
      metricCode,
      metricLabel,
      metricDetail,
    },
    evidence,
    confidence,
    healthSignals: parseHealthSignals(value.healthSignals),
    stateSnapshot: isRecord(value.stateSnapshot) ? value.stateSnapshot : {},
  };
}

function numberTokens(value: string): Set<string> {
  return new Set(value.match(/\d+(?:[.,]\d+)?/g) ?? []);
}

function containsOnlyKnownNumbers(output: string, source: string): boolean {
  const allowed = numberTokens(source);
  return [...numberTokens(output)].every((token) => allowed.has(token));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const user = await getAuthedUser(req);
    if (!user) return unauthorizedResponse(corsHeaders);

    const body = await req.json();
    const outlook = parseOutlook(body?.outlook);
    const requestedDate = safeText(body?.outlookDate, 10);
    if (!outlook || !requestedDate || !/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
      return new Response(JSON.stringify({ error: "Invalid outlook payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);
    const outlookDate = requestedDate;

    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, work_type, primary_outcome")
      .eq("user_id", user.id)
      .maybeSingle();
    const tier = String(profile?.subscription_status ?? "free").toLowerCase();
    const isPro = tier === "pro" || tier === "founding_pro" || tier === "elite";
    if (!isPro) {
      return new Response(JSON.stringify({ error: "Pro entitlement required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existing } = await supabase
      .from("daily_outlooks")
      .select("headline, summary, copy_source, model_version, intensity, window_label, primary_action, evidence, state_snapshot")
      .eq("user_id", user.id)
      .eq("outlook_date", outlookDate)
      .eq("policy_version", outlook.policyVersion)
      .maybeSingle();
    const sameCopyBasis = existing &&
      existing.intensity === outlook.intensity &&
      existing.window_label === outlook.windowLabel &&
      JSON.stringify(existing.primary_action) === JSON.stringify(outlook.action) &&
      JSON.stringify(existing.evidence) === JSON.stringify(outlook.evidence) &&
      JSON.stringify(healthSignalsFromStateSnapshot(existing.state_snapshot)) === JSON.stringify(outlook.healthSignals);
    if (existing?.copy_source === "ai" && existing.model_version === MODEL_VERSION && sameCopyBasis) {
      return new Response(JSON.stringify({
        headline: existing.headline,
        summary: existing.summary,
        copySource: "ai",
        modelVersion: MODEL_VERSION,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const factualSource = JSON.stringify({
      role: profile?.work_type ?? null,
      outcome: profile?.primary_outcome ?? null,
      headline: outlook.headline,
      summary: outlook.summary,
      intensity: outlook.intensity,
      window: outlook.windowLabel,
      action: outlook.action,
      evidence: outlook.evidence,
      healthSignals: outlook.healthSignals,
    });
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `You are the LOOMA Daily Coach for a non-medical cognitive performance app. Write a warm, conversational and premium daily briefing using only the supplied facts. Address the user naturally in second person, as a thoughtful coach who knows their recent context—not as a dashboard listing values. Write one cohesive paragraph of 80–120 words and 4–5 sentences. Begin with today's cognitive state, weave in the most relevant 2–3 signals, and finish by naturally introducing the exact action selected by the explainable policy. If granular healthSignals are supplied, mention at least one relevant observation such as sleep, HRV, resting heart rate or movement. A raw health observation is context only: never call it good, poor, high or low and never infer a cause unless that comparison or relationship is explicitly present in evidence. Never add metrics, numbers, causes, diagnoses, guarantees, health claims, baseline comparisons or recommendations that are not supplied. Never imply intelligence or fixed ability. Do not invent a work block, duration, task or protocol. Use no bullets or markdown. Keep the headline under 7 words. The action is selected by a separate explainable policy and must not be changed.`,
          },
          { role: "user", content: factualSource },
        ],
        tools: [{
          type: "function",
          function: {
            name: "write_daily_outlook",
            description: "Return bounded Daily Outlook copy using only supplied facts",
            parameters: {
              type: "object",
              properties: {
                headline: { type: "string", maxLength: 80 },
                summary: { type: "string", maxLength: 1200 },
              },
              required: ["headline", "summary"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "write_daily_outlook" } },
      }),
    });
    if (!aiResponse.ok) throw new Error(`AI gateway error: ${aiResponse.status}`);

    const responseBody = await aiResponse.json();
    const rawArguments = responseBody.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const generated = typeof rawArguments === "string" ? JSON.parse(rawArguments) : null;
    const headline = safeText(generated?.headline, 80);
    const summary = safeText(generated?.summary, 1200);
    const safeGeneratedCopy = headline && summary &&
      containsOnlyKnownNumbers(`${headline} ${summary}`, factualSource);
    const finalHeadline = safeGeneratedCopy ? headline : outlook.headline;
    const finalSummary = safeGeneratedCopy ? summary : outlook.summary;
    const copySource = safeGeneratedCopy ? "ai" : "deterministic";

    const { error: upsertError } = await supabase.from("daily_outlooks").upsert({
      user_id: user.id,
      outlook_date: outlookDate,
      policy_version: outlook.policyVersion,
      plan_id: tier === "founding_pro" ? "founding_pro" : "pro",
      headline: finalHeadline,
      summary: finalSummary,
      intensity: outlook.intensity,
      window_label: outlook.windowLabel,
      primary_action: outlook.action,
      evidence: outlook.evidence,
      state_snapshot: outlook.stateSnapshot,
      confidence: outlook.confidence,
      copy_source: copySource,
      model_version: copySource === "ai" ? MODEL_VERSION : null,
    }, { onConflict: "user_id,outlook_date,policy_version" });
    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({
      headline: finalHeadline,
      summary: finalSummary,
      copySource,
      modelVersion: copySource === "ai" ? MODEL_VERSION : null,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[generate-daily-outlook]", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Daily Outlook unavailable",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
