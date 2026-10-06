import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";

const Masonry = lazy(() => import("./Masonry.jsx"));

function albumPhotos(album) {
  const gallery = (album?.signedPhotos ?? []).filter((photo) => photo?.url);
  if (gallery.length > 0) return gallery;
  return album?.cover ? [{ id: `${album.id}-cover`, url: album.cover }] : [];
}

export default function AlbumViewer({ album, titleId, onRequestClose }) {
  const dialogRef = useRef(null);
  const closeTimerRef = useRef(0);
  const [isClosing, setIsClosing] = useState(false);
  const photos = useMemo(() => albumPhotos(album).map((photo, index) => ({
    id: String(photo.id ?? `${album?.id}-photo-${index + 1}`),
    img: photo.url,
    srcSet: photo.srcSet,
    alt: `${album?.title ?? "Album"} photo ${index + 1}`,
  })), [album]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (album && dialog && !dialog.open) dialog.showModal();
    if (!album && dialog?.open) dialog.close();
  }, [album]);

  useEffect(() => {
    clearTimeout(closeTimerRef.current);
    setIsClosing(false);
  }, [album?.id]);

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  const closeWithTransition = () => {
    if (!album || isClosing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onRequestClose();
      return;
    }
    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(onRequestClose, 340);
  };

  return <dialog
    ref={dialogRef}
    className={`album-viewer album-viewer--masonry${isClosing ? " is-closing" : ""}`}
    aria-labelledby={titleId}
    onCancel={(event) => { event.preventDefault(); closeWithTransition(); }}
  >
    {album && <article className="album-masonry-modal">
      <header className="album-masonry-modal__header">
        <div>
          <p>{album.location || "Photo album"} · {photos.length} {photos.length === 1 ? "photo" : "photos"}</p>
          <h2 id={titleId}>{album.title}</h2>
          {album.description && <span>{album.description}</span>}
        </div>
        <button type="button" onClick={closeWithTransition} disabled={isClosing} aria-label="Close photo album">×</button>
      </header>

      <div className="album-masonry-modal__scroll">
        {photos.length > 0
          ? <Suspense fallback={<p className="album-masonry-modal__empty">Preparing the gallery…</p>}>
              <Masonry
                items={photos}
                ease="power4.out"
                duration={0.82}
                stagger={0.035}
                animateFrom="bottom"
                scaleOnHover
                hoverScale={1.015}
                blurToFocus
              />
            </Suspense>
          : <p className="album-masonry-modal__empty">This album does not have viewable photos yet.</p>}
      </div>
    </article>}
  </dialog>;
}
