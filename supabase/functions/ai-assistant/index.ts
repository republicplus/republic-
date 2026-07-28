import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `Eres ArcaBid AI, un asistente experto en contratos del gobierno de Estados Unidos.
Ayudas a contratistas a entender y gestionar sus contratos gubernamentales.
Responde en español, de forma clara y profesional.`;

const CREATE_SYSTEM_PROMPT = `Eres ArcaBid AI. Crea registros a partir de instrucciones en lenguaje natural o de información extraída de enlaces.
Devuelve ÚNICAMENTE un objeto JSON válido con los campos.

Tablas y campos:
- suppliers: name, industry, type, website, contact, email, phone, net_terms (int), states, products, notes, rating (0-5), category, tags, address, status
- bid_pages: name, website, type (free|paid|mixed), category, contract_types, country_state, subscription_price (num), notes, tags, status
- contracts: title, agency, solicitation_number, type, status, total_value (num), capital_required (num), estimated_profit (num), due_date (date), delivery_date (date), payment_date (date), naics, psc, notes
- capital_sources: name, type (own|credit_line|investor|financing), available_amount (num), max_amount (num), interest_rate, term, contact, email, phone, notes, source_url
- tools_links: name, url, description, category (bid|tool)
- net_terms_companies: company_name, contact_name, contact_email, contact_phone, payment_terms (text like "Net 30"), credit_limit (num), available_balance (num), category (text), notes, status (active|paused|inactive)

Reglas: solo JSON. Campo "table" indica la tabla. Tipos correctos.`;

const BULK_SUPPLIERS_PROMPT = `Eres ArcaBid AI. Analiza el texto del usuario y extrae TODOS los proveedores mayoristas que encuentres.
Devuelve ÚNICAMENTE un objeto JSON válido: { "suppliers": [ { "name": "", "category": "", "products": "", "phone": "", "email": "", "website": "", "address": "", "states": "", "notes": "", "tags": "" } ] }
Extrae cada proveedor como un objeto separado en el array. Si un campo no está disponible, usa string vacío.`;

const BULK_BIDPAGES_PROMPT = `Eres ArcaBid AI. Analiza el texto del usuario y extrae TODAS las páginas web de licitaciones/bidding que encuentres.
Devuelve ÚNICAMENTE un objeto JSON válido: { "bid_pages": [ { "name": "", "website": "", "type": "free|paid|mixed", "category": "", "contract_types": "", "country_state": "", "subscription_price": "", "notes": "", "tags": "" } ] }
Extrae cada página como un objeto separado en el array. Si un campo no está disponible, usa string vacío.`;

const BULK_NET_TERMS_PROMPT = `Eres ArcaBid AI. Analiza el texto del usuario y extrae TODAS las empresas que ofrecen términos de pago a crédito (Net 30, Net 60, Net 90, etc.).
Devuelve ÚNICAMENTE un objeto JSON válido: { "net_terms": [ { "company_name": "", "contact_name": "", "contact_email": "", "contact_phone": "", "payment_terms": "", "credit_limit": "", "available_balance": "", "category": "", "notes": "", "status": "active" } ] }
Extrae cada empresa como un objeto separado en el array. payment_terms debe ser un texto como "Net 30", "Net 60", "Net 90". Si un campo no está disponible, usa string vacío. status por defecto "active".`;

const BULK_CAPITAL_PROMPT = `Eres ArcaBid AI. Analiza el texto del usuario y extrae TODAS las fuentes de capital que encuentres (bancos, lenders, hard money, MCA, factoring, purchase order financing, invoice financing, supply chain financing, equipment financing, SBA, business credit, líneas de crédito, inversionistas privados).
Devuelve ÚNICAMENTE un objeto JSON válido: { "capital": [ { "name": "", "type": "", "amount_min": "", "amount_max": "", "interest_rate": "", "term": "", "website": "", "contact": "", "requirements": "", "notes": "", "favorite": false } ] }
Extrae cada fuente como un objeto separado en el array. type debe ser uno de: Banco, Lender, Private Lender, Hard Money, MCA, Factoring, Purchase Order Financing, Invoice Financing, Supply Chain Financing, Equipment Financing, SBA, Business Credit, Línea de Crédito. Si un campo no está disponible, usa string vacío.`;

