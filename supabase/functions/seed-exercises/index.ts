import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role to bypass RLS for exercise seeding
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the request has valid auth - check if user is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user and check admin role
    const userClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await userClient.auth.getUser();
    
    if (userError || !userData?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;

    // Check if user is admin using the service role client
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      console.log('Non-admin user attempted to seed exercises:', userId);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse exercises from request body
    const { exercises } = await req.json();

    if (!exercises || !Array.isArray(exercises)) {
      return new Response(
        JSON.stringify({ error: 'Invalid exercises data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin ${userId} seeding ${exercises.length} exercises`);

    // Upsert exercises using service role (bypasses RLS)
    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < exercises.length; i += batchSize) {
      const batch = exercises.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('cognitive_exercises')
        .upsert(batch, { onConflict: 'id' });

      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
      }
    }

    console.log(`Seeded ${successCount} exercises, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        seeded: successCount, 
        errors: errorCount 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: unknown) {
    console.error('Seed exercises error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
