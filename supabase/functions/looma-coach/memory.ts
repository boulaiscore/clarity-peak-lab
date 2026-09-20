// Long-term coach memory: a short list of stable facts about the user, extracted
// after each exchange and injected back into the coach's context.
// Never stores raw message text, health values or anything time-bound.

const MEMORY_MODEL = "openai/gpt-6-astra";
export const MAX_MEMORY_FACTS = 12;

export interface CoachFact {
  category: string;
  fact: string;
}

interface SupabaseLike {
  from(table: string): any;
}

export async function loadCoachMemory(client: SupabaseLike, userId: string): Promise<CoachFact[]> {
  const { data } = await client
    .from("coach_memory")
    .select("category, fact")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(MAX_MEMORY_FACTS);
  return ((data ?? []) as CoachFact[]).filter((row) => typeof row.fact === "string" && row.fact.trim());
}

const EXTRACT_PROMPT =
  `You maintain a small long-term memory about a user of the LOOMA cognitive performance app.

You get the current memory list and the latest exchange between the user and the coach.
Return the UPDATED memory list.

Keep only stable, useful facts about the person: their goal, their work and schedule,
habits, constraints, preferences, what has worked or not worked for them, context that
would still be true in three months.

Never store: numbers from their metrics, anything about a single day, the coach's own
advice, health diagnoses, or sensitive personal data.

Rules:
- At most ${MAX_MEMORY_FACTS} facts. Merge duplicates, drop what is no longer true.
- Each fact is one short sentence in plain English, written in third person ("Trains in the morning").
- category is one of: goal, work, habit, constraint, preference, context.
- If the exchange contains nothing worth remembering, return the list unchanged.

Return ONLY JSON: {"facts":[{"category":"habit","fact":"..."}]}`;

function extractText(payload: unknown): string {
  const found: string[] = [];
  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node && typeof node === "object") {
      const record = node as Record<string, unknown>;
      if (record.type === "output_text" && typeof record.text === "string") found.push(record.text);
      Object.values(record).forEach(walk);
    }
  };
  walk(payload);
  return found.join("");
}

function parseFacts(raw: string): CoachFact[] {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) return [];
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as { facts?: unknown };
    if (!Array.isArray(parsed.facts)) return [];
    const allowed = new Set(["goal", "work", "habit", "constraint", "preference", "context"]);
    return parsed.facts
      .map((item) => item as Record<string, unknown>)
      .map((item) => ({
        category: allowed.has(String(item?.category)) ? String(item.category) : "context",
        fact: String(item?.fact ?? "").trim().slice(0, 220),
      }))
      .filter((item) => item.fact.length > 3)
      .slice(0, MAX_MEMORY_FACTS);
  } catch {
    return [];
  }
}

/**
 * Extracts stable facts from the latest exchange and replaces the stored memory.
 * Runs in the background; failures are logged and ignored.
 */
export async function updateCoachMemory(
  client: SupabaseLike,
  apiKey: string,
  userId: string,
  existing: CoachFact[],
  userMessage: string,
  assistantMessage: string,
): Promise<void> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: MEMORY_MODEL,
        store: false,
        reasoning: { effort: "low" },
        input: [
          { role: "developer", content: [{ type: "input_text", text: EXTRACT_PROMPT }] },
          {
            role: "user",
            content: [{
              type: "input_text",
              text: `CURRENT MEMORY:\n${JSON.stringify(existing)}\n\nLATEST EXCHANGE:\nUser: ${
                userMessage.slice(0, 1500)
              }\nCoach: ${assistantMessage.slice(0, 2500)}`,
            }],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("coach memory gateway error", response.status);
      return;
    }

    const facts = parseFacts(extractText(await response.json()));
    if (facts.length === 0) return;

    const unchanged = facts.length === existing.length &&
      facts.every((fact, index) => fact.fact === existing[index]?.fact);
    if (unchanged) return;

    await client.from("coach_memory").delete().eq("user_id", userId);
    const { error } = await client
      .from("coach_memory")
      .insert(facts.map((fact) => ({ user_id: userId, category: fact.category, fact: fact.fact })));
    if (error) console.error("coach memory persist error", error.message);
  } catch (error) {
    console.error("coach memory error", error);
  }
}
