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
    
    // SECURITY: Verify Stripe webhook signature
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    let event: Stripe.Event;

    // If webhook secret is configured, verify signature
    if (webhookSecret) {
      if (!signature) {
        console.error('Missing stripe-signature header');
        return new Response(
          JSON.stringify({ error: 'Missing signature' }),
          { status: 401, headers: corsHeaders }
        );
      }
      
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        console.log('Webhook signature verified successfully');
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: corsHeaders }
        );
      }
    } else {
      // Fallback for development - log warning
      console.warn('STRIPE_WEBHOOK_SECRET not configured - signature verification skipped. Configure this secret for production!');
      try {
        event = JSON.parse(body) as Stripe.Event;
      } catch (err) {
        console.error('Error parsing webhook body:', err);
        return new Response(
          JSON.stringify({ error: 'Invalid webhook payload' }),
          { status: 400, headers: corsHeaders }
        );
      }
    }

    console.log('Received webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const productType = session.metadata?.product_type;
        const tier = session.metadata?.tier;
        
        console.log('Checkout completed for user:', userId, 'product_type:', productType, 'tier:', tier);

        if (userId) {
          if (productType === 'report_credits') {
            const creditsAmount = parseInt(session.metadata?.credits_amount || '1', 10);
            const paymentIntentId = session.payment_intent as string;
            
            console.log('Processing report credits purchase for user:', userId, 'credits:', creditsAmount);
            
            // SECURITY: Idempotency check - prevent duplicate credit grants
            const { data: existingPurchase } = await supabase
              .from('report_credit_purchases')
              .select('id')
              .eq('stripe_payment_id', paymentIntentId)
              .maybeSingle();
            
            if (existingPurchase) {
              console.log('Payment already processed, skipping:', paymentIntentId);
              break;
            }
            
            const { error: purchaseError } = await supabase
              .from('report_credit_purchases')
              .insert({
                user_id: userId,
                stripe_payment_id: paymentIntentId,
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
            const paymentIntentId = session.payment_intent as string;
            
            console.log('Processing single report purchase for user:', userId);
            
            // SECURITY: Idempotency check
            const { data: existingPurchase } = await supabase
              .from('report_purchases')
              .select('id')
              .eq('stripe_payment_id', paymentIntentId)
              .maybeSingle();
            
            if (existingPurchase) {
              console.log('Payment already processed, skipping:', paymentIntentId);
              break;
            }
            
            const { error } = await supabase
              .from('report_purchases')
              .insert({
                user_id: userId,
                stripe_payment_id: paymentIntentId,
                amount_cents: session.amount_total || 499,
                currency: session.currency || 'eur',
                status: 'completed',
              });

            if (error) {
              console.error('Error recording report purchase:', error);
            }
          } else {
            // Subscription checkout - set tier based on metadata
            const subscriptionStatus = tier === 'pro' ? 'pro' : 'premium';
            const today = new Date().toISOString().split('T')[0];
            
            const updateData: Record<string, unknown> = {
              subscription_status: subscriptionStatus,
            };

            // For Premium tier, grant 1 monthly report credit
            if (subscriptionStatus === 'premium') {
              updateData.monthly_report_credits = 1;
              updateData.monthly_report_reset_at = today;
            }
            // Pro tier doesn't need credits (unlimited)

            const { error } = await supabase
              .from('profiles')
              .update(updateData)
              .eq('user_id', userId);

            if (error) {
              console.error('Error updating subscription status:', error);
            } else {
              console.log('Successfully updated user to', subscriptionStatus, ':', userId);
            }
          }
        }
        break;
      }

      case 'invoice.paid': {
        // Monthly subscription renewal - reset monthly credits for Premium
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        if (subscriptionId && invoice.billing_reason === 'subscription_cycle') {
          // Get subscription to find user
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.user_id;
          const tier = subscription.metadata?.tier;
          
          console.log('Invoice paid for subscription renewal, user:', userId, 'tier:', tier);
          
          if (userId && tier === 'premium') {
            const today = new Date().toISOString().split('T')[0];
            const { error } = await supabase
              .from('profiles')
              .update({
                monthly_report_credits: 1,
                monthly_report_reset_at: today,
              })
              .eq('user_id', userId);

            if (error) {
              console.error('Error resetting monthly credits:', error);
            } else {
              console.log('Successfully reset monthly credits for user:', userId);
            }
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        const tier = subscription.metadata?.tier;
        
        console.log('Subscription updated for user:', userId, 'Status:', subscription.status, 'tier:', tier);

        if (userId) {
          const isActive = ['active', 'trialing'].includes(subscription.status);
          let subscriptionStatus = 'free';
          
          if (isActive) {
            subscriptionStatus = tier === 'pro' ? 'pro' : 'premium';
          }
          
          const { error } = await supabase
            .from('profiles')
            .update({ subscription_status: subscriptionStatus })
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
            .update({ 
              subscription_status: 'free',
              monthly_report_credits: 0,
            })
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
