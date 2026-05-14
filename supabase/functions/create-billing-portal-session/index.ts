import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { getAuthedUser, unauthorizedResponse } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function validateStripeSecretKey(key: string) {
  const trimmed = key.trim();
  if (!trimmed) return 'Stripe secret key is empty';
  if (trimmed.startsWith('pk_')) return 'Stripe is configured with a publishable key. Use a secret key starting with sk_.';
  if (trimmed.startsWith('rk_')) return 'Stripe is configured with a restricted key. Use the full secret key starting with sk_.';
  if (!trimmed.startsWith('sk_test_') && !trimmed.startsWith('sk_live_')) return 'Stripe secret key must start with sk_test_ or sk_live_.';
  return null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated caller — derive email from the verified JWT
    const authedUser = await getAuthedUser(req);
    if (!authedUser || !authedUser.email) {
      return unauthorizedResponse(corsHeaders);
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not configured');
      throw new Error('Stripe is not configured');
    }

    const keyError = validateStripeSecretKey(stripeSecretKey);
    if (keyError) {
      console.error(keyError);
      throw new Error(keyError);
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const { returnUrl } = await req.json().catch(() => ({}));
    const userEmail = authedUser.email;

    console.log('Creating billing portal session for:', userEmail);

    // Find customer by email
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No billing account found', code: 'NO_CUSTOMER' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    const customerId = customers.data[0].id;
    console.log('Found customer:', customerId);

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${req.headers.get('origin')}/app/subscription`,
    });

    console.log('Billing portal session created:', session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Error creating billing portal session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
