export function inquiryDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function AdminInboxView({ inquiries, inboxState, busy, onStatusChange }) {
  return <section className="admin-inbox" aria-labelledby="inbox-title">
    <div className="admin-content-list__heading"><div><p className="react-eyebrow">Private messages</p><h2 id="inbox-title">Contact inbox</h2></div><span>{inboxState === "ready" ? `${inquiries.length} total` : "Server-managed"}</span></div>
    {inboxState === "loading" && <p className="react-muted">Loading private messages…</p>}
    {inboxState === "unavailable" && <div className="album-empty" role="status"><strong>The contact inbox has not been set up yet.</strong><span>Run `20260904_005_chatbot_inbox.sql` in Supabase, then refresh this page.</span></div>}
    {inboxState === "ready" && inquiries.length === 0 && <div className="album-empty" role="status"><strong>No messages yet.</strong><span>New chatbot contact requests will appear here.</span></div>}
    {inboxState === "ready" && inquiries.length > 0 && <div className="admin-inbox__items">
      {inquiries.map((inquiry) => <article className="admin-inbox-card" key={inquiry.id}>
        <header><div><span className={`admin-status admin-status--${inquiry.status}`}>{inquiry.status}</span><strong>{inquiry.name}</strong><a href={`mailto:${inquiry.email}`}>{inquiry.email}</a></div><time dateTime={inquiry.created_at}>{inquiryDate(inquiry.created_at)}</time></header>
        <p className="admin-inbox-card__topic">{inquiry.topic}</p>
        <p className="admin-inbox-card__message">{inquiry.message}</p>
        {Array.isArray(inquiry.transcript) && inquiry.transcript.length > 0 && <details className="admin-inbox-card__transcript"><summary>Conversation context ({inquiry.transcript.length})</summary><ol>{inquiry.transcript.map((entry, index) => <li key={`${inquiry.id}-${index}`}><strong>{entry.role === "assistant" ? "Assistant" : "Visitor"}:</strong> {entry.content}</li>)}</ol></details>}
        <label className="admin-inbox-card__status">Status<select value={inquiry.status} disabled={busy} onChange={(event) => onStatusChange(inquiry, event.target.value)}><option value="new">New</option><option value="read">Read</option><option value="replied">Replied</option><option value="archived">Archived</option></select></label>
      </article>)}
    </div>}
  </section>;
}
