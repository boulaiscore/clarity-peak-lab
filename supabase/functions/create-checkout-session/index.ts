import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tier configuration
const TIERS = {
  premium: {
    name: 'NLOOP Pro',
    description: 'Complete cognitive training with monthly report.',
    amount: 1990, // $19.90
  },
  pro: {
    name: 'NLOOP Elite',
    description: 'Master-level cognitive training with advanced insights.',
    amount: 2990, // $29.90
  },
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

    const { userId, userEmail, successUrl, cancelUrl, tier = 'premium' } = await req.json();

    // Validate tier
    if (!['premium', 'pro'].includes(tier)) {
      throw new Error('Invalid tier. Must be "premium" or "pro".');
    }

    const tierConfig = TIERS[tier as keyof typeof TIERS];

    console.log('Creating checkout session for user:', userId, 'email:', userEmail, 'tier:', tier);

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

    // Find or create the product for this tier
    const products = await stripe.products.list({ limit: 100 });
    let product = products.data.find((p: Stripe.Product) => p.name === tierConfig.name);
    
    if (!product) {
      console.log('Creating new product:', tierConfig.name);
      product = await stripe.products.create({
        name: tierConfig.name,
        description: tierConfig.description,
      });
    }

    // Find or create the price
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 100,
    });
    
    let price = prices.data.find((p: Stripe.Price) => 
      p.unit_amount === tierConfig.amount && 
      p.currency === 'usd' && 
      p.recurring?.interval === 'month'
    );
    
    if (!price) {
      console.log('Creating new price for', tierConfig.name);
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: tierConfig.amount,
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
          price: price.id,
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
          tier: tier,
        },
      },
      metadata: {
        user_id: userId,
        tier: tier,
      },
    });

    console.log('Checkout session created:', session.id, 'for tier:', tier);

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
