const RATE_WINDOW_MS = 10 * 60_000;
const RATE_LIMIT = 5;
const requestLog = new Map();
const TOPICS = new Set(["General inquiry", "Project collaboration", "Coffee chat", "Speaking or event", "Other"]);

function sendJson(response, status, payload) {
  response.setHeader("Cache-Control", "no-store");
  return response.status(status).json(payload);
}

function requestIp(request) {
  const forwarded = request.headers?.["x-forwarded-for"];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return String(value ?? request.socket?.remoteAddress ?? "unknown").split(",")[0].trim();
}

function isRateLimited(request) {
  const now = Date.now();
  const key = requestIp(request);
  const previous = (requestLog.get(key) ?? []).filter((timestamp) => now - timestamp < RATE_WINDOW_MS);
  previous.push(now);
  requestLog.set(key, previous);
  if (requestLog.size > 2_000) {
    for (const [entryKey, timestamps] of requestLog) {
      if (!timestamps.some((timestamp) => now - timestamp < RATE_WINDOW_MS)) requestLog.delete(entryKey);
    }
  }
  return previous.length > RATE_LIMIT;
}

function bodyFor(request) {
  if (request.body && typeof request.body === "object") return request.body;
  if (typeof request.body !== "string") return {};
  try {
    return JSON.parse(request.body);
  } catch {
    return {};
  }
}

function safeTranscript(transcript) {
  if (!Array.isArray(transcript)) return [];
  return transcript
    .filter((message) => ["user", "assistant"].includes(message?.role) && typeof message?.content === "string")
    .slice(-6)
    .map((message) => ({ role: message.role, content: message.content.trim().slice(0, 1200) }))
    .filter((message) => message.content.length > 0);
}

function validEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { message: "Method not allowed." });
  }
  if (isRateLimited(request)) return sendJson(response, 429, { message: "Please wait a few minutes before sending another message." });

  const body = bodyFor(request);
  // A hidden field catches unsophisticated form bots without adding friction
  // for real visitors. Reply with success so bots receive no useful signal.
  if (String(body.website ?? "").trim()) return sendJson(response, 200, { ok: true });
  const name = String(body.name ?? "").trim().slice(0, 120);
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 254);
  const topic = TOPICS.has(body.topic) ? body.topic : "General inquiry";
  const message = String(body.message ?? "").trim().slice(0, 2000);
  const consent = body.consent === true || body.consent === "on";
  if (name.length < 2 || !validEmail(email) || message.length < 10 || !consent) {
    return sendJson(response, 400, { message: "Please complete your name, email, message, and consent before sending." });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return sendJson(response, 503, { message: "The secure contact inbox is not configured yet. Please use the direct email link instead." });
  }

  try {
    const client = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await client.from("contact_inquiries").insert({
        name,
        email,
        topic,
        message,
        transcript: safeTranscript(body.transcript),
        consented_at: new Date().toISOString(),
        source: "portfolio-chatbot",
    });
    if (error) {
      console.error("Portfolio inbox insert failed", { code: error.code });
      return sendJson(response, 502, { message: "Your message could not be sent right now. Please use the direct email link instead." });
    }
    return sendJson(response, 201, { ok: true });
  } catch (error) {
    console.error("Portfolio inbox request error", { name: error?.name, message: error?.message });
    return sendJson(response, 502, { message: "Your message could not be sent right now. Please use the direct email link instead." });
  }
}
import { createClient } from "@supabase/supabase-js";
