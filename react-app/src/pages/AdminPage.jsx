import { useCallback, useEffect, useRef, useState } from "react";
import { requireSupabase, supabase } from "../lib/supabase.js";
import AdminAlbumView, { contentName, photoLimitFor, signedPreview } from "./admin/AdminAlbumView.jsx";
import AdminAuthView from "./admin/AdminAuthView.jsx";
import AdminInboxView from "./admin/AdminInboxView.jsx";
import AdminLiveChatView from "./admin/AdminLiveChatView.jsx";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_UPLOAD_DIMENSION = 1920;

function extensionFor(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return /^[a-z0-9]{2,5}$/.test(extension ?? "") ? extension : "jpg";
}

function webpFilename(name) {
  const stem = name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "photo";
  return `${stem}.webp`;
}

function blobFromCanvas(canvas) {
  if (canvas.convertToBlob) return canvas.convertToBlob({ type: "image/webp", quality: 0.82 });
  return new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
}

// Album uploads are user-generated and cannot use the build-time Sharp pipeline.
// Convert them in-browser when possible, cap their dimensions, and retain the
// original file only as a safe fallback for formats the browser cannot decode.
async function optimizeUploadImage(file) {
  if (!globalThis.createImageBitmap || !globalThis.document?.createElement) return file;
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const longestSide = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, MAX_UPLOAD_DIMENSION / longestSide);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await blobFromCanvas(canvas);
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], webpFilename(file.name), { type: "image/webp", lastModified: file.lastModified });
  } catch {
    return file;
  } finally {
    bitmap?.close?.();
  }
}

function validateImages(files) {
  return files.map((file) => {
    if (!file.type.startsWith("image/")) return "Only image files can be uploaded.";
    if (file.size > MAX_IMAGE_BYTES) return "Each image must be 10 MB or smaller.";
    return null;
  }).find(Boolean);
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
    const preparedFile = await optimizeUploadImage(file);
    const path = `${albumId}/${label}-${crypto.randomUUID()}.${extensionFor(preparedFile)}`;
    const { error } = await client.storage.from("album-media").upload(path, preparedFile, { contentType: preparedFile.type, upsert: false });
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

  if (!session || !isAdmin) {
    return <AdminAuthView session={session} email={email} busy={busy} message={message} onEmailChange={(event) => setEmail(event.target.value)} onSubmit={sendMagicLink} />;
  }

  const publishedCount = albums.filter((item) => item.published).length;
  const albumView = ["overview", "tech", "travel", "life"].includes(view);
  return <main id="main" className="react-admin admin-dashboard" aria-labelledby="admin-title"><section className="react-admin__panel admin-dashboard__panel">
    <header className="admin-dashboard__header"><div><p className="react-eyebrow">Private portfolio workspace</p><h1 id="admin-title">Content dashboard</h1><p className="react-muted">Signed in as {session.user.email}</p></div><button type="button" className="react-admin__secondary" onClick={() => supabase.auth.signOut()}>Sign out</button></header>

    <nav className="admin-dashboard__nav" aria-label="Admin sections">
      {[["overview", "Overview"], ["tech", "Tech albums"], ["travel", "Travel journals"], ["life", "Life albums"], ["chats", activeChatCount ? `Chats (${activeChatCount})` : "Chats"], ["inbox", newInquiryCount ? `Inbox (${newInquiryCount})` : "Inbox"]].map(([key, label]) => <button type="button" className={view === key ? "is-active" : ""} aria-current={view === key ? "page" : undefined} onClick={() => openWorkspace(key)} key={key}>{label}</button>)}
    </nav>

    {message && <p className="react-admin__message admin-dashboard__notice" role="status">{message}</p>}

    {albumView && <AdminAlbumView
      view={view}
      albums={albums}
      techItems={techItems}
      travelItems={travelItems}
      lifeItems={lifeItems}
      publishedCount={publishedCount}
      inboxState={inboxState}
      newInquiryCount={newInquiryCount}
      editing={editing}
      busy={busy}
      onOpenWorkspace={openWorkspace}
      onCreate={createContent}
      onSave={saveContent}
      onEdit={editItem}
      onPublish={togglePublished}
      onDelete={deleteContent}
      onCancelEdit={() => setEditing(null)}
      onRemovePhoto={removePhoto}
    />}
    {view === "inbox" && <AdminInboxView inquiries={inquiries} inboxState={inboxState} busy={busy} onStatusChange={updateInquiryStatus} />}
    {view === "chats" && <AdminLiveChatView chats={chats} chatState={chatState} busy={busy} alertsEnabled={chatAlertsEnabled} onEnableAlerts={enableChatAlerts} onReply={replyToChat} onEnd={endChat} />}
  </section></main>;
}
