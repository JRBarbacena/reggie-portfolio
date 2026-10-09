// @ts-check

import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { waitUntil } from "@vercel/functions";
import {
  createSlidingWindowLimiter,
  createTimedFetch,
  logServerError,
  parseJsonBody,
  requestId,
  requestKey,
  sendJson,
} from "../server/request-security.js";

const BODY_LIMIT_BYTES = 8 * 1024;
const RATE_LIMITS = { start: 8, send: 30, poll: 90, presence: 60, end: 10, unknown: 20 };
const rateLimit = createSlidingWindowLimiter({ windowMs: 60_000 });

function serverClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: createTimedFetch(6_500) },
  }) : null;
}

function tokenHash(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

async function activeSession(client, id, token) {
  if (!/^[0-9a-f-]{36}$/i.test(String(id)) || !/^[A-Za-z0-9_-]{40,60}$/.test(String(token))) return null;
  const { data, error } = await client.from("chat_sessions")
    .select("id,status,expires_at,visitor_name")
    .eq("id", id)
    .eq("token_hash", tokenHash(token))
    .eq("status", "open")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

async function sendNewChatEmail({ sessionId, visitorName, message, requestId: id }) {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.CHAT_NOTIFICATION_EMAIL || "iggybarbacena@gmail.com";
  if (!apiKey || !recipient) return;

  const safeName = String(visitorName || "Visitor").replace(/[\r\n]+/g, " ").slice(0, 80);
  const adminUrl = `${process.env.SITE_URL || "https://reggiebarbacena.vercel.app"}/admin`;
  try {
    const notification = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `zenith-chat-${sessionId}`,
        "User-Agent": "reggie-portfolio/1.0",
      },
      body: JSON.stringify({
        from: process.env.CHAT_NOTIFICATION_FROM || "Zenith <onboarding@resend.dev>",
        to: [recipient],
        subject: `${safeName} wants to chat through Zenith`,
        text: `${safeName} started a temporary portfolio chat.\n\nFirst message:\n${message}\n\nOpen the private dashboard to reply:\n${adminUrl}\n\nThe conversation expires one hour after its latest message.`,
      }),
      signal: AbortSignal.timeout(4_500),
    });
    if (!notification.ok) {
      logServerError("live_chat.notification_failed", { name: "HttpError", status: notification.status }, { requestId: id });
    }
  } catch (error) {
    logServerError("live_chat.notification_failed", error, { requestId: id });
  }
}

async function presence(client) {
  const { data, error } = await client.from("chat_presence").select("status,last_seen_at").eq("id", true).maybeSingle();
  if (error) throw error;
  const recent = data?.last_seen_at && Date.now() - new Date(data.last_seen_at).getTime() < 90_000;
  return recent && data.status === "online" ? "online" : "offline";
}

export default async function handler(request, response) {
  const id = requestId(request);
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { message: "Method not allowed." }, id);
  }

  const parsed = parseJsonBody(request, BODY_LIMIT_BYTES);
  if (!parsed.ok) return sendJson(response, parsed.status, { message: parsed.message }, id);
  const body = parsed.body;
  const action = Object.hasOwn(RATE_LIMITS, body.action) ? body.action : "unknown";
  const rate = rateLimit(`live-chat:${action}:${requestKey(request)}`, RATE_LIMITS[action]);
  if (rate.limited) {
    response.setHeader("Retry-After", String(rate.retryAfterSeconds));
    return sendJson(response, 429, { message: "Too many chat requests. Please wait a moment." }, id);
  }
  if (action === "unknown") return sendJson(response, 400, { message: "Unknown chat action." }, id);

  const client = serverClient();
  if (!client) return sendJson(response, 503, { message: "Temporary live chat is not configured yet." }, id);

  try {
    if (body.action === "start") {
      const token = randomBytes(32).toString("base64url");
      const visitorName = String(body.name || "Visitor").trim().slice(0, 80) || "Visitor";
      const { data, error } = await client.from("chat_sessions")
        .insert({ visitor_name: visitorName, token_hash: tokenHash(token) })
        .select("id,expires_at")
        .single();
      if (error) throw error;
      return sendJson(response, 201, { sessionId: data.id, token, expiresAt: data.expires_at, presence: await presence(client), messages: [] }, id);
    }

    if (body.action === "presence") {
      return sendJson(response, 200, { presence: await presence(client) }, id);
    }

    const session = await activeSession(client, body.sessionId, body.token);
    if (!session) return sendJson(response, 410, { message: "This temporary chat has ended or expired." }, id);

    if (body.action === "send") {
      const message = String(body.message ?? "").trim().slice(0, 1200);
      if (!message) return sendJson(response, 400, { message: "Write a message before sending." }, id);
      const { count: existingVisitorMessages, error: countError } = await client.from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("session_id", session.id)
        .eq("sender", "visitor");
      if (countError) throw countError;
      const { error } = await client.from("chat_messages").insert({ session_id: session.id, sender: "visitor", body: message });
      if (error) throw error;
      if (existingVisitorMessages === 0) {
        waitUntil(sendNewChatEmail({ sessionId: session.id, visitorName: session.visitor_name, message, requestId: id }));
      }
    } else if (body.action === "end") {
      const { error } = await client.from("chat_sessions").delete().eq("id", session.id);
      if (error) throw error;
      return sendJson(response, 200, { ended: true }, id);
    }

    const [{ data: messages, error }, { data: refreshed, error: refreshError }] = await Promise.all([
      client.from("chat_messages").select("id,sender,body,created_at").eq("session_id", session.id).order("created_at"),
      client.from("chat_sessions").select("expires_at").eq("id", session.id).single(),
    ]);
    if (error || refreshError) throw error || refreshError;
    return sendJson(response, 200, { messages: messages ?? [], expiresAt: refreshed?.expires_at ?? session.expires_at, presence: await presence(client) }, id);
  } catch (error) {
    logServerError("live_chat.request_failed", error, { requestId: id, action });
    return sendJson(response, 502, { message: "Temporary live chat is unavailable right now." }, id);
  }
}
