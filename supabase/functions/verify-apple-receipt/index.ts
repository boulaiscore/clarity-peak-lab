import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REVENUECAT_WEBHOOK_SECRET = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");

type PaidPlan = "core" | "pro" | "founding_pro";

function planFromEvent(event: Record<string, unknown>): PaidPlan {
  const entitlementIds = Array.isArray(event.entitlement_ids)
    ? event.entitlement_ids.map((value) => String(value).toLowerCase())
    : [];
  const productId = String(event.product_id || "").toLowerCase();

  if (entitlementIds.some((value) => value.includes("founding")) || productId.includes("founding")) {
    return "founding_pro";
  }
  if (entitlementIds.includes("pro") || productId === "looma_pro_annual" || productId.includes("elite")) {
    return "pro";
  }
  return "core";
}

function eventDate(milliseconds: unknown): string | null {
  return typeof milliseconds === "number" && Number.isFinite(milliseconds)
    ? new Date(milliseconds).toISOString()
    : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!REVENUECAT_WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.headers.get("Authorization") !== `Bearer ${REVENUECAT_WEBHOOK_SECRET}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const event = body?.event as Record<string, unknown> | undefined;
    const appUserId = typeof event?.app_user_id === "string" ? event.app_user_id : null;

    if (!event || !appUserId || !event.type) {
      return new Response(JSON.stringify({ error: "Invalid RevenueCat payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const type = String(event.type);
    const planId = planFromEvent(event);
    const productId = String(event.product_id || "unknown");
    const transactionId = String(event.original_transaction_id || event.transaction_id || event.id);
    const environment = event.environment === "SANDBOX" ? "sandbox" : "live";
    const periodEnd = eventDate(event.expiration_at_ms);
    const periodStart = eventDate(event.purchased_at_ms);

    const activeEvents = new Set([
      "INITIAL_PURCHASE",
      "RENEWAL",
      "UNCANCELLATION",
      "PRODUCT_CHANGE",
      "TEMPORARY_ENTITLEMENT_GRANT",
    ]);

    if (activeEvents.has(type) || type === "CANCELLATION" || type === "EXPIRATION") {
      const status = type === "EXPIRATION" ? "expired" : type === "CANCELLATION" ? "canceled" : "active";
      const externalId = `revenuecat:${transactionId}`;
      const { error: subscriptionError } = await supabase.from("subscriptions").upsert({
        user_id: appUserId,
        paddle_subscription_id: null,
        paddle_customer_id: null,
        product_id: productId,
        price_id: productId,
        status,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: type === "CANCELLATION",
        environment,
        provider: "revenuecat",
        external_subscription_id: externalId,
        plan_id: planId,
        updated_at: new Date().toISOString(),
      }, { onConflict: "provider,external_subscription_id" });

      if (subscriptionError) throw subscriptionError;

      await supabase
        .from("profiles")
        .update({ subscription_status: status === "expired" ? "free" : planId })
        .eq("user_id", appUserId);
    }

    if (type === "NON_RENEWING_PURCHASE") {
      let creditsToAdd = 0;
      if (productId.includes("report_single")) creditsToAdd = 1;
      else if (productId.includes("report_pack_5")) creditsToAdd = 5;
      else if (productId.includes("report_pack_10")) creditsToAdd = 10;

      if (creditsToAdd > 0) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("report_credits")
          .eq("user_id", appUserId)
          .single();
        await supabase
          .from("profiles")
          .update({ report_credits: (profile?.report_credits || 0) + creditsToAdd })
          .eq("user_id", appUserId);
        await supabase.from("report_purchases").insert({
          user_id: appUserId,
          credits_purchased: creditsToAdd,
          payment_provider: String(event.store || "app_store").toLowerCase(),
          payment_id: String(event.transaction_id || event.id),
          amount_cents: typeof event.price_in_purchased_currency === "number"
            ? Math.round(event.price_in_purchased_currency * 100)
            : 0,
          currency: String(event.currency || "USD"),
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("RevenueCat webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
