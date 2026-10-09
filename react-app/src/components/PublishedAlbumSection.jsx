import { useRef, useState } from "react";
import AlbumViewer from "./AlbumViewer.jsx";
import useNearViewport from "../hooks/useNearViewport.js";
import usePublishedAlbums from "../hooks/usePublishedAlbums.js";

export default function PublishedAlbumSection({ destination, id, title, copy, className = "tech-community" }) {
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const triggerRef = useRef(null);
  const [sectionRef, sectionReady] = useNearViewport();
  const { albums, status } = usePublishedAlbums(destination, sectionReady);

  const closeAlbum = () => { setSelectedAlbum(null); window.setTimeout(() => triggerRef.current?.focus(), 0); };
  const label = destination[0].toUpperCase() + destination.slice(1);

  return <section ref={sectionRef} className={className} id={id} aria-labelledby={`${id}-title`} data-viewport-section><div className="section-head" data-reveal><h2 id={`${id}-title`}>{title}</h2><p>{copy}</p></div>
    {status === "loading" && <p className="album-empty" role="status" data-reveal>Checking for published albums…</p>}
    {status === "error" && <p className="album-empty" role="alert" data-reveal>Albums could not be loaded right now. Please try again later.</p>}
    {status === "unavailable" && <p className="album-empty" data-reveal>Album service is not configured.</p>}
    {status === "ready" && albums.length === 0 && <div className="album-empty" role="status" data-reveal><strong>No published {label} albums yet.</strong><span>New albums will appear here after they are published from the private dashboard.</span></div>}
    {albums.length > 0 && <div className="album-grid">{albums.map((album, index) => <button className="album-card card" type="button" data-reveal data-reveal-delay={index % 4 || undefined} key={album.id} onClick={(event) => { triggerRef.current = event.currentTarget; setSelectedAlbum(album); }}><img src={album.cover} alt={album.title} loading="lazy" decoding="async" /><span>{album.location || `${label} album`}</span><strong>{album.title}</strong><small>Open album</small></button>)}</div>}
    <AlbumViewer album={selectedAlbum} titleId={`${id}-album-viewer-title`} onRequestClose={closeAlbum} />
  </section>;
}