const CONTRACT_FLOW_PROMPT = `Eres ArcaBid AI, experto en analizar contratos gubernamentales (RFQs, bids, RFPs).
Analiza el documento o texto del contrato y extrae toda la información relevante.

Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura:
{
  "extracted": {
    "contract_name": "", "agency": "", "solicitation_number": "", "naics": "", "psc": "",
    "product_name": "", "brand": "", "model": "", "sku": "", "upc": "", "nsn": "",
    "quantity": null, "unit": "", "specifications": "", "certifications_required": "",
    "delivery_date": "", "delivery_location": "", "equivalents_allowed": false,
    "service_type": "", "service_description": "", "service_location": "",
    "start_date": "", "end_date": "", "duration": "", "personnel_required": "",
    "licenses_required": "", "insurance_required": "", "special_conditions": ""
  },
  "suppliers": [
    { "name": "", "product": "", "unit_price": null, "availability": "", "inventory": null, "delivery_time": "", "shipping_cost": null, "min_order": null, "warranty": "", "return_policy": "", "link": "", "notes": "", "recommendation": "" }
  ],
  "cost_analysis": {
    "items": [ { "label": "", "amount": null } ],
    "total_cost": null,
    "margin_percent": null,
    "recommended_price": null,
    "estimated_profit": null
  },
  "compliance": {
    "level": "cumple|cumple_parcial|no_cumple|revision",
    "checks": [ { "criterion": "", "status": "pass|fail|review", "explanation": "" } ],
    "risk_notes": ""
  },
  "summary": ""
}`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const body = await req.json();
    const { question, history, mode, imageUrl, fileUrl, fileType, linkUrl, bulkType, bulkText, flowType } = body as {
      question: string;
      history?: { role: string; content: string }[];
      mode?: string;
      imageUrl?: string;
      fileUrl?: string;
      fileType?: string;
      linkUrl?: string;
      bulkType?: string;
      bulkText?: string;
      flowType?: string;
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

    if (mode === "bulk") {
      return await handleBulk(bulkType, bulkText, apiKey);
    }

    if (mode === "flow") {
      return await handleFlow(supabase, question, apiKey, imageUrl, fileUrl, fileType, flowType);
    }

    return await handleChat(supabase, question, history, apiKey, imageUrl, fileUrl, fileType);
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message || "Error interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function callOpenAI(apiKey: string, messages: any[], temperature = 0.3, maxTokens = 1600, jsonMode = false) {
  const body: any = { model: "gpt-4o-mini", messages, temperature, max_tokens: maxTokens };
  if (jsonMode) body.response_format = { type: "json_object" };
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Error de OpenAI: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function handleChat(supabase: any, question: string, history: any, apiKey: string, imageUrl?: string, fileUrl?: string, fileType?: string) {
  const { data: contracts } = await supabase.from("contracts").select("*").order("created_at", { ascending: false });
  const { data: suppliers } = await supabase.from("suppliers").select("name, industry, type, net_terms, states, rating, email, phone");

  const ctx = {
    contratos: (contracts || []).map((c: any) => ({
      titulo: c.title, agencia: c.agency, estado: c.status, valor: c.total_value,
      capital_requerido: c.capital_required, ganancia_estimada: c.estimated_profit,
      naics: c.naics, fecha_limite: c.due_date, health_score: c.health_score,
    })),
    proveedores: suppliers || [],
  };

  const contextBlock = ctx.contratos.length > 0 || ctx.proveedores.length > 0
    ? `\n\nDatos del usuario:\n${JSON.stringify(ctx, null, 2)}`
    : "\n\nEl usuario aún no tiene datos registrados.";

  const content: any[] = [{ type: "text", text: question || "Analiza este documento." }];
  if (imageUrl) content.push({ type: "image_url", image_url: { url: imageUrl } });
  if (fileUrl && fileType === "pdf") content.push({ type: "file", file: { url: fileUrl } });

  const messages: any[] = [
    { role: "system", content: SYSTEM_PROMPT + contextBlock },
    ...((history || []).slice(-10).map((h) => ({ role: h.role, content: h.content }))),
    { role: "user", content },
  ];

  const answer = await callOpenAI(apiKey, messages, 0.7, 1600);
  return new Response(JSON.stringify({ answer }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function handleCreate(supabase: any, instruction: string, apiKey: string, linkUrl?: string) {
  let userContent = instruction;
  if (linkUrl) userContent = `Extrae información de este enlace y crea un registro: ${linkUrl}\nInstrucción: ${instruction}`;

  const messages = [{ role: "system", content: CREATE_SYSTEM_PROMPT }, { role: "user", content: userContent }];
  const raw = await callOpenAI(apiKey, messages, 0.3, 1000, true);

  let parsed: any;
  try { parsed = JSON.parse(raw); } catch {
    return new Response(JSON.stringify({ error: "No se pudo interpretar la instrucción" }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const { table, ...fields } = parsed;
  const allowed = ["suppliers", "companies", "investors", "contracts", "insurers", "capital_sources", "capital_providers", "tools_links", "bid_pages", "net_terms_companies"];
  if (!table || !allowed.includes(table)) {
    return new Response(JSON.stringify({ error: "Tabla no válida", table }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const cleanFields: any = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v !== null && v !== undefined && v !== "") cleanFields[k] = v;
  }

  const { data: inserted, error: insErr } = await supabase.from(table).insert(cleanFields).select().single();
  if (insErr) {
    return new Response(JSON.stringify({ error: insErr.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ answer: "Registro creado correctamente", record: inserted, table }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function handleAnalyze(supabase: any, question: string, apiKey: string, imageUrl?: string, fileUrl?: string, fileType?: string) {
  const content: any[] = [{ type: "text", text: question || "Analiza este documento de contrato y extrae toda la información relevante." }];
  if (imageUrl) content.push({ type: "image_url", image_url: { url: imageUrl } });
  if (fileUrl && fileType === "pdf") content.push({ type: "file", file: { url: fileUrl } });

  const messages: any[] = [
    { role: "system", content: `Eres ArcaBid AI, experto en analizar documentos de contratos gubernamentales.
Extrae toda la información relevante: agencia, número de licitación, fechas, valores, NAICS, PSC, productos/servicios, cantidades, condiciones de entrega, contacto del oficial de contratos.
Devuelve un objeto JSON con todos los campos encontrados. Usa null para campos no encontrados. Incluye un "summary".` },
    { role: "user", content },
  ];

  const raw = await callOpenAI(apiKey, messages, 0.2, 2000, true);
  let parsed: any;
  try { parsed = JSON.parse(raw); } catch {
    return new Response(JSON.stringify({ error: "No se pudo analizar el documento" }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ extracted: parsed, summary: parsed.summary || "Análisis completado" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function handleBulk(bulkType: string | undefined, bulkText: string | undefined, apiKey: string) {
  if (!bulkText || !bulkType) {
    return new Response(JSON.stringify({ error: "Falta texto o tipo de bulk" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const prompts: Record<string, string> = {
    suppliers: BULK_SUPPLIERS_PROMPT,
    bid_pages: BULK_BIDPAGES_PROMPT,
    net_terms: BULK_NET_TERMS_PROMPT,
    capital: BULK_CAPITAL_PROMPT,
  };
  const prompt = prompts[bulkType] || BULK_SUPPLIERS_PROMPT;
  const messages = [{ role: "system", content: prompt }, { role: "user", content: bulkText }];
  const raw = await callOpenAI(apiKey, messages, 0.2, 3000, true);

  let parsed: any;
  try { parsed = JSON.parse(raw); } catch {
    return new Response(JSON.stringify({ error: "No se pudo interpretar el texto" }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function handleFlow(supabase: any, question: string, apiKey: string, imageUrl?: string, fileUrl?: string, fileType?: string, flowType?: string) {
  const content: any[] = [{ type: "text", text: question || "Analiza este contrato y extrae toda la información." }];
  if (imageUrl) content.push({ type: "image_url", image_url: { url: imageUrl } });
  if (fileUrl && fileType === "pdf") content.push({ type: "file", file: { url: fileUrl } });

  const messages = [{ role: "system", content: CONTRACT_FLOW_PROMPT }, { role: "user", content }];
  const raw = await callOpenAI(apiKey, messages, 0.2, 3000, true);

  let parsed: any;
  try { parsed = JSON.parse(raw); } catch {
    return new Response(JSON.stringify({ error: "No se pudo analizar el contrato" }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
