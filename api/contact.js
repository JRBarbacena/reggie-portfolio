// @ts-check

import { createClient } from "@supabase/supabase-js";
import {
  createSlidingWindowLimiter,
  createTimedFetch,
  logServerError,
  parseJsonBody,
  requestId,
  requestKey,
  sendJson,
} from "../server/request-security.js";

const BODY_LIMIT_BYTES = 24 * 1024;
const RATE_LIMIT = 5;
const rateLimit = createSlidingWindowLimiter({ windowMs: 10 * 60_000 });
const TOPICS = new Set(["General inquiry", "Project collaboration", "Coffee chat", "Speaking or event", "Other"]);

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
  const id = requestId(request);
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { message: "Method not allowed." }, id);
  }

  const rate = rateLimit(`contact:${requestKey(request)}`, RATE_LIMIT);
  if (rate.limited) {
    response.setHeader("Retry-After", String(rate.retryAfterSeconds));
    return sendJson(response, 429, { message: "Please wait a few minutes before sending another message." }, id);
  }

  const parsed = parseJsonBody(request, BODY_LIMIT_BYTES);
  if (!parsed.ok) return sendJson(response, parsed.status, { message: parsed.message }, id);
  const body = parsed.body;
  // A hidden field catches unsophisticated form bots without adding friction
  // for real visitors. Reply with success so bots receive no useful signal.
  if (String(body.website ?? "").trim()) return sendJson(response, 200, { ok: true }, id);
  const name = String(body.name ?? "").trim().slice(0, 120);
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 254);
  const topic = TOPICS.has(body.topic) ? body.topic : "General inquiry";
  const message = String(body.message ?? "").trim().slice(0, 2000);
  const consent = body.consent === true || body.consent === "on";
  if (name.length < 2 || !validEmail(email) || message.length < 10 || !consent) {
    return sendJson(response, 400, { message: "Please complete your name, email, message, and consent before sending." }, id);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return sendJson(response, 503, { message: "The secure contact inbox is not configured yet. Please use the direct email link instead." }, id);
  }

  try {
    const client = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: createTimedFetch(6_500) },
    });
    const { error } = await client.from("contact_inquiries").insert({
      name,
      email,
      topic,
      message,
      transcript: safeTranscript(body.transcript),
      consented_at: new Date().toISOString(),
      source: "portfolio-chatbot",
    });
    if (error) throw error;
    return sendJson(response, 201, { ok: true }, id);
  } catch (error) {
    logServerError("contact.insert_failed", error, { requestId: id });
    return sendJson(response, 502, { message: "Your message could not be sent right now. Please use the direct email link instead." }, id);
  }
}
