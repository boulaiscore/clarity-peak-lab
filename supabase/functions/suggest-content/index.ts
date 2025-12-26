import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContentSuggestion {
  content_id: string;
  title: string;
  description: string;
  content_type: "podcast" | "reading" | "book";
  duration_minutes: number;
  session_type: string;
  is_required: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, planId, monthStart } = await req.json();
    
    console.log(`[suggest-content] Starting for user ${userId}, plan ${planId}, month ${monthStart}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if content already assigned for this month
    const { data: existingContent } = await supabase
      .from("monthly_content_assignments")
      .select("id")
      .eq("user_id", userId)
      .eq("month_start", monthStart)
      .limit(1);

    if (existingContent && existingContent.length > 0) {
      console.log(`[suggest-content] Content already assigned for month ${monthStart}`);
      return new Response(
        JSON.stringify({ success: true, message: "Content already assigned", alreadyAssigned: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Define plan requirements
    const planConfigs: Record<string, { contentPerWeek: number; allowedTypes: string[]; intensity: string }> = {
      light: { contentPerWeek: 1, allowedTypes: ["podcast", "reading"], intensity: "light" },
      expert: { contentPerWeek: 2, allowedTypes: ["podcast", "reading", "book"], intensity: "medium" },
      superhuman: { contentPerWeek: 3, allowedTypes: ["podcast", "reading", "book"], intensity: "high" },
    };

    const config = planConfigs[planId] || planConfigs.light;
    const totalContentForMonth = config.contentPerWeek * 4; // 4 weeks per month

    // Use AI to generate personalized content suggestions
    const systemPrompt = `You are a cognitive training content curator for NeuroLoop, a premium cognitive performance platform.

Your task is to suggest ${totalContentForMonth} pieces of content for a month of training based on the user's plan.

Plan: ${planId.toUpperCase()} (${config.intensity} intensity)
Content per week: ${config.contentPerWeek}
Allowed types: ${config.allowedTypes.join(", ")}

For each content suggestion, you must provide:
- A unique content_id (format: type-topic-number, e.g., "podcast-mental-models-1")
- title: A compelling title
- description: 1-2 sentences describing the content
- content_type: Must be one of ${config.allowedTypes.join(", ")}
- duration_minutes: Realistic duration (podcasts: 10-30min, readings: 5-15min, books: 20-40min)
- session_type: One of "slow-reasoning", "dual-process", "consolidation", "heavy-slow", "dual-stress", "reflection"
- is_required: ${planId === "superhuman" ? "true for all" : planId === "expert" ? "true for half" : "false for all"}

Focus on:
- Decision making and strategic thinking
- Cognitive biases and how to overcome them
- System 1 (intuitive) and System 2 (analytical) thinking
- Mental models for executives and founders
- Attention, focus, and cognitive load management
- Rationality and better judgment

Return exactly ${totalContentForMonth} suggestions that progressively build on each other throughout the month.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate ${totalContentForMonth} content suggestions for the ${planId} training plan for the month starting ${monthStart}.` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_content",
              description: "Return content suggestions for the month",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        content_id: { type: "string" },
                        title: { type: "string" },
                        description: { type: "string" },
                        content_type: { type: "string", enum: ["podcast", "reading", "book"] },
                        duration_minutes: { type: "number" },
                        session_type: { type: "string" },
                        is_required: { type: "boolean" },
                      },
                      required: ["content_id", "title", "description", "content_type", "duration_minutes", "session_type", "is_required"],
                    },
                  },
                },
                required: ["suggestions"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_content" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error(`[suggest-content] AI gateway error: ${response.status}`, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log(`[suggest-content] AI response received`);

    // Parse the tool call response
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const suggestions: ContentSuggestion[] = JSON.parse(toolCall.function.arguments).suggestions;
    console.log(`[suggest-content] Generated ${suggestions.length} suggestions`);

    // Insert content assignments into database
    const assignments = suggestions.map((s) => ({
      user_id: userId,
      month_start: monthStart,
      content_type: s.content_type,
      content_id: s.content_id,
      title: s.title,
      description: s.description,
      duration_minutes: s.duration_minutes,
      is_required: s.is_required,
      session_type: s.session_type,
      status: "pending",
      time_spent_minutes: 0,
    }));

    const { error: insertError } = await supabase
      .from("monthly_content_assignments")
      .insert(assignments);

    if (insertError) {
      console.error(`[suggest-content] Insert error:`, insertError);
      throw insertError;
    }

    console.log(`[suggest-content] Successfully assigned ${assignments.length} content items`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        assigned: assignments.length,
        suggestions: suggestions 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[suggest-content] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
