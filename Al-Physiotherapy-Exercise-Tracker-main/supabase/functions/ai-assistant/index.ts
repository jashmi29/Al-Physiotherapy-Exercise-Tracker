import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are PhysioAI, a professional AI physiotherapy assistant. You provide expert guidance on rehabilitation exercises, posture correction, injury recovery, and general physiotherapy questions.

Your expertise includes:
- Explaining exercises and their proper form
- Answering rehabilitation questions
- Identifying posture mistakes and suggesting corrections
- Recommending exercise modifications based on injuries
- Providing motivation and encouragement
- Explaining recovery timelines and expectations

Guidelines:
- Always be encouraging but medically responsible
- Do not provide medical diagnoses - suggest consulting a doctor when appropriate
- Explain exercises with clear, step-by-step instructions
- Use simple language while maintaining accuracy
- Be empathetic to patients going through recovery
- Keep responses concise but informative`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      console.error("OPENAI_API_KEY not found in environment");
      return new Response(
        JSON.stringify({ error: "AI service not configured — API key missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid request body — messages array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, userProfile } = body;

    const contextMessage = userProfile
      ? `User Profile: Name: ${userProfile.full_name || 'User'}, Age: ${userProfile.age || 'N/A'}, Gender: ${userProfile.gender || 'N/A'}, Activity Level: ${userProfile.activity_level || 'N/A'}, Medical Conditions: ${userProfile.medical_conditions || 'None'}, Injury History: ${userProfile.injury_history || 'None'}, Goals: ${userProfile.rehabilitation_goals || 'General recovery'}.`
      : '';

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + (contextMessage ? "\n" + contextMessage : "") },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `OpenAI error ${response.status}: ${errorText}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || "I apologize, but I'm unable to respond right now.";

    return new Response(
      JSON.stringify({ message: aiMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Edge function error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
