import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `Eres ArcaBid AI, un asistente experto en contratos del gobierno de Estados Unidos.
Ayudas a contratistas a entender y gestionar sus contratos gubernamentales.

Tienes acceso a los contratos del usuario actual. Puedes:
- Responder preguntas sobre sus contratos (valores, fechas, estados, agencias)
- Analizar rentabilidad, márgenes y costos
- Sugerir próximos pasos según el estado de cada contrato
- Explicar procesos de licitación (SAM.gov, NAICS, PSC, etc.)
- Aconsejar sobre cumplimiento y checklist
- Comparar contratos y resumir cartera

Responde en español, de forma clara y profesional. Usa los datos reales del usuario.
Si la pregunta no se relaciona con sus contratos o contratación gubernamental, redirige amablemente.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Falta autorización" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Usuario no autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { question, history } = body as { question: string; history?: { role: string; content: string }[] };

    if (!question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "Pregunta requerida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: contracts } = await supabase
      .from("contracts")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: checklist } = await supabase
      .from("contract_checklist")
      .select("label, done, contract_id");

    const { data: invoices } = await supabase
      .from("contract_invoices")
      .select("invoice_number, amount, status, due_date, contract_id");

    const { data: timeline } = await supabase
      .from("contract_timeline")
      .select("event, event_date, contract_id");

    const contractSummary = (contracts || []).map((c: any) => {
      const cl = (checklist || []).filter((x: any) => x.contract_id === c.id);
      const inv = (invoices || []).filter((x: any) => x.contract_id === c.id);
      const tl = (timeline || []).filter((x: any) => x.contract_id === c.id);
      return {
        titulo: c.title,
        agencia: c.agency,
        estado: c.status,
        valor_total: c.total_value,
        naics: c.naics,
        psc: c.psc,
        tipo: c.type,
        producto: c.product,
        servicio: c.service,
        fecha_publicacion: c.publication_date,
        fecha_limite: c.due_date,
        fecha_adjudicacion: c.award_date,
        fecha_entrega: c.delivery_date,
        fecha_pago: c.payment_date,
        cantidad: c.quantity,
        precio_unitario: c.unit_price,
        costos: c.costs,
        margen: c.margin,
        ganancia_pct: c.profit_pct,
        ganancia_fija: c.fixed_profit,
        proveedor: c.supplier,
        cliente_gobierno: c.government_client,
        contract_officer: c.contract_officer,
        notas: c.notes,
        checklist: cl.map((x: any) => ({ item: x.label, hecho: x.done })),
        facturas: inv.map((x: any) => ({ numero: x.invoice_number, monto: x.amount, estado: x.status, vence: x.due_date })),
        eventos: tl.map((x: any) => ({ evento: x.event, fecha: x.event_date })),
      };
    });

    const contextText = JSON.stringify(contractSummary, null, 2);
    const contextBlock = contractSummary.length > 0
      ? `\n\nDatos de los contratos del usuario:\n${contextText}`
      : "\n\nEl usuario aún no tiene contratos registrados.";

    const messages = [
      { role: "system", content: SYSTEM_PROMPT + contextBlock },
      ...((history || []).slice(-10).map((h) => ({ role: h.role, content: h.content }))),
      { role: "user", content: question },
    ];

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: secretRow, error: secretErr } = await serviceClient
      .from("decrypted_secrets")
      .select("decrypted_secret")
      .eq("name", "OPENAI_API_KEY")
      .maybeSingle();

    const apiKey = (secretRow as any)?.decrypted_secret;
    if (!apiKey || secretErr) {
      return new Response(JSON.stringify({ error: "OpenAI API key no configurada" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 1200,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return new Response(JSON.stringify({ error: `Error de OpenAI: ${openaiRes.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiData = await openaiRes.json();
    const answer = openaiData.choices?.[0]?.message?.content || "No pude generar una respuesta.";

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Error interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
