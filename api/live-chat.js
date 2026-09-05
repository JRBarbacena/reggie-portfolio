import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 90;
const requestLog = new Map();

function sendJson(response, status, payload) {
  response.setHeader("Cache-Control", "no-store");
  return response.status(status).json(payload);
}

function requestIp(request) {
  const forwarded = request.headers?.["x-forwarded-for"];
  return String(Array.isArray(forwarded) ? forwarded[0] : forwarded ?? request.socket?.remoteAddress ?? "unknown").split(",")[0].trim();
}

function rateLimited(request) {
  const now = Date.now();
  const key = requestIp(request);
  const recent = (requestLog.get(key) ?? []).filter((entry) => now - entry < RATE_WINDOW_MS);
  recent.push(now);
  requestLog.set(key, recent);
  return recent.length > RATE_LIMIT;
}

function bodyFor(request) {
  if (request.body && typeof request.body === "object") return request.body;
  try { return JSON.parse(request.body || "{}"); } catch { return {}; }
}

function serverClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}

function tokenHash(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

async function activeSession(client, id, token) {
  if (!/^[0-9a-f-]{36}$/i.test(String(id)) || !/^[A-Za-z0-9_-]{40,60}$/.test(String(token))) return null;
  const { data } = await client.from("chat_sessions")
    .select("id,status,expires_at,visitor_name")
    .eq("id", id)
    .eq("token_hash", tokenHash(token))
    .eq("status", "open")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  return data ?? null;
}

async function sendNewChatEmail({ sessionId, visitorName, message }) {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.CHAT_NOTIFICATION_EMAIL || "iggybarbacena@gmail.com";
  if (!apiKey || !recipient) return;

  const safeName = String(visitorName || "Visitor").replace(/[\r\n]+/g, " ").slice(0, 80);
  const adminUrl = `${process.env.SITE_URL || "https://reggiebarbacena.vercel.app"}/admin`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
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
      signal: controller.signal,
    });
    if (!notification.ok) console.error("Chat email notification failed", { status: notification.status });
  } catch (error) {
    console.error("Chat email notification failed", { name: error?.name, message: error?.message });
  } finally {
    clearTimeout(timeout);
  }
}

async function presence(client) {
  const { data } = await client.from("chat_presence").select("status,last_seen_at").eq("id", true).maybeSingle();
  const recent = data?.last_seen_at && Date.now() - new Date(data.last_seen_at).getTime() < 90_000;
  return recent && data.status === "online" ? "online" : "offline";
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { message: "Method not allowed." });
  }
  if (rateLimited(request)) return sendJson(response, 429, { message: "Too many chat requests. Please wait a moment." });
  const client = serverClient();
  if (!client) return sendJson(response, 503, { message: "Temporary live chat is not configured yet." });

  const body = bodyFor(request);
  try {
    if (body.action === "start") {
      const token = randomBytes(32).toString("base64url");
      const visitorName = String(body.name || "Visitor").trim().slice(0, 80) || "Visitor";
      const { data, error } = await client.from("chat_sessions")
        .insert({ visitor_name: visitorName, token_hash: tokenHash(token) })
        .select("id,expires_at")
        .single();
      if (error) throw error;
      return sendJson(response, 201, { sessionId: data.id, token, expiresAt: data.expires_at, presence: await presence(client), messages: [] });
    }

    if (body.action === "presence") {
      return sendJson(response, 200, { presence: await presence(client) });
    }

    const session = await activeSession(client, body.sessionId, body.token);
    if (!session) return sendJson(response, 410, { message: "This temporary chat has ended or expired." });

    if (body.action === "send") {
      const message = String(body.message ?? "").trim().slice(0, 1200);
      if (!message) return sendJson(response, 400, { message: "Write a message before sending." });
      const { count: existingVisitorMessages, error: countError } = await client.from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("session_id", session.id)
        .eq("sender", "visitor");
      if (countError) throw countError;
      const { error } = await client.from("chat_messages").insert({ session_id: session.id, sender: "visitor", body: message });
      if (error) throw error;
      if (existingVisitorMessages === 0) {
        await sendNewChatEmail({ sessionId: session.id, visitorName: session.visitor_name, message });
      }
    } else if (body.action === "end") {
      await client.from("chat_sessions").delete().eq("id", session.id);
      return sendJson(response, 200, { ended: true });
    } else if (body.action !== "poll") {
      return sendJson(response, 400, { message: "Unknown chat action." });
    }

    const [{ data: messages, error }, { data: refreshed }] = await Promise.all([
      client.from("chat_messages").select("id,sender,body,created_at").eq("session_id", session.id).order("created_at"),
      client.from("chat_sessions").select("expires_at").eq("id", session.id).single(),
    ]);
    if (error) throw error;
    return sendJson(response, 200, { messages: messages ?? [], expiresAt: refreshed?.expires_at ?? session.expires_at, presence: await presence(client) });
  } catch (error) {
    console.error("Temporary live chat error", { name: error?.name, code: error?.code, message: error?.message });
    return sendJson(response, 502, { message: "Temporary live chat is unavailable right now." });
  }
}
