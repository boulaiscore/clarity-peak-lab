import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyWebhook, EventName, type PaddleEnv } from '../_shared/paddle.ts';

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
  }
  return _supabase;
}

type PaidPlan = 'core' | 'pro' | 'founding_pro';

const PRICE_TO_TIER: Record<string, PaidPlan> = {
  // Legacy Paddle products retain their prices and move to the new names.
  looma_pro_monthly: 'core',
  looma_pro_yearly: 'core',
  looma_elite_monthly: 'pro',
  looma_elite_yearly: 'pro',
  looma_core_monthly: 'core',
  looma_core_annual: 'core',
  looma_pro_annual: 'pro',
  looma_founding_pro_annual: 'founding_pro',
};

function resolvePlan(priceId: string, customData: Record<string, unknown> | null | undefined): PaidPlan {
  const selected = customData?.selectedPlanId;
  if (selected === 'core' || selected === 'pro' || selected === 'founding_pro') return selected;
  return PRICE_TO_TIER[priceId] ?? 'core';
}

async function syncProfileTier(userId: string, tier: PaidPlan | 'free') {
  await getSupabase()
    .from('profiles')
    .update({ subscription_status: tier })
    .eq('user_id', userId);
}

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;
  const userId = customData?.userId;
  if (!userId) {
    console.error('No userId in customData');
    return;
  }
  const item = items[0];
  const priceId = item.price.importMeta?.externalId;
  const productId = item.product.importMeta?.externalId;
  if (!priceId || !productId) {
    console.warn('Skipping subscription: missing importMeta.externalId', {
      rawPriceId: item.price.id,
      rawProductId: item.product.id,
    });
    return;
  }
  await getSupabase().from('subscriptions').upsert({
    user_id: userId,
    paddle_subscription_id: id,
    paddle_customer_id: customerId,
    product_id: productId,
    price_id: priceId,
    status,
    current_period_start: currentBillingPeriod?.startsAt,
    current_period_end: currentBillingPeriod?.endsAt,
    environment: env,
    provider: 'paddle',
    external_subscription_id: id,
    plan_id: resolvePlan(priceId, customData),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'paddle_subscription_id' });

  const tier = resolvePlan(priceId, customData);
  if (status === 'active' || status === 'trialing') {
    await syncProfileTier(userId, tier);
  }
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, currentBillingPeriod, scheduledChange, items, customData } = data;
  await getSupabase().from('subscriptions')
    .update({
      status,
      current_period_start: currentBillingPeriod?.startsAt,
      current_period_end: currentBillingPeriod?.endsAt,
      cancel_at_period_end: scheduledChange?.action === 'cancel',
      price_id: items?.[0]?.price?.importMeta?.externalId ?? undefined,
      product_id: items?.[0]?.product?.importMeta?.externalId ?? undefined,
      plan_id: items?.[0]?.price?.importMeta?.externalId
        ? resolvePlan(items[0].price.importMeta.externalId, customData)
        : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', id)
    .eq('environment', env);

  // Update tier on plan change (immediate upgrade)
  const userId = customData?.userId;
  const priceId = items?.[0]?.price?.importMeta?.externalId;
  if (userId && priceId && (status === 'active' || status === 'trialing')) {
    await syncProfileTier(userId, resolvePlan(priceId, customData));
  }
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  // Access until current_period_end — keep tier; downgrade happens via cron or on next read.
  await getSupabase().from('subscriptions')
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('paddle_subscription_id', data.id)
    .eq('environment', env);
}

async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.eventType) {
    case EventName.SubscriptionCreated:
      await handleSubscriptionCreated(event.data, env);
      break;
    case EventName.SubscriptionUpdated:
      await handleSubscriptionUpdated(event.data, env);
      break;
    case EventName.SubscriptionCanceled:
      await handleSubscriptionCanceled(event.data, env);
      break;
    case EventName.TransactionPaymentFailed:
      // Paddle will follow up with subscription.updated (status=past_due).
      // We only log here so the dunning state is observable in logs.
      console.log('transaction.payment_failed', {
        transactionId: (event.data as any)?.id,
        subscriptionId: (event.data as any)?.subscriptionId,
      });
      break;
    default:
      console.log('Unhandled event:', event.eventType);
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const url = new URL(req.url);
  const env = (url.searchParams.get('env') || 'sandbox') as PaddleEnv;
  try {
    await handleWebhook(req, env);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Webhook error:', e);
    return new Response('Webhook error', { status: 400 });
  }
});
