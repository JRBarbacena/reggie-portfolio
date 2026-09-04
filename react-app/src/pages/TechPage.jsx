import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase.js";
import PortfolioTerminal from "../components/PortfolioTerminal.jsx";
import TechStackWall from "../components/TechStackWall.jsx";

const certificates = [
  ["cert-python.png", "cert-python.png", "Python", "Certiport", "Open the Python Information Technology Specialist certificate", "Information Technology Specialist certification in Python awarded to John Reggie Manuel Barbacena"],
  ["cert-matlab.png", "cert-matlab.png", "MATLAB", "LinkedIn Learning", "Open the Learning MATLAB certificate", "LinkedIn Learning MATLAB course completion certificate awarded to John Reggie Barbacena"],
  ["cert-barbacena.png", "cert-barbacena.png", "Project Management Ready", "PMI", "Open the PMI Project Management Ready certificate", "PMI Project Management Ready credential awarded to John Reggie Manuel Barbacena"],
  ["cert-agile.png", "cert-agile.png", "Agile Software Development", "LinkedIn Learning", "Open the Agile Software Development certificate", "LinkedIn Learning Agile Software Development course completion certificate awarded to John Reggie Barbacena"],
  ["cert-new-certificate.png", "cert-new-certificate.pdf", "AI Fluency: Frameworks & Foundations", "Anthropic", "Open the AI Fluency: Frameworks & Foundations certificate", "Anthropic AI Fluency: Frameworks & Foundations certificate of completion"],
];
const CERTIFICATES_PER_ROW = 4;

async function signedMediaUrl(path) {
  if (!supabase || !path) return "";
  const { data, error } = await supabase.storage.from("album-media").createSignedUrl(path, 60 * 60);
  return error ? "" : data?.signedUrl ?? "";
}

export default function TechPage() {
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [publishedAlbums, setPublishedAlbums] = useState([]);
  const [albumStatus, setAlbumStatus] = useState("loading");
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const certificateDialogRef = useRef(null);
  const certificateTriggerRef = useRef(null);

  useEffect(() => {
    if (!supabase) { setAlbumStatus("unavailable"); return undefined; }
    let live = true;
    supabase.from("albums").select("id,title,description,location,cover_path,album_photos(id,storage_path,sort_order)").eq("published", true).eq("destination", "tech").order("created_at", { ascending: false }).order("sort_order", { referencedTable: "album_photos", ascending: true }).then(async ({ data, error }) => {
      if (!live) return;
      if (error) { setAlbumStatus("error"); return; }
      const withMedia = await Promise.all((data ?? []).map(async (album) => ({ ...album, cover: await signedMediaUrl(album.cover_path), signedPhotos: await Promise.all((album.album_photos ?? []).map(async (photo) => ({ ...photo, url: await signedMediaUrl(photo.storage_path) }))) })));
      if (live) { setPublishedAlbums(withMedia); setAlbumStatus("ready"); }
    });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (selectedAlbum && dialog && !dialog.open) dialog.showModal();
    if (!selectedAlbum && dialog?.open) dialog.close();
  }, [selectedAlbum]);

  useEffect(() => {
    const dialog = certificateDialogRef.current;
    if (selectedCertificate && dialog && !dialog.open) dialog.showModal();
    if (!selectedCertificate && dialog?.open) dialog.close();
  }, [selectedCertificate]);

  const closeAlbum = () => { setSelectedAlbum(null); window.setTimeout(() => triggerRef.current?.focus(), 0); };
  const closeCertificate = () => {
    const trigger = certificateTriggerRef.current;
    setSelectedCertificate(null);
    if (trigger?.restoreFocus) window.setTimeout(() => trigger.element?.focus({ preventScroll: true }), 0);
  };

  // The shared AppShell renders the site footer after these Tech sections.
  return <main id="main" className="content-column" aria-label="Technology portfolio">
    {/* Hero section: developer introduction and terminal. */}
    <section className="tech-hero" aria-labelledby="tech-title"><h1 id="tech-title">Turning ideas into thoughtful digital experiences.</h1><p className="tech-hero__subhead">A Computer Science student specializing in Software Engineering, focused on frontend development and UI/UX where clear interfaces meet dependable code.</p><PortfolioTerminal command="whoami" output="Software Engineer | Philanthropist | System Design & AI" ariaLabel="Animated developer introduction" /></section>
    {/* Experience section: learning journey and educational background. */}
    <section className="tech-path" aria-labelledby="path-title"><SectionHead id="path-title" title="Learning the whole system" copy="Starting with foundations, then connecting code, design, and people." /><article className="experience-log tech-experience card" data-reveal><div className="experience-log__entry"><p className="experience-log__time">Current</p><span className="experience-log__marker" aria-hidden="true" /><div className="experience-log__content"><p className="timeline__meta">Education &amp; community</p><h3>BS Computer Science, major in Software Engineering</h3><p className="experience-log__school">FEU Institute of Technology</p><p>I am building the technical foundation to create reliable software, while leaning further into frontend development and UI/UX design. I also take part in ACM community activities and events at school.</p></div></div></article></section>
    {/* Stack section: interactive tech-stack wall. */}
    <section className="tech-toolbox" id="stack" aria-labelledby="stack-title"><SectionHead id="stack-title" title="Tools I build with" copy="A growing toolkit in motion, shaped by the problems I enjoy solving." /><TechStackWall /></section>
    {/* Certificate section: verified learning credentials and shelf. */}
    <CertificateShelf onSelect={(certificate, trigger, restoreFocus) => { certificateTriggerRef.current = { element: trigger, restoreFocus }; setSelectedCertificate(certificate); }} />
    {/* Album section: published Tech photo collections and modal viewer. */}
    <section className="tech-community" id="community" aria-labelledby="community-title"><SectionHead id="community-title" title="Albums from the field" copy="Moments from the communities, build nights, and spaces helping shape my tech journey." />{albumStatus === "loading" && <p className="album-empty" role="status">Checking for published albums…</p>}{albumStatus === "error" && <p className="album-empty" role="alert">Albums could not be loaded right now. Please try again later.</p>}{albumStatus === "unavailable" && <p className="album-empty">Album service is not configured.</p>}{albumStatus === "ready" && publishedAlbums.length === 0 && <div className="album-empty" role="status"><strong>No published Tech albums yet.</strong><span>New albums will appear here after they are published from the private dashboard.</span></div>}{publishedAlbums.length > 0 && <div className="album-grid">{publishedAlbums.map((album, index) => <button className="album-card card" type="button" data-reveal data-reveal-delay={index % 4 || undefined} key={album.id} onClick={(event) => { triggerRef.current = event.currentTarget; setSelectedAlbum(album); }}><img src={album.cover} alt={album.title} loading="lazy" /><span>{album.location || "Tech album"}</span><strong>{album.title}</strong><small>Open album</small></button>)}</div>}</section>
    <dialog ref={dialogRef} className="album-modal" aria-labelledby="album-modal-title" onCancel={(event) => { event.preventDefault(); closeAlbum(); }} onClick={(event) => { if (event.target === event.currentTarget) closeAlbum(); }} onClose={() => setSelectedAlbum(null)}>{selectedAlbum && <><div className="album-modal__bar"><div><p>Photo album</p><h2 id="album-modal-title">{selectedAlbum.title}</h2></div><button className="album-modal__close" type="button" onClick={closeAlbum} aria-label="Close photo album">×</button></div><p className="album-modal__description">{selectedAlbum.description}</p><div className="album-modal__gallery">{selectedAlbum.signedPhotos.map((photo, index) => <figure key={photo.id}><img src={photo.url} alt={`${selectedAlbum.title} photo ${index + 1}`} loading="lazy" /></figure>)}</div></>}</dialog>
    <CertificateDialog dialogRef={certificateDialogRef} selectedCertificate={selectedCertificate} closeCertificate={closeCertificate} onClosed={() => setSelectedCertificate(null)} />
    {/* CTA section; the shared footer follows this page in AppShell. */}
    <section className="story-closing neu-inset" aria-label="Technology philosophy" data-reveal><blockquote>Build useful things. Make them feel human.</blockquote><span aria-hidden="true">THINK / DESIGN / SHIP</span></section>
  </main>;
}

