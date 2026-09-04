import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "zenith-live-chat-session";

function savedSession() {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; }
}

async function chatRequest(payload) {
  const response = await fetch("/api/live-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.message || "Temporary chat is unavailable.");
    error.status = response.status;
    throw error;
  }
  return result;
}

export default function LiveChatPanel({ onBack }) {
  const [session, setSession] = useState(savedSession);
  const [messages, setMessages] = useState([]);
  const [presence, setPresence] = useState("offline");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  const clearSession = useCallback((message = "") => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setMessages([]);
    setStatus(message);
  }, []);

  const poll = useCallback(async (activeSession = session) => {
    if (!activeSession) return;
    try {
      const result = await chatRequest({ action: "poll", sessionId: activeSession.sessionId, token: activeSession.token });
      setMessages(result.messages ?? []);
      setPresence(result.presence ?? "offline");
      setSession((current) => current ? { ...current, expiresAt: result.expiresAt } : current);
      setStatus("");
    } catch (error) {
      if (error.status === 410) clearSession("That temporary chat expired. You can start a new one.");
      else setStatus(error.message);
    }
  }, [clearSession]);

  useEffect(() => {
    if (!session) return undefined;
    poll(session);
    const timer = window.setInterval(() => poll(session), 4_000);
    return () => window.clearInterval(timer);
  }, [poll, session?.sessionId, session?.token]);

  useEffect(() => {
    if (session) return;
    chatRequest({ action: "presence" })
      .then((result) => setPresence(result.presence ?? "offline"))
      .catch(() => setPresence("offline"));
  }, [session]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages]);

  const start = async (event) => {
    event.preventDefault();
    setBusy(true); setStatus("");
    try {
      const name = new FormData(event.currentTarget).get("name");
      const result = await chatRequest({ action: "start", name });
      const next = { sessionId: result.sessionId, token: result.token, expiresAt: result.expiresAt };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSession(next); setMessages([]); setPresence(result.presence ?? "offline");
    } catch (error) { setStatus(error.message); } finally { setBusy(false); }
  };

  const send = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const message = String(new FormData(form).get("message") ?? "").trim();
    if (!message || !session) return;
    setBusy(true); setStatus("");
    try {
      const result = await chatRequest({ action: "send", sessionId: session.sessionId, token: session.token, message });
      form.reset(); setMessages(result.messages ?? []); setPresence(result.presence ?? "offline");
      setSession((current) => ({ ...current, expiresAt: result.expiresAt }));
    } catch (error) {
      if (error.status === 410) clearSession("That temporary chat expired. You can start a new one.");
      else setStatus(error.message);
    } finally { setBusy(false); }
  };

  const endChat = async () => {
    if (!session || !window.confirm("End this chat and delete its messages?")) return;
    setBusy(true);
    try { await chatRequest({ action: "end", sessionId: session.sessionId, token: session.token }); } catch { /* Clear locally even if cleanup completes later. */ }
    clearSession("The temporary chat was ended and removed."); setBusy(false);
  };

  return <div className="zenith-live-chat">
    <div className="chatbot-panel__section-heading">
      <div><strong>Chat with Reggie</strong><span>Temporary messages expire one hour after the latest reply.</span></div>
      <button type="button" onClick={onBack}>Back to Zenith</button>
    </div>
    {!session ? <form className="zenith-live-chat__start" onSubmit={start}>
      <div className={`zenith-presence is-${presence}`}><span /> Reggie is {presence}</div>
      <label>Name <span>(optional)</span><input name="name" maxLength="80" autoComplete="name" placeholder="Visitor" /></label>
      <button className="chatbot-panel__submit" disabled={busy}>{busy ? "Starting…" : "Start temporary chat"}</button>
      <p>Your browser receives a private session token. Ending the chat deletes it immediately; inactive chats expire automatically.</p>
    </form> : <>
      <div className="zenith-live-chat__toolbar"><div className={`zenith-presence is-${presence}`}><span /> Reggie is {presence}</div><button type="button" disabled={busy} onClick={endChat}>End &amp; erase</button></div>
      <div className="zenith-live-chat__messages" aria-live="polite">
        {messages.length === 0 && <p className="zenith-live-chat__empty">Say hello. If Reggie is away, this conversation will remain available for one hour.</p>}
        {messages.map((entry) => <article className={`chatbot-message chatbot-message--${entry.sender === "visitor" ? "user" : "assistant"}`} key={entry.id}><p>{entry.body}</p></article>)}
        <span ref={endRef} />
      </div>
      <form className="chatbot-chat-form zenith-live-chat__composer" onSubmit={send}>
        <label className="sr-only" htmlFor="zenith-live-message">Message Reggie</label>
        <textarea id="zenith-live-message" name="message" rows="2" maxLength="1200" required placeholder="Write a temporary message…" disabled={busy} />
        <button type="submit" disabled={busy} aria-label="Send live message">Send</button>
      </form>
    </>}
    {status && <p className="chatbot-panel__status is-error" role="status">{status}</p>}
  </div>;
}
