import { SPEC, fixMessage } from "./prompt";

/**
 * The only server-side code in bakaluti: a thin proxy in front of Workers AI
 * for the IA tab. Streams the model's tokens straight back to the browser
 * (SSE) so the pattern types itself into the editor. Free-plan quotas act as
 * the natural rate limit: when the daily allocation runs out, this endpoint
 * fails closed — it can never bill anyone.
 */

interface Env {
  AI: { run(model: string, options: Record<string, unknown>): Promise<ReadableStream> };
  ASSETS: { fetch(request: Request): Promise<Response> };
}

const MODEL = "@cf/meta/llama-3.1-8b-instruct";
const MAX_PROMPT = 280;

interface GenerateBody {
  prompt?: string;
  /** retry payload: the rejected pattern and the parser's warnings */
  fix?: { code: string; warnings: string[] };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/generar") {
      if (request.method !== "POST") {
        return json({ error: "método no permitido" }, 405);
      }
      return generar(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

async function generar(request: Request, env: Env): Promise<Response> {
  let body: GenerateBody;
  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return json({ error: "cuerpo inválido" }, 400);
  }

  const prompt = (body.prompt ?? "").trim().slice(0, MAX_PROMPT);
  if (!prompt) return json({ error: "falta la petición" }, 400);

  const messages: { role: string; content: string }[] = [
    { role: "system", content: SPEC },
    { role: "user", content: prompt },
  ];
  if (body.fix && typeof body.fix.code === "string" && Array.isArray(body.fix.warnings)) {
    messages.push({ role: "assistant", content: body.fix.code.slice(0, 2000) });
    messages.push({
      role: "user",
      content: fixMessage(body.fix.code.slice(0, 2000), body.fix.warnings.slice(0, 8).map(String)),
    });
  }

  try {
    const stream = await env.AI.run(MODEL, {
      messages,
      stream: true,
      max_tokens: 320,
      temperature: 0.8,
    });
    return new Response(stream, {
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-store",
      },
    });
  } catch {
    // most likely the free daily allocation ran out — fail closed, never bill
    return json({ error: "cerrado" }, 503);
  }
}

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}
