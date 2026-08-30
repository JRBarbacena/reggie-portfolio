import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase.js";

async function signedMediaUrl(path) {
  if (!supabase || !path) return "";
  const { data, error } = await supabase.storage.from("album-media").createSignedUrl(path, 60 * 60);
  return error ? "" : data?.signedUrl ?? "";
}

export default function PublishedAlbumSection({ destination, id, title, copy, className = "tech-community" }) {
  const [albums, setAlbums] = useState([]);
  const [status, setStatus] = useState("loading");
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!supabase) { setStatus("unavailable"); return undefined; }
    let live = true;
    supabase.from("albums").select("id,title,description,location,cover_path,album_photos(id,storage_path,sort_order)").eq("published", true).eq("destination", destination).order("created_at", { ascending: false }).order("sort_order", { referencedTable: "album_photos", ascending: true }).then(async ({ data, error }) => {
      if (!live) return;
      if (error) { setStatus("error"); return; }
      const withMedia = await Promise.all((data ?? []).map(async (album) => ({ ...album, cover: await signedMediaUrl(album.cover_path), signedPhotos: await Promise.all((album.album_photos ?? []).map(async (photo) => ({ ...photo, url: await signedMediaUrl(photo.storage_path) }))) })));
      if (live) { setAlbums(withMedia); setStatus("ready"); }
    });
    return () => { live = false; };
  }, [destination]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (selectedAlbum && dialog && !dialog.open) dialog.showModal();
    if (!selectedAlbum && dialog?.open) dialog.close();
  }, [selectedAlbum]);

  const closeAlbum = () => { setSelectedAlbum(null); window.setTimeout(() => triggerRef.current?.focus(), 0); };
  const label = destination[0].toUpperCase() + destination.slice(1);

  return <section className={className} id={id} aria-labelledby={`${id}-title`}><div className="section-head"><h2 id={`${id}-title`}>{title}</h2><p>{copy}</p></div>
    {status === "loading" && <p className="album-empty" role="status">Checking for published albums…</p>}
    {status === "error" && <p className="album-empty" role="alert">Albums could not be loaded right now. Please try again later.</p>}
    {status === "unavailable" && <p className="album-empty">Album service is not configured.</p>}
    {status === "ready" && albums.length === 0 && <div className="album-empty" role="status"><strong>No published {label} albums yet.</strong><span>New albums will appear here after they are published from the private dashboard.</span></div>}
    {albums.length > 0 && <div className="album-grid">{albums.map((album, index) => <button className="album-card card" type="button" data-reveal data-reveal-delay={index % 4 || undefined} key={album.id} onClick={(event) => { triggerRef.current = event.currentTarget; setSelectedAlbum(album); }}><img src={album.cover} alt={album.title} loading="lazy" /><span>{album.location || `${label} album`}</span><strong>{album.title}</strong><small>Open album</small></button>)}</div>}
    <dialog ref={dialogRef} className="album-modal" aria-labelledby={`${id}-modal-title`} onCancel={(event) => { event.preventDefault(); closeAlbum(); }} onClick={(event) => { if (event.target === event.currentTarget) closeAlbum(); }} onClose={() => setSelectedAlbum(null)}>{selectedAlbum && <><div className="album-modal__bar"><div><p>Photo album</p><h2 id={`${id}-modal-title`}>{selectedAlbum.title}</h2></div><button className="album-modal__close" type="button" onClick={closeAlbum} aria-label="Close photo album">×</button></div><p className="album-modal__description">{selectedAlbum.description}</p><div className="album-modal__gallery">{selectedAlbum.signedPhotos.map((photo, index) => <figure key={photo.id}><img src={photo.url} alt={`${selectedAlbum.title} photo ${index + 1}`} loading="lazy" /></figure>)}</div></>}</dialog>
  </section>;
}
