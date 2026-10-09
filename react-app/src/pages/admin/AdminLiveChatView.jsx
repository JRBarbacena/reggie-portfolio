import { inquiryDate } from "./AdminInboxView.jsx";

export default function AdminLiveChatView({ chats, chatState, busy, alertsEnabled, onEnableAlerts, onReply, onEnd }) {
  return <section className="admin-live-chats" aria-labelledby="live-chats-title">
    <div className="admin-content-list__heading"><div><p className="react-eyebrow">Temporary conversations</p><h2 id="live-chats-title">Live chats</h2></div><div className="admin-live-chats__tools"><span>{chatState === "ready" ? `${chats.length} active` : "One-hour retention"}</span><button type="button" onClick={onEnableAlerts}>{alertsEnabled ? "Sound alerts on" : "Enable chat alerts"}</button></div></div>
    {chatState === "loading" && <p className="react-muted">Loading active chats…</p>}
    {chatState === "unavailable" && <div className="album-empty" role="status"><strong>Temporary chat has not been set up yet.</strong><span>Run `20260904_006_ephemeral_live_chat.sql` in Supabase, then refresh.</span></div>}
    {chatState === "ready" && chats.length === 0 && <div className="album-empty" role="status"><strong>No active chats.</strong><span>New visitor conversations appear here during their one-hour window.</span></div>}
    {chatState === "ready" && chats.map((chat) => <article className="admin-live-chat" key={chat.id}>
      <header><div><span className="admin-status admin-status--public">Active</span><strong>{chat.visitor_name}</strong></div><div><time dateTime={chat.last_activity_at}>{inquiryDate(chat.last_activity_at)}</time><small>Expires {inquiryDate(chat.expires_at)}</small></div></header>
      <div className="admin-live-chat__messages">{(chat.chat_messages ?? []).map((entry) => <p className={`is-${entry.sender}`} key={entry.id}><strong>{entry.sender === "admin" ? "You" : chat.visitor_name}</strong><span>{entry.body}</span></p>)}</div>
      <form className="admin-live-chat__reply" onSubmit={(event) => onReply(chat, event)}><label className="sr-only" htmlFor={`reply-${chat.id}`}>Reply to {chat.visitor_name}</label><input id={`reply-${chat.id}`} name="message" required maxLength="1200" placeholder="Reply to this temporary chat…" /><button disabled={busy}>Reply</button><button type="button" className="react-admin__delete" disabled={busy} onClick={() => onEnd(chat)}>End &amp; erase</button></form>
    </article>)}
  </section>;
}
