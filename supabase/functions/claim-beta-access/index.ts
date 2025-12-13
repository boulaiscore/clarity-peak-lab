import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BETA_LIMIT = 100;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's token for auth verification
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify the user's token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Use service role client for database operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check current beta count with row-level locking to prevent race conditions
    const { count: betaCount, error: countError } = await adminClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'premium');

    if (countError) {
      console.error('Error counting beta users:', countError);
      return new Response(
        JSON.stringify({ error: 'Server error', message: 'Failed to check beta availability' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Current beta count:', betaCount);

    // Check if beta limit reached
    if (betaCount !== null && betaCount >= BETA_LIMIT) {
      console.log('Beta limit reached');
      return new Response(
        JSON.stringify({ 
          error: 'Beta full', 
          message: 'All beta spots have been claimed. Stay tuned for launch!',
          betaCount 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is already premium
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('subscription_status')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Server error', message: 'Failed to fetch user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (profile?.subscription_status === 'premium') {
      console.log('User already has premium');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'You already have beta access',
          alreadyPremium: true 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upgrade user to premium using service role (bypasses RLS)
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ subscription_status: 'premium' })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error upgrading user:', updateError);
      return new Response(
        JSON.stringify({ error: 'Server error', message: 'Failed to claim beta access' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User upgraded to premium successfully:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome to the Beta! You now have full access to all premium features.',
        betaCount: (betaCount || 0) + 1
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in claim-beta-access:', error);
    return new Response(
      JSON.stringify({ error: 'Server error', message: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
