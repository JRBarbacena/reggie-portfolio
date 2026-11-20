import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import contactHandler from "../../api/contact.js";
import liveChatHandler from "../../api/live-chat.js";

function createResponse() {
  const headers = new Map();
  return {
    headers,
    payload: undefined,
    statusCode: undefined,
    setHeader(name, value) {
      headers.set(name.toLowerCase(), String(value));
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return payload;
    },
  };
}

function request(method, body = {}, headers = {}) {
  return { method, body, headers, socket: { remoteAddress: "127.0.0.1" } };
}

const submissionId = "018f0c3a-7b4e-7def-8a12-123456789abc";

beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", "");
  vi.stubEnv("SUPABASE_SECRET_KEY", "");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
  vi.stubEnv("RESEND_API_KEY", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("contact API contract", () => {
  it("rejects non-POST requests without touching external services", async () => {
    const response = createResponse();
    await contactHandler(request("GET"), response);

    expect(response.statusCode).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects oversized bodies before validation", async () => {
    const response = createResponse();
    await contactHandler(request("POST", {}, { "content-length": String(24 * 1024 + 1) }), response);

    expect(response.statusCode).toBe(413);
  });

  it("silently accepts the honeypot without requiring credentials", async () => {
    const response = createResponse();
    await contactHandler(request("POST", { website: "bot.example" }), response);

    expect(response.statusCode).toBe(200);
    expect(response.payload).toEqual({ ok: true });
  });

  it("fails safely when the secure inbox is not configured", async () => {
    const response = createResponse();
    await contactHandler(request("POST", {
      name: "Test Visitor",
      email: "visitor@example.test",
      message: "This is a credential-free test message.",
      consent: true,
      submissionId,
    }), response);

    expect(response.statusCode).toBe(503);
    expect(response.payload.message).not.toMatch(/SUPABASE|secret|service.role/i);
  });

  it("rejects a missing retry key before checking configuration", async () => {
    const response = createResponse();
    await contactHandler(request("POST", {
      name: "Test Visitor",
      email: "visitor@example.test",
      message: "This is a credential-free test message.",
      consent: true,
    }), response);

    expect(response.statusCode).toBe(400);
  });
});

describe("live-chat API contract", () => {
  it("enforces the same per-session message cap in the API and database", async () => {
    const [handlerSource, migration] = await Promise.all([
      readFile(resolve(process.cwd(), "api/live-chat.js"), "utf8"),
      readFile(resolve(process.cwd(), "supabase/migrations/20261026_010_live_chat_message_cap.sql"), "utf8"),
    ]);

    expect(handlerSource).toContain("const SESSION_MESSAGE_LIMIT = 200");
    expect(migration).toContain(") >= 200 then");
    expect(migration).toContain("for update");
  });

  it("rejects non-POST requests", async () => {
    const response = createResponse();
    await liveChatHandler(request("GET"), response);

    expect(response.statusCode).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
  });

  it("rejects unknown actions before checking configuration", async () => {
    const response = createResponse();
    await liveChatHandler(request("POST", { action: "unsupported" }), response);

    expect(response.statusCode).toBe(400);
    expect(response.payload).toEqual({ message: "Unknown chat action." });
  });

  it("fails safely when temporary chat is not configured", async () => {
    const response = createResponse();
    await liveChatHandler(request("POST", { action: "presence" }), response);

    expect(response.statusCode).toBe(503);
    expect(response.payload.message).not.toMatch(/SUPABASE|secret|service.role/i);
  });
});