function CertificateShelf({ onSelect }) {
  const rows = Math.ceil(certificates.length / CERTIFICATES_PER_ROW);

  return <section className="tech-certificates" aria-labelledby="certificates-title">
    <SectionHead id="certificates-title" title="Learning, verified" copy="Formal checkpoints across programming, engineering practice, and project delivery." />
    <div className={`credential-shelf credential-shelf--${rows}-rows`} style={{ "--shelf-rows": rows }}>
      {certificates.map((certificate, index) => {
        const [preview, document, title, source, label, alt] = certificate;
        return <button className="credential-book" type="button" aria-label={label} aria-haspopup="dialog" data-reveal data-reveal-delay={index || undefined} key={document} onClick={(event) => {
          const restoreFocus = event.detail === 0;
          if (!restoreFocus) event.currentTarget.blur();
          onSelect(certificate, event.currentTarget, restoreFocus);
        }}>
          <figure>
            <img src={`/images/certificates/${preview}`} alt={alt} width="1584" height="1224" loading="lazy" />
            <figcaption><strong>{title}</strong></figcaption>
          </figure>
        </button>;
      })}
    </div>
  </section>;
}

function CertificateDialog({ dialogRef, selectedCertificate, closeCertificate, onClosed }) {
  if (!selectedCertificate) return <dialog ref={dialogRef} className="album-modal certificate-modal" aria-labelledby="certificate-modal-title" onCancel={(event) => { event.preventDefault(); closeCertificate(); }} onClick={(event) => { if (event.target === event.currentTarget) closeCertificate(); }} onClose={onClosed} />;

  const [preview, , title, source] = selectedCertificate;
  return <dialog ref={dialogRef} className="album-modal certificate-modal" aria-labelledby="certificate-modal-title" onCancel={(event) => { event.preventDefault(); closeCertificate(); }} onClick={(event) => { if (event.target === event.currentTarget) closeCertificate(); }} onClose={onClosed}>
    <article className="certificate-modal__surface">
      <figure className="certificate-modal__preview">
        <img src={`/images/certificates/${preview}`} alt={`${title} certificate from ${source}`} />
      </figure>
      <div className="certificate-modal__body">
        <h2 id="certificate-modal-title">{title}</h2>
        <p>Verified learning and completion through {source}.</p>
      </div>
    </article>
    <button className="album-modal__close certificate-modal__close" type="button" onClick={closeCertificate} aria-label="Close certificate">×</button>
  </dialog>;
}

function SectionHead({ id, title, copy }) { return <div className="section-head"><h2 id={id}>{title}</h2><p>{copy}</p></div>; }
