import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();

    let event: Stripe.Event;

    try {
      event = JSON.parse(body) as Stripe.Event;
    } catch (err) {
      console.error('Error parsing webhook body:', err);
      return new Response(
        JSON.stringify({ error: 'Invalid webhook payload' }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('Received webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const productType = session.metadata?.product_type;
        
        console.log('Checkout completed for user:', userId, 'product_type:', productType);

        if (userId) {
          if (productType === 'report_credits') {
            const creditsAmount = parseInt(session.metadata?.credits_amount || '1', 10);
            console.log('Processing report credits purchase for user:', userId, 'credits:', creditsAmount);
            
            const { error: purchaseError } = await supabase
              .from('report_credit_purchases')
              .insert({
                user_id: userId,
                stripe_payment_id: session.payment_intent as string,
                credits_amount: creditsAmount,
                amount_cents: session.amount_total || 499,
                currency: session.currency || 'eur',
                status: 'completed',
              });

            if (purchaseError) {
              console.error('Error recording credit purchase:', purchaseError);
            }

            const { data: profile, error: fetchError } = await supabase
              .from('profiles')
              .select('report_credits')
              .eq('user_id', userId)
              .single();

            if (fetchError) {
              console.error('Error fetching profile:', fetchError);
            } else {
              const currentCredits = profile?.report_credits || 0;
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ report_credits: currentCredits + creditsAmount })
                .eq('user_id', userId);

              if (updateError) {
                console.error('Error updating credits:', updateError);
              } else {
                console.log('Successfully added', creditsAmount, 'credits for user:', userId);
              }
            }
          } else if (productType === 'cognitive_report_pdf') {
            console.log('Processing single report purchase for user:', userId);
            
            const { error } = await supabase
              .from('report_purchases')
              .insert({
                user_id: userId,
                stripe_payment_id: session.payment_intent as string,
                amount_cents: session.amount_total || 499,
                currency: session.currency || 'eur',
                status: 'completed',
              });

            if (error) {
              console.error('Error recording report purchase:', error);
            }
          } else {
            const { error } = await supabase
              .from('profiles')
              .update({ subscription_status: 'premium' })
              .eq('user_id', userId);

            if (error) {
              console.error('Error updating subscription status:', error);
            } else {
              console.log('Successfully updated user to premium:', userId);
            }
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        
        console.log('Subscription updated for user:', userId, 'Status:', subscription.status);

        if (userId) {
          const isPremium = ['active', 'trialing'].includes(subscription.status);
          const { error } = await supabase
            .from('profiles')
            .update({ subscription_status: isPremium ? 'premium' : 'free' })
            .eq('user_id', userId);

          if (error) {
            console.error('Error updating subscription status:', error);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        
        console.log('Subscription canceled for user:', userId);

        if (userId) {
          const { error } = await supabase
            .from('profiles')
            .update({ subscription_status: 'free' })
            .eq('user_id', userId);

          if (error) {
            console.error('Error updating subscription status:', error);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment failed for invoice:', invoice.id);
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Webhook error:', error);
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
