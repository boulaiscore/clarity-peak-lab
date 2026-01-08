import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not configured');
      throw new Error('Stripe is not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const { userId, userEmail, successUrl, cancelUrl } = await req.json();

    console.log('Creating report checkout session for user:', userId);

    // Check if customer already exists
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

    // Find or create the report product
    const products = await stripe.products.list({ limit: 100 });
    let reportProduct = products.data.find((p: Stripe.Product) => p.name === 'NeuroLoop Cognitive Report PDF');
    
    if (!reportProduct) {
      console.log('Creating new Report product');
      reportProduct = await stripe.products.create({
        name: 'NeuroLoop Cognitive Report PDF',
        description: 'Professional cognitive intelligence report with comprehensive metrics analysis.',
      });
    }

    // Find or create the price (€4.99 = 499 cents)
    const prices = await stripe.prices.list({
      product: reportProduct.id,
      active: true,
      limit: 100,
    });
    
    let reportPrice = prices.data.find((p: Stripe.Price) => 
      p.unit_amount === 499 && 
      p.currency === 'eur' && 
      !p.recurring
    );
    
    if (!reportPrice) {
      console.log('Creating new Report price');
      reportPrice = await stripe.prices.create({
        product: reportProduct.id,
        unit_amount: 499, // €4.99
        currency: 'eur',
      });
    }

    // Create checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price: reportPrice.id,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${req.headers.get('origin')}/app/report?payment=success`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/app/report?payment=canceled`,
      metadata: {
        user_id: userId,
        product_type: 'cognitive_report_pdf',
      },
    });

    console.log('Report checkout session created:', session.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Error creating report checkout session:', error);
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
