import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TIERS = {
  premium: {
    name: "LOOMA Pro",
    description: "Complete cognitive training annual plan.",
    amount: 19900,
  },
  pro: {
    name: "LOOMA Elite",
    description: "Master-level cognitive training annual plan.",
    amount: 29900,
  },
};

const CheckoutSchema = z.object({
  userId: z.string().uuid(),
  userEmail: z.string().email().max(255),
  tier: z.enum(["premium", "pro"]).default("premium"),
  successUrl: z.string().url().max(2000).optional(),
  cancelUrl: z.string().url().max(2000).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
      throw new Error("Stripe is not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const body = await req.json();
    const parsed = CheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userId, userEmail, tier, successUrl, cancelUrl } = parsed.data;
    const tierConfig = TIERS[tier];

    // Validate redirect URLs belong to app origin
    const origin = req.headers.get("origin") || "";
    const safeSuccessUrl = successUrl || `${origin}/app/premium?success=true`;
    const safeCancelUrl = cancelUrl || `${origin}/app/premium?canceled=true`;

    console.log("Creating checkout session for user:", userId, "tier:", tier);

    let customerId: string | undefined;
    if (userEmail) {
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });
      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      }
    }

    const products = await stripe.products.list({ limit: 100 });
    let product = products.data.find((p: Stripe.Product) => p.name === tierConfig.name);

    if (!product) {
      product = await stripe.products.create({
        name: tierConfig.name,
        description: tierConfig.description,
      });
    }

    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 100,
    });

    let price = prices.data.find(
      (p: Stripe.Price) =>
        p.unit_amount === tierConfig.amount && p.currency === "usd" && p.recurring?.interval === "year",
    );

    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: tierConfig.amount,
        currency: "usd",
        recurring: { interval: "year" },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [{ price: price.id, quantity: 1 }],
      mode: "subscription",
      success_url: safeSuccessUrl,
      cancel_url: safeCancelUrl,
      subscription_data: {
        metadata: { user_id: userId, tier },
      },
      metadata: { user_id: userId, tier },
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("Error creating checkout session:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
