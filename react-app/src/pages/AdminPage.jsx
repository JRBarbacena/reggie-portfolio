import { useCallback, useEffect, useRef, useState } from "react";
import { requireSupabase, supabase } from "../lib/supabase.js";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_TECH_PHOTOS = 30;
const MAX_TRAVEL_PHOTOS = 12;
const MAX_LIFE_PHOTOS = 30;

function extensionFor(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return /^[a-z0-9]{2,5}$/.test(extension ?? "") ? extension : "jpg";
}

function validateImages(files) {
  return files.map((file) => {
    if (!file.type.startsWith("image/")) return "Only image files can be uploaded.";
    if (file.size > MAX_IMAGE_BYTES) return "Each image must be 10 MB or smaller.";
    return null;
  }).find(Boolean);
}

function contentName(destination, plural = false) {
  if (destination === "travel") return plural ? "travel journals" : "travel journal";
  if (destination === "life") return plural ? "life albums" : "life album";
  return plural ? "tech albums" : "tech album";
}

function photoLimitFor(destination) {
  if (destination === "travel") return MAX_TRAVEL_PHOTOS;
  if (destination === "life") return MAX_LIFE_PHOTOS;
  return MAX_TECH_PHOTOS;
}

function destinationLabel(destination) {
  if (destination === "travel") return "Travel journals";
  if (destination === "life") return "Life albums";
  return "Tech albums";
}

async function signedPreview(client, path) {
  if (!path) return "";
  const { data, error } = await client.storage.from("album-media").createSignedUrl(path, 60 * 60);
  return error ? "" : data?.signedUrl ?? "";
}

function ContentForm({ destination, item, busy, onSubmit, onCancel, onRemovePhoto }) {
  const isTravel = destination === "travel";
  const isLife = destination === "life";
  const photoLimit = photoLimitFor(destination);
  const isEditing = Boolean(item);

  return (
    <form className={`react-admin__album-form admin-content-form${isEditing ? " react-admin__edit-form" : ""}`} onSubmit={onSubmit}>
      <input type="hidden" name="destination" value={destination} />
      <div className="admin-content-form__heading">
        <div>
          <p className="react-eyebrow">{isEditing ? "Editor" : "New private draft"}</p>
          <h2>{isEditing ? `Manage: ${item.title}` : isTravel ? "Create a travel journal" : isLife ? "Create a life album" : "Create a tech album"}</h2>
        </div>
        {isEditing && <button type="button" className="react-admin__secondary" disabled={busy} onClick={onCancel}>Close editor</button>}
      </div>
      <p className="react-muted">
        {isTravel
          ? "Write the journey as an article. Its cover opens the story, while supporting images appear inside the journal."
          : isLife
            ? "Collect games, rides, coffee stops, and personal moments. Keep the album private until its cover and gallery are ready."
            : "Collect event, community, and project photos. Tech albums may be published after their media and details are ready."}
      </p>

      {isEditing && item.coverPreview && <figure className="admin-content-form__cover"><img src={item.coverPreview} alt={`Current cover for ${item.title}`} /></figure>}

      <div className="admin-form-grid">
        <label>Title<input name="title" defaultValue={item?.title ?? ""} required maxLength="120" /></label>
        <label>Location<input name="location" defaultValue={item?.location ?? ""} required={isTravel} maxLength="180" placeholder={isTravel ? "City, country" : "Optional"} /></label>
        {isTravel && <label>Travel collection<select name="travel_scope" defaultValue={item?.travel_scope ?? "local"}><option value="local">Local Travel</option><option value="international">International Travel</option></select></label>}
        <label className="admin-form-grid__wide">
          {isTravel ? "Journal story" : "Album description"}
          <textarea
            name="description"
            defaultValue={item?.description ?? ""}
            required={isTravel}
            minLength={isTravel ? 80 : undefined}
            maxLength={isTravel ? 12000 : 2000}
            placeholder={isTravel ? "Document the route, experience, memorable details, and what made the journey meaningful. Separate paragraphs with a blank line." : "What happened and why this album matters."}
          />
          <small>{isTravel ? "At least 80 characters; blank lines create article paragraphs." : "Optional, up to 2,000 characters."}</small>
        </label>
        <label>{isEditing ? "Replace cover image" : "Cover image"}<small>{isEditing ? "Optional" : "Required"}</small><input name="cover" type="file" accept="image/*" required={!isEditing} /></label>
        <label>{isTravel ? "Supporting story images" : "Gallery photos"}<small>Up to {photoLimit}; 10 MB per image</small><input name="photos" type="file" accept="image/*" multiple /></label>
      </div>

      <div className="react-admin__actions">
        <button disabled={busy}>{isEditing ? "Save changes" : isTravel ? "Save journal draft" : "Save album draft"}</button>
        {isEditing && <button type="button" className="react-admin__secondary" disabled={busy} onClick={onCancel}>Cancel</button>}
      </div>

      {isEditing && <div className="react-admin__photos">
        <h3>{isTravel ? "Current story images" : "Current gallery photos"}</h3>
        {item.album_photos?.length === 0 && <p className="react-muted">No supporting images yet.</p>}
        {item.album_photos?.map((photo, index) => <div key={photo.id}>{photo.previewUrl ? <img src={photo.previewUrl} alt="" /> : <span className="admin-photo-placeholder" aria-hidden="true" />}<span>Image {index + 1}</span><button type="button" className="react-admin__delete" disabled={busy} onClick={() => onRemovePhoto(item, photo)}>Remove image</button></div>)}
      </div>}
    </form>
  );
}

