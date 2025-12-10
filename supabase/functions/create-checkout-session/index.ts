import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
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

    console.log('Creating checkout session for user:', userId, 'email:', userEmail);

    // Check if customer already exists
    let customerId: string | undefined;
    if (userEmail) {
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });
      
      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
        console.log('Found existing customer:', customerId);
      }
    }

    // Create or get the premium price
    // First, try to find existing product
    const products = await stripe.products.list({
      limit: 100,
    });
    
    let premiumProduct = products.data.find((p: Stripe.Product) => p.name === 'NeuroLoop Pro Premium');
    
    if (!premiumProduct) {
      console.log('Creating new Premium product');
      premiumProduct = await stripe.products.create({
        name: 'NeuroLoop Pro Premium',
        description: 'Full access to all cognitive training features, unlimited sessions, and advanced analytics.',
      });
    }

    // Find or create the price
    const prices = await stripe.prices.list({
      product: premiumProduct.id,
      active: true,
      limit: 100,
    });
    
    let premiumPrice = prices.data.find((p: Stripe.Price) => 
      p.unit_amount === 1200 && 
      p.currency === 'usd' && 
      p.recurring?.interval === 'month'
    );
    
    if (!premiumPrice) {
      console.log('Creating new Premium price');
      premiumPrice = await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 1200, // $12.00
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price: premiumPrice.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${req.headers.get('origin')}/app/premium?success=true`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/app/premium?canceled=true`,
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          user_id: userId,
        },
      },
      metadata: {
        user_id: userId,
      },
    });

    console.log('Checkout session created:', session.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Error creating checkout session:', error);
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
