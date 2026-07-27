import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `Eres ArcaBid AI, un asistente experto en contratos del gobierno de Estados Unidos.
Ayudas a contratistas a entender y gestionar sus contratos gubernamentales.

Tienes acceso a los datos del usuario actual. Puedes:
- Responder preguntas sobre sus contratos, proveedores, empresas, inversionistas, etc.
- Analizar rentabilidad, márgenes y costos
- Sugerir próximos pasos según el estado de cada contrato
- Explicar procesos de licitación (SAM.gov, NAICS, PSC, etc.)
- Aconsejar sobre cumplimiento y checklist
- Comparar y resumir la cartera del usuario
- Analizar documentos (PDF, imágenes) de contratos y extraer información

Responde en español, de forma clara y profesional. Usa los datos reales del usuario.
Si la pregunta no se relaciona con sus contratos o contratación gubernamental, redirige amablemente.`;

const CREATE_SYSTEM_PROMPT = `Eres ArcaBid AI, un asistente que crea registros en el sistema ArcaBid a partir de instrucciones en lenguaje natural o de información extraída de enlaces o documentos.
Debes devolver ÚNICAMENTE un objeto JSON válido, sin texto adicional ni markdown, con los campos listados.

Tablas disponibles y sus campos:
- suppliers (Net 30/60/90): name, industry, type, website, contact, email, phone, net_terms (int: 30, 60 o 90), states, products, notes, rating (0-5)
- companies: legal_name, dba, ein, naics_codes, psc_codes, uei, duns, sam_registration (bool), cage_code, website, email, phone, address, operating_states
- investors: first_name, last_name, phone, whatsapp, email, address, company, available_capital (num), max_capital (num), interests, notes
- contracts: title, agency, solicitation_number, contract_number, type, product, service, naics, psc, status, total_value (num), bid_value (num), capital_required (num), estimated_cost (num), estimated_profit (num), due_date (date), delivery_date (date), payment_date (date), start_date (date), award_date (date), category, quantity (num), unit_of_measure, delivery_address, delivery_city, delivery_state, delivery_zip, delivery_contact, delivery_phone, delivery_method, supplier, supplier_secondary, quote_status, purchase_order_created (bool), capital_source, insured_capital (num), financing_approved (bool), priority, responsible, risk_notes, next_steps, notes
- insurers: name, available_capital (num), max_capital (num), allowed_sectors, commission (num), risk_level, contact, email
- capital_sources: name, type (own|credit_line|investor|financing), available_amount (num), max_amount (num), interest_rate, term, contact, email, phone, notes, source_url
- tools_links: name, url, description, category (bid|tool)

Reglas:
- Devuelve solo JSON. Nada de explicaciones.
- El campo "table" indica a qué tabla insertar.
- Usa tipos correctos (números para campos numéricos, fechas ISO YYYY-MM-DD).
- Si falta un campo requerido, infiérelo razonablemente o déjalo como null.
- Para contratos extraídos de documentos, usa el estado "identificado" por defecto.`;

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
    const { question, history, mode, imageUrl, fileUrl, fileType, linkUrl } = body as {
      question: string;
      history?: { role: string; content: string }[];
      mode?: "chat" | "create" | "analyze" | "extract";
      imageUrl?: string;
      fileUrl?: string;
      fileType?: string;
      linkUrl?: string;
    };

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OpenAI API key no configurada" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "create") {
      return await handleCreate(supabase, question, apiKey, linkUrl);
    }

    if (mode === "analyze") {
      return await handleAnalyze(supabase, question, apiKey, imageUrl, fileUrl, fileType);
    }

    if (mode === "extract") {
      return await handleExtract(supabase, question, apiKey, linkUrl);
    }

    return await handleChat(supabase, question, history, apiKey, imageUrl, fileUrl, fileType);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Error interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleChat(
  supabase: any,
  question: string,
  history: any,
  apiKey: string,
  imageUrl?: string,
  fileUrl?: string,
  fileType?: string
) {
  const { data: contracts } = await supabase
    .from("contracts").select("*").order("created_at", { ascending: false });
  const { data: checklist } = await supabase
    .from("contract_checklist").select("label, done, contract_id");
  const { data: invoices } = await supabase
    .from("contract_invoices").select("invoice_number, amount, status, due_date, contract_id");
  const { data: suppliers } = await supabase
    .from("suppliers").select("name, industry, type, net_terms, states, rating, email, phone");
  const { data: companies } = await supabase
    .from("companies").select("legal_name, naics_codes, uei, sam_registration, cage_code, website");

  const ctx = {
    contratos: (contracts || []).map((c: any) => ({
      titulo: c.title, agencia: c.agency, estado: c.status, valor_total: c.total_value,
      capital_requerido: c.capital_required, ganancia_estimada: c.estimated_profit,
      naics: c.naics, fecha_limite: c.due_date, fecha_entrega: c.delivery_date,
      fecha_pago: c.payment_date, health_score: c.health_score,
      checklist: (checklist || []).filter((x: any) => x.contract_id === c.id).map((x: any) => ({ item: x.label, hecho: x.done })),
      facturas: (invoices || []).filter((x: any) => x.contract_id === c.id).map((x: any) => ({ numero: x.invoice_number, monto: x.amount, estado: x.status })),
    })),
    proveedores: suppliers || [],
    empresas: companies || [],
  };

  const contextBlock = ctx.contratos.length > 0 || ctx.proveedores.length > 0
    ? `\n\nDatos del usuario:\n${JSON.stringify(ctx, null, 2)}`
    : "\n\nEl usuario aún no tiene datos registrados.";

  const content: any[] = [{ type: "text", text: question || "Analiza este documento." }];

  if (imageUrl) {
    content.push({ type: "image_url", image_url: { url: imageUrl } });
  }
  if (fileUrl && fileType === "pdf") {
    content.push({ type: "file", file: { url: fileUrl } });
  }

  const messages: any[] = [
    { role: "system", content: SYSTEM_PROMPT + contextBlock },
    ...((history || []).slice(-10).map((h) => ({ role: h.role, content: h.content }))),
    { role: "user", content },
  ];

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "gpt-4o-mini", messages, temperature: 0.7, max_tokens: 1600 }),
  });

  if (!openaiRes.ok) {
    return new Response(JSON.stringify({ error: `Error de OpenAI: ${openaiRes.status}` }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const data = await openaiRes.json();
  const answer = data.choices?.[0]?.message?.content || "No pude generar una respuesta.";

  return new Response(JSON.stringify({ answer }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleCreate(
  supabase: any,
  instruction: string,
  apiKey: string,
  linkUrl?: string
) {
  let userContent = instruction;
  if (linkUrl) {
    userContent = `Extrae información de este enlace y crea un registro: ${linkUrl}\nInstrucción: ${instruction}`;
  }

  const messages = [
    { role: "system", content: CREATE_SYSTEM_PROMPT },
    { role: "user", content: userContent },
  ];

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    }),
  });

  if (!openaiRes.ok) {
    return new Response(JSON.stringify({ error: `Error de OpenAI: ${openaiRes.status}` }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const data = await openaiRes.json();
  const raw = data.choices?.[0]?.message?.content || "{}";

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: "No se pudo interpretar la instrucción" }), {
      status: 422,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { table, ...fields } = parsed;
  const allowed = ["suppliers", "companies", "investors", "contracts", "insurers", "capital_sources", "tools_links"];
  if (!table || !allowed.includes(table)) {
    return new Response(JSON.stringify({ error: "Tabla no válida", table }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const cleanFields: any = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v !== null && v !== undefined && v !== "") cleanFields[k] = v;
  }

  const { data: inserted, error: insErr } = await supabase
    .from(table).insert(cleanFields).select().single();

  if (insErr) {
    return new Response(JSON.stringify({ error: insErr.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ answer: "Registro creado correctamente", record: inserted, table }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleAnalyze(
  supabase: any,
  question: string,
  apiKey: string,
  imageUrl?: string,
  fileUrl?: string,
  fileType?: string
) {
  const content: any[] = [{ type: "text", text: question || "Analiza este documento de contrato y extrae toda la información relevante." }];

  if (imageUrl) {
    content.push({ type: "image_url", image_url: { url: imageUrl } });
  }
  if (fileUrl && fileType === "pdf") {
    content.push({ type: "file", file: { url: fileUrl } });
  }

  const messages: any[] = [
    {
      role: "system",
      content: `Eres ArcaBid AI, experto en analizar documentos de contratos gubernamentales.
Extrae toda la información relevante: agencia, número de licitación, fechas, valores, NAICS, PSC, productos/servicios, cantidades, condiciones de entrega, contacto del oficial de contratos, etc.

Devuelve un objeto JSON con todos los campos encontrados. Usa null para campos no encontrados.
Incluye también un resumen ejecutivo en el campo "summary".`,
    },
    { role: "user", content },
  ];

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    }),
  });

  if (!openaiRes.ok) {
    return new Response(JSON.stringify({ error: `Error de OpenAI: ${openaiRes.status}` }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const data = await openaiRes.json();
  const raw = data.choices?.[0]?.message?.content || "{}";

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: "No se pudo analizar el documento" }), {
      status: 422,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ extracted: parsed, summary: parsed.summary || "Análisis completado" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleExtract(
  supabase: any,
  question: string,
  apiKey: string,
  linkUrl?: string
) {
  const messages = [
    {
      role: "system",
      content: `Eres ArcaBid AI. Extrae información del enlace proporcionado y devuelve un JSON con los datos encontrados.
Si es una fuente de capital, extrae: nombre, tipo (own/credit_line/investor/financing), monto disponible, interés, plazo, contacto.
Si es un proveedor, extrae: nombre, industria, tipo, website, contacto, email, teléfono.
Si es una empresa/inversionista, extrae los campos correspondientes.
Devuelve solo JSON.`,
    },
    { role: "user", content: `Enlace: ${linkUrl}\nInstrucción: ${question}` },
  ];

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.2,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    }),
  });

  if (!openaiRes.ok) {
    return new Response(JSON.stringify({ error: `Error de OpenAI: ${openaiRes.status}` }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const data = await openaiRes.json();
  const raw = data.choices?.[0]?.message?.content || "{}";

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: "No se pudo extraer información del enlace" }), {
      status: 422,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ extracted: parsed }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
