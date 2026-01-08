import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Credit packages available
const CREDIT_PACKAGES = {
  single: { credits: 1, price: 499, name: 'Single Report' },
  pack5: { credits: 5, price: 1999, name: '5 Report Pack' },
  pack10: { credits: 10, price: 3499, name: '10 Report Pack' },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe is not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const { userId, userEmail, packageType, successUrl, cancelUrl } = await req.json();

    const selectedPackage = CREDIT_PACKAGES[packageType as keyof typeof CREDIT_PACKAGES];
    if (!selectedPackage) {
      throw new Error('Invalid package type');
    }

    console.log('Creating credits checkout for user:', userId, 'package:', packageType);

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

    // Find or create the product
    const products = await stripe.products.list({ limit: 100 });
    let reportProduct = products.data.find((p: Stripe.Product) => 
      p.name === `NeuroLoop ${selectedPackage.name}`
    );
    
    if (!reportProduct) {
      reportProduct = await stripe.products.create({
        name: `NeuroLoop ${selectedPackage.name}`,
        description: `${selectedPackage.credits} Cognitive Report PDF download${selectedPackage.credits > 1 ? 's' : ''}`,
      });
    }

    // Find or create the price
    const prices = await stripe.prices.list({
      product: reportProduct.id,
      active: true,
      limit: 100,
    });
    
    let reportPrice = prices.data.find((p: Stripe.Price) => 
      p.unit_amount === selectedPackage.price && 
      p.currency === 'eur' && 
      !p.recurring
    );
    
    if (!reportPrice) {
      reportPrice = await stripe.prices.create({
        product: reportProduct.id,
        unit_amount: selectedPackage.price,
        currency: 'eur',
      });
    }

    // Create checkout session
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
      success_url: successUrl || `${req.headers.get('origin')}/app/report?payment=success&credits=${selectedPackage.credits}`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/app/report?payment=canceled`,
      metadata: {
        user_id: userId,
        product_type: 'report_credits',
        credits_amount: String(selectedPackage.credits),
        package_type: packageType,
      },
    });

    console.log('Credits checkout session created:', session.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Error creating credits checkout:', error);
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