function ContentList({ destination, items, busy, onEdit, onPublish, onDelete }) {
  const isTravel = destination === "travel";
  return (
    <section className="react-admin__albums admin-content-list" aria-labelledby={`${destination}-content-title`}>
      <div className="admin-content-list__heading"><div><p className="react-eyebrow">Library</p><h2 id={`${destination}-content-title`}>{destinationLabel(destination)}</h2></div><div className="admin-content-list__tools"><span>{items.length} total</span><a href={`/${destination}`}>View public page ↗</a></div></div>
      {items.length === 0 && <div className="album-empty" role="status"><strong>No {contentName(destination, true)} created yet.</strong><span>Use the private-draft form to create the first one.</span></div>}
      <div className="admin-content-list__items">
        {items.map((item) => <article className="admin-content-card" key={item.id}>
          <div className="admin-content-card__preview">{item.coverPreview ? <img src={item.coverPreview} alt={`Cover for ${item.title}`} /> : <span aria-hidden="true">No cover</span>}</div>
          <div className="admin-content-card__body">
            <span className={`admin-status admin-status--${item.published ? "public" : "draft"}`}>{item.published ? "Public" : "Private draft"}</span>
            <strong>{item.title}</strong>
            <span>{item.location || "No location"}{isTravel ? ` · ${item.travel_scope === "international" ? "International" : "Local"}` : ""} · {item.album_photos?.length ?? 0} {isTravel ? "story images" : "photos"}</span>
            <small>Created {new Date(item.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</small>
          </div>
          <div className="react-admin__actions">
            <button type="button" disabled={busy} onClick={() => onEdit(item)}>Edit</button>
            <button type="button" className="react-admin__secondary" disabled={busy} onClick={() => onPublish(item)}>{item.published ? "Make private" : "Publish"}</button>
            <button type="button" className="react-admin__delete" disabled={busy} onClick={() => onDelete(item)}>Delete</button>
          </div>
        </article>)}
      </div>
    </section>
  );
}

function inquiryDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function InboxList({ inquiries, inboxState, busy, onStatusChange }) {
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

function LiveChats({ chats, chatState, busy, alertsEnabled, onEnableAlerts, onReply, onEnd }) {
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

export default function AdminPage() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [albums, setAlbums] = useState([]);
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState("overview");
  const [inquiries, setInquiries] = useState([]);
  const [inboxState, setInboxState] = useState("loading");
  const [chats, setChats] = useState([]);
  const [chatState, setChatState] = useState("loading");
  const [chatAlertsEnabled, setChatAlertsEnabled] = useState(false);
  const alertAudioRef = useRef(null);

  const playChatDing = useCallback(async () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = alertAudioRef.current ?? new AudioContextClass();
    alertAudioRef.current = context;
    if (context.state === "suspended") await context.resume().catch(() => {});
    if (context.state !== "running") return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(740, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(980, context.currentTime + 0.11);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.13, context.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.23);
  }, []);

  const enableChatAlerts = useCallback(async () => {
    setChatAlertsEnabled(true);
    await playChatDing().catch(() => {});
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission().catch(() => {});
    }
    setMessage("Chat alerts are enabled for this dashboard session.");
  }, [playChatDing]);

  const refreshSession = async () => {
    if (!supabase) return;
    const { data: { session: activeSession } } = await supabase.auth.getSession();
    setSession(activeSession);
    if (!activeSession) { setIsAdmin(false); return; }
    const { data, error } = await supabase.rpc("is_album_admin");
    setIsAdmin(!error && data === true);
  };

  const loadAlbums = async () => {
    const client = requireSupabase();
    let response = await client.from("albums")
      .select("id,title,description,location,cover_path,destination,travel_scope,published,created_at,album_photos(id,storage_path,sort_order)")
      .order("created_at", { ascending: false })
      .order("sort_order", { referencedTable: "album_photos", ascending: true });
    if (response.error) {
      response = await client.from("albums")
        .select("id,title,description,location,cover_path,destination,published,created_at,album_photos(id,storage_path,sort_order)")
        .order("created_at", { ascending: false })
        .order("sort_order", { referencedTable: "album_photos", ascending: true });
    }
    if (response.error) throw response.error;
    const withPreviews = await Promise.all((response.data ?? []).map(async (item) => ({
      ...item,
      travel_scope: item.travel_scope ?? "local",
      coverPreview: await signedPreview(client, item.cover_path),
      album_photos: await Promise.all((item.album_photos ?? []).map(async (photo) => ({
        ...photo,
        previewUrl: await signedPreview(client, photo.storage_path),
      }))),
    })));
    setAlbums(withPreviews);
  };

  const loadInquiries = async () => {
    setInboxState("loading");
    const { data, error } = await requireSupabase().from("contact_inquiries")
      .select("id,created_at,status,name,email,topic,message,transcript")
      .order("created_at", { ascending: false });
    if (error) {
      // The media dashboard remains usable until the optional inbox migration
      // has been installed in Supabase.
      setInboxState("unavailable");
      return;
    }
    setInquiries(data ?? []);
    setInboxState("ready");
  };

  const loadChats = async () => {
    setChatState("loading");
    const { data, error } = await requireSupabase().from("chat_sessions")
      .select("id,visitor_name,status,last_activity_at,expires_at,chat_messages(id,sender,body,created_at)")
      .eq("status", "open")
      .gt("expires_at", new Date().toISOString())
      .order("last_activity_at", { ascending: false })
      .order("created_at", { referencedTable: "chat_messages", ascending: true });
    if (error) { setChatState("unavailable"); return; }
    setChats(data ?? []);
    setChatState("ready");
  };

  useEffect(() => {
    refreshSession();
    if (!supabase) return undefined;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => refreshSession());
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setInquiries([]);
      return;
    }
    loadAlbums().catch((error) => setMessage(error.message));
    loadInquiries();
    loadChats();
  }, [isAdmin]);

  useEffect(() => () => {
    alertAudioRef.current?.close().catch(() => {});
    alertAudioRef.current = null;
  }, []);

  useEffect(() => {
    if (!isAdmin || !supabase || chatState === "unavailable") return undefined;
    const heartbeat = () => supabase.from("chat_presence").update({ status: "online", last_seen_at: new Date().toISOString() }).eq("id", true).then(() => {});
    heartbeat();
    const heartbeatTimer = window.setInterval(heartbeat, 30_000);
    const announceVisitorMessage = async (payload) => {
      const sessionId = payload.new?.session_id;
      const { data } = sessionId
        ? await supabase.from("chat_sessions").select("visitor_name").eq("id", sessionId).maybeSingle()
        : { data: null };
      const visitorName = data?.visitor_name || "A visitor";
      setMessage(`${visitorName} sent a new chat message.`);
      if (chatAlertsEnabled) {
        playChatDing().catch(() => {});
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            new Notification("New Zenith chat", { body: `${visitorName}: ${String(payload.new?.body || "New message").slice(0, 120)}`, icon: "/images/brand/pwa-192.png" });
          } catch { /* The in-dashboard notice remains available. */ }
        }
      }
    };
    const channel = supabase.channel("portfolio-admin-live-chats")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_sessions" }, loadChats)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        loadChats();
        if (payload.new?.sender === "visitor") announceVisitorMessage(payload);
      })
      .subscribe();
    return () => {
      window.clearInterval(heartbeatTimer);
      supabase.removeChannel(channel);
    };
  }, [chatAlertsEnabled, isAdmin, playChatDing]);

  const sendMagicLink = async (event) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const { error } = await requireSupabase().auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/admin`, shouldCreateUser: false } });
      if (error) throw error;
      setMessage("Check your email for the secure admin sign-in link.");
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };

  const upload = async (client, albumId, file, label) => {
    const path = `${albumId}/${label}-${crypto.randomUUID()}.${extensionFor(file)}`;
    const { error } = await client.storage.from("album-media").upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    return path;
  };

  const createContent = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const destination = form.get("destination");
    const cover = form.get("cover");
    const photos = form.getAll("photos").filter((file) => file.size > 0);
    const maxPhotos = photoLimitFor(destination);
    const fileError = !cover?.size ? "Choose a cover image." : photos.length > maxPhotos ? `Choose at most ${maxPhotos} images at a time.` : validateImages([cover, ...photos]);
    if (fileError) { setMessage(fileError); return; }
    setBusy(true); setMessage("");
    try {
      const client = requireSupabase();
      const { data: album, error } = await client.from("albums").insert({ title: form.get("title"), description: form.get("description"), location: form.get("location"), destination, travel_scope: form.get("travel_scope") ?? "local", published: false }).select().single();
      if (error) throw error;
      const coverPath = await upload(client, album.id, cover, "cover");
      const { error: coverError } = await client.from("albums").update({ cover_path: coverPath }).eq("id", album.id);
      if (coverError) throw coverError;
      for (const [index, file] of photos.entries()) {
        const storagePath = await upload(client, album.id, file, destination === "travel" ? "story" : "photo");
        const { error: photoError } = await client.from("album_photos").insert({ album_id: album.id, storage_path: storagePath, sort_order: index });
        if (photoError) throw photoError;
      }
      formElement.reset(); await loadAlbums(); setMessage(`${contentName(destination)[0].toUpperCase()}${contentName(destination).slice(1)} saved as a private draft.`);
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };

  const saveContent = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const cover = form.get("cover");
    const photos = form.getAll("photos").filter((file) => file.size > 0);
    const maxPhotos = photoLimitFor(editing.destination);
    const fileError = photos.length > maxPhotos ? `Choose at most ${maxPhotos} images at a time.` : validateImages([...(cover?.size ? [cover] : []), ...photos]);
    if (fileError) { setMessage(fileError); return; }
    setBusy(true); setMessage("");
    try {
      const client = requireSupabase();
      const changes = { title: form.get("title"), description: form.get("description"), location: form.get("location"), destination: editing.destination, travel_scope: form.get("travel_scope") ?? editing.travel_scope ?? "local" };
      let oldCover = null;
      if (cover?.size) { changes.cover_path = await upload(client, editing.id, cover, "cover"); oldCover = editing.cover_path; }
      const { error } = await client.from("albums").update(changes).eq("id", editing.id);
      if (error) throw error;
      const existingCount = editing.album_photos?.length ?? 0;
      for (const [index, file] of photos.entries()) {
        const storagePath = await upload(client, editing.id, file, editing.destination === "travel" ? "story" : "photo");
        const { error: photoError } = await client.from("album_photos").insert({ album_id: editing.id, storage_path: storagePath, sort_order: existingCount + index });
        if (photoError) throw photoError;
      }
      if (oldCover) await client.storage.from("album-media").remove([oldCover]);
      await loadAlbums(); setEditing(null); setMessage(`${contentName(editing.destination)[0].toUpperCase()}${contentName(editing.destination).slice(1)} updated.`);
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };

  const togglePublished = async (item) => {
    setBusy(true); setMessage("");
    try {
      const { error } = await requireSupabase().from("albums").update({ published: !item.published }).eq("id", item.id);
      if (error) throw error;
      await loadAlbums();
      setMessage(`${contentName(item.destination)[0].toUpperCase()}${contentName(item.destination).slice(1)} is now ${item.published ? "private" : "public"}.`);
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };

  const removePhoto = async (item, photo) => {
    if (!window.confirm("Remove this image? This cannot be undone.")) return;
    setBusy(true); setMessage("");
    try {
      const client = requireSupabase();
      const { error } = await client.from("album_photos").delete().eq("id", photo.id);
      if (error) throw error;
      await client.storage.from("album-media").remove([photo.storage_path]);
      await loadAlbums();
      setEditing((current) => current?.id === item.id ? { ...current, album_photos: current.album_photos.filter((entry) => entry.id !== photo.id) } : current);
      setMessage("Image removed.");
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };

  const deleteContent = async (item) => {
    if (!window.confirm(`Delete “${item.title}” and all of its media? This cannot be undone.`)) return;
    setBusy(true); setMessage("");
    try {
      const client = requireSupabase();
      const paths = [item.cover_path, ...(item.album_photos ?? []).map((photo) => photo.storage_path)].filter(Boolean);
      const { error } = await client.from("albums").delete().eq("id", item.id);
      if (error) throw error;
      if (paths.length) await client.storage.from("album-media").remove(paths);
      if (editing?.id === item.id) setEditing(null);
      await loadAlbums(); setMessage(`${contentName(item.destination)[0].toUpperCase()}${contentName(item.destination).slice(1)} deleted.`);
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };

  const updateInquiryStatus = async (inquiry, status) => {
    if (!["new", "read", "replied", "archived"].includes(status) || status === inquiry.status) return;
    setBusy(true); setMessage("");
    try {
      const { error } = await requireSupabase().from("contact_inquiries").update({ status }).eq("id", inquiry.id);
      if (error) throw error;
      setInquiries((current) => current.map((entry) => entry.id === inquiry.id ? { ...entry, status } : entry));
      setMessage(`Message marked ${status}.`);
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };

  const replyToChat = async (chat, event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const body = String(new FormData(form).get("message") ?? "").trim();
    if (!body) return;
    setBusy(true); setMessage("");
    try {
      const { error } = await requireSupabase().from("chat_messages").insert({ session_id: chat.id, sender: "admin", body });
      if (error) throw error;
      form.reset(); await loadChats();
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };

  const endChat = async (chat) => {
    if (!window.confirm(`End this chat with ${chat.visitor_name} and erase all messages?`)) return;
    setBusy(true); setMessage("");
    try {
      const { error } = await requireSupabase().from("chat_sessions").delete().eq("id", chat.id);
      if (error) throw error;
      await loadChats(); setMessage("Temporary chat ended and erased.");
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };

  const openWorkspace = (destination) => { setView(destination); setEditing(null); setMessage(""); };
  const editItem = (item) => { setView(item.destination); setEditing(item); window.setTimeout(() => document.querySelector(".react-admin__edit-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0); };
  const techItems = albums.filter((item) => item.destination === "tech");
  const travelItems = albums.filter((item) => item.destination === "travel");
  const lifeItems = albums.filter((item) => item.destination === "life");
  const newInquiryCount = inquiries.filter((inquiry) => inquiry.status === "new").length;
  const activeChatCount = chats.length;

  if (!supabase) return <main id="main" className="react-admin"><h1>Admin setup required</h1><p>Add the Supabase values to <code>react-app/.env.local</code>.</p></main>;

  if (!session || !isAdmin) return <main id="main" className="react-admin admin-login" aria-labelledby="admin-title"><section className="react-admin__panel">
    <p className="react-eyebrow">Private area</p><h1 id="admin-title">Portfolio admin</h1>
    {!session && <form onSubmit={sendMagicLink}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label><button disabled={busy}>Send secure sign-in link</button></form>}
    {session && !isAdmin && <p>Your account is signed in but is not on the portfolio-admin allow list.</p>}
    {message && <p className="react-admin__message" role="status">{message}</p>}
  </section></main>;

  const publishedCount = albums.filter((item) => item.published).length;
  return <main id="main" className="react-admin admin-dashboard" aria-labelledby="admin-title"><section className="react-admin__panel admin-dashboard__panel">
    <header className="admin-dashboard__header"><div><p className="react-eyebrow">Private portfolio workspace</p><h1 id="admin-title">Content dashboard</h1><p className="react-muted">Signed in as {session.user.email}</p></div><button type="button" className="react-admin__secondary" onClick={() => supabase.auth.signOut()}>Sign out</button></header>

    <nav className="admin-dashboard__nav" aria-label="Admin sections">
      {[["overview", "Overview"], ["tech", "Tech albums"], ["travel", "Travel journals"], ["life", "Life albums"], ["chats", activeChatCount ? `Chats (${activeChatCount})` : "Chats"], ["inbox", newInquiryCount ? `Inbox (${newInquiryCount})` : "Inbox"]].map(([key, label]) => <button type="button" className={view === key ? "is-active" : ""} aria-current={view === key ? "page" : undefined} onClick={() => openWorkspace(key)} key={key}>{label}</button>)}
    </nav>

    {message && <p className="react-admin__message admin-dashboard__notice" role="status">{message}</p>}

    {view === "overview" && <section className="admin-dashboard__overview" aria-labelledby="overview-title">
      <div className="admin-content-list__heading"><div><p className="react-eyebrow">At a glance</p><h2 id="overview-title">Portfolio content</h2></div></div>
      <p className="react-muted">{inboxState === "ready" ? `${newInquiryCount} new contact message${newInquiryCount === 1 ? "" : "s"} are waiting in the private inbox.` : "The private contact inbox becomes available after its Supabase migration is installed."}</p>
      <div className="admin-dashboard__stats"><article><strong>{albums.length}</strong><span>Total entries</span></article><article><strong>{publishedCount}</strong><span>Published</span></article><article><strong>{techItems.length}</strong><span>Tech albums</span></article><article><strong>{travelItems.length}</strong><span>Travel journals</span></article><article><strong>{lifeItems.length}</strong><span>Life albums</span></article></div>
      <div className="admin-dashboard__destinations"><button type="button" onClick={() => openWorkspace("tech")}><span>Media collection</span><strong>Manage Tech albums</strong><small>Event and project galleries · up to {MAX_TECH_PHOTOS} photos</small></button><button type="button" onClick={() => openWorkspace("travel")}><span>Written stories</span><strong>Manage Travel journals</strong><small>Article body, cover, category · up to {MAX_TRAVEL_PHOTOS} story images</small></button><button type="button" onClick={() => openWorkspace("life")}><span>Personal moments</span><strong>Manage Life albums</strong><small>Games, rides, coffee, and everyday galleries · up to {MAX_LIFE_PHOTOS} photos</small></button></div>
    </section>}

    {view === "tech" && <section className="admin-dashboard__workspace" aria-label="Tech album workspace">
      <ContentForm destination="tech" busy={busy} onSubmit={createContent} />
      <ContentList destination="tech" items={techItems} busy={busy} onEdit={editItem} onPublish={togglePublished} onDelete={deleteContent} />
      {editing?.destination === "tech" && <ContentForm destination="tech" item={editing} busy={busy} onSubmit={saveContent} onCancel={() => setEditing(null)} onRemovePhoto={removePhoto} />}
    </section>}

    {view === "travel" && <section className="admin-dashboard__workspace" aria-label="Travel journal workspace">
      <ContentForm destination="travel" busy={busy} onSubmit={createContent} />
      <ContentList destination="travel" items={travelItems} busy={busy} onEdit={editItem} onPublish={togglePublished} onDelete={deleteContent} />
      {editing?.destination === "travel" && <ContentForm destination="travel" item={editing} busy={busy} onSubmit={saveContent} onCancel={() => setEditing(null)} onRemovePhoto={removePhoto} />}
    </section>}

    {view === "life" && <section className="admin-dashboard__workspace" aria-label="Life album workspace">
      <ContentForm destination="life" busy={busy} onSubmit={createContent} />
      <ContentList destination="life" items={lifeItems} busy={busy} onEdit={editItem} onPublish={togglePublished} onDelete={deleteContent} />
      {editing?.destination === "life" && <ContentForm destination="life" item={editing} busy={busy} onSubmit={saveContent} onCancel={() => setEditing(null)} onRemovePhoto={removePhoto} />}
    </section>}

    {view === "inbox" && <InboxList inquiries={inquiries} inboxState={inboxState} busy={busy} onStatusChange={updateInquiryStatus} />}
    {view === "chats" && <LiveChats chats={chats} chatState={chatState} busy={busy} alertsEnabled={chatAlertsEnabled} onEnableAlerts={enableChatAlerts} onReply={replyToChat} onEnd={endChat} />}
  </section></main>;
}
