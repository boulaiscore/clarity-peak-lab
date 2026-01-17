import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// RevenueCat webhook secret for verification
const REVENUECAT_WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify webhook signature if present
    const authHeader = req.headers.get('Authorization');
    if (REVENUECAT_WEBHOOK_SECRET && authHeader) {
      if (authHeader !== `Bearer ${REVENUECAT_WEBHOOK_SECRET}`) {
        console.error('Invalid webhook signature');
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const body = await req.json();
    console.log('RevenueCat webhook received:', JSON.stringify(body, null, 2));

    const { event, app_user_id } = body;

    if (!app_user_id) {
      console.error('No app_user_id in webhook');
      return new Response(JSON.stringify({ error: 'Missing app_user_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Map RevenueCat events to subscription status changes
    let newStatus: string | null = null;
    let creditsToAdd = 0;

    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'PRODUCT_CHANGE':
        // Check which entitlement is active
        const entitlements = event.subscriber_attributes?.entitlements || {};
        if (entitlements.pro?.is_active) {
          newStatus = 'pro';
        } else if (entitlements.premium?.is_active) {
          newStatus = 'premium';
        }
        break;

      case 'CANCELLATION':
      case 'EXPIRATION':
        newStatus = 'free';
        break;

      case 'NON_RENEWING_PURCHASE':
        // One-time purchase (report credits)
        const productId = event.product_id;
        if (productId?.includes('report_single')) {
          creditsToAdd = 1;
        } else if (productId?.includes('report_pack_5')) {
          creditsToAdd = 5;
        } else if (productId?.includes('report_pack_10')) {
          creditsToAdd = 10;
        }
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    // Update user profile if subscription status changed
    if (newStatus) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ subscription_status: newStatus })
        .eq('user_id', app_user_id);

      if (updateError) {
        console.error('Failed to update subscription status:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update user' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Updated user ${app_user_id} to ${newStatus}`);
    }

    // Add credits if purchased
    if (creditsToAdd > 0) {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('report_credits')
        .eq('user_id', app_user_id)
        .single();

      const currentCredits = currentProfile?.report_credits || 0;

      const { error: creditsError } = await supabase
        .from('profiles')
        .update({ report_credits: currentCredits + creditsToAdd })
        .eq('user_id', app_user_id);

      if (creditsError) {
        console.error('Failed to add credits:', creditsError);
      } else {
        console.log(`Added ${creditsToAdd} credits to user ${app_user_id}`);
      }

      // Record the purchase
      await supabase.from('report_purchases').insert({
        user_id: app_user_id,
        credits_purchased: creditsToAdd,
        payment_provider: 'apple',
        payment_id: event.transaction_id,
        amount_cents: event.price_in_purchased_currency ? Math.round(event.price_in_purchased_currency * 100) : 0,
        currency: event.currency || 'USD',
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
