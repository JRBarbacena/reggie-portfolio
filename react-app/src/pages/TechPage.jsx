import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase.js";
import AlbumViewer from "../components/AlbumViewer.jsx";
import PortfolioTerminal from "../components/PortfolioTerminal.jsx";
import useNearViewport from "../hooks/useNearViewport.js";
import { responsiveCertificatePath, responsiveCertificateSrcSet, responsivePhotoPath, responsivePhotoSrcSet } from "../responsive-photos.js";
import "./TechHeadings.css";

const certificates = [
  ["cert-python.png", "cert-python.png", "Python", "Certiport", "Open the Python Information Technology Specialist certificate", "Information Technology Specialist certification in Python awarded to John Reggie Manuel Barbacena"],
  ["cert-matlab.png", "cert-matlab.png", "MATLAB", "LinkedIn Learning", "Open the Learning MATLAB certificate", "LinkedIn Learning MATLAB course completion certificate awarded to John Reggie Barbacena"],
  ["cert-barbacena.png", "cert-barbacena.png", "Project Management Ready", "PMI", "Open the PMI Project Management Ready certificate", "PMI Project Management Ready credential awarded to John Reggie Manuel Barbacena"],
  ["cert-agile.png", "cert-agile.png", "Agile Software Development", "LinkedIn Learning", "Open the Agile Software Development certificate", "LinkedIn Learning Agile Software Development course completion certificate awarded to John Reggie Barbacena"],
  ["cert-new-certificate.png", "cert-new-certificate.pdf", "AI Fluency: Frameworks & Foundations", "Anthropic", "Open the AI Fluency: Frameworks & Foundations certificate", "Anthropic AI Fluency: Frameworks & Foundations certificate of completion"],
];
const TechStackWall = lazy(() => import("../components/TechStackWall.jsx"));
const CERTIFICATES_PER_ROW = 4;

const devDaysPhotos = [
  "2F80711D-1C12-45AA-83B7-B6F67826288A.jpg",
  "IMG_3949.JPG",
  "IMG_3950.JPG",
  "IMG_3952.JPG",
  "IMG_3961.JPG",
  "IMG_3971.JPG",
  "IMG_3972.JPG",
  "IMG_3980.JPG",
  "IMG_3983.JPG",
  "IMG_3994.JPG",
  "IMG_3999.JPG",
];

const relxAiSummitPhotos = [
  "IMG_7209_20261002_121809.jpg",
  "IMG_4285.JPG",
  "43aa266a104545595bc6cd055b30b40d.jpeg",
  "IMG_7213_20261002_122151.jpg",
  "IMG_4283.JPG",
  "833751932_1080292504639977_6654496524167651850_n.jpg",
  "IMG_7215_20261002_122224.jpg",
  "IMG_4286.JPG",
  "005799b9cfd9f2415447eb490294069c.jpeg",
  "IMG_7207_20261002_121736.jpg",
  "IMG_4293.JPG",
  "471fa3508dd226f4d5f1a5d6b9e311d6.jpeg",
  "IMG_7210_20261002_121941.jpg",
  "IMG_4287.JPG",
  "385882727b54f89942f49f686d69b125.jpeg",
  "IMG_7214_20261002_122207.jpg",
  "bdc5b02b12902e6460994949fa3d17ff.jpeg",
];

const builtInTechAlbums = [
  {
    id: "built-in-devdays",
    title: "DevDays at Microsoft",
    description: "A day of developer conversations, community connections, and learning inside Microsoft Philippines.",
    location: "Microsoft Philippines",
    cover: responsivePhotoPath("devdays/IMG_3994.JPG"),
    coverSrcSet: responsivePhotoSrcSet("devdays/IMG_3994.JPG"),
    signedPhotos: devDaysPhotos.map((filename, index) => ({
      id: `built-in-devdays-${index + 1}`,
      url: responsivePhotoPath(`devdays/${filename}`),
      srcSet: responsivePhotoSrcSet(`devdays/${filename}`),
    })),
  },
  {
    id: "built-in-relx-ai-summit",
    title: "RELX AI Summit",
    description: "A day of conversations, demonstrations, and community moments at the RELX Reed Elsevier AI Summit. I attended with my fellow ACM (Association for Computing Machinery) co-directors Daniela Torres, Kent Anthony Capuno, Syril Celis, and Dazzle Jean Alcordo, alongside other FEU Tech students with the guidance of Mr. Justine Jude Pura and Mr. Rodion Jimenez.",
    location: "UP Ayala Land Technohub",
    cover: responsivePhotoPath("relx-ai-summit/IMG_7209_20261002_121809.jpg"),
    coverSrcSet: responsivePhotoSrcSet("relx-ai-summit/IMG_7209_20261002_121809.jpg"),
    signedPhotos: relxAiSummitPhotos.map((filename, index) => ({
      id: `built-in-relx-ai-summit-${index + 1}`,
      url: responsivePhotoPath(`relx-ai-summit/${filename}`),
      srcSet: responsivePhotoSrcSet(`relx-ai-summit/${filename}`),
    })),
  },
];

async function signedMediaUrl(path) {
  if (!supabase || !path) return "";
  const { data, error } = await supabase.storage.from("album-media").createSignedUrl(path, 60 * 60);
  return error ? "" : data?.signedUrl ?? "";
}

export default function TechPage() {
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [publishedAlbums, setPublishedAlbums] = useState([]);
  const triggerRef = useRef(null);
  const certificateDialogRef = useRef(null);
  const certificateTriggerRef = useRef(null);
  const [stackRef, stackReady] = useNearViewport();
  const [albumRef, albumsReady] = useNearViewport();

  useEffect(() => {
    if (!albumsReady) return undefined;
    if (!supabase) return undefined;
    let live = true;
    supabase.from("albums").select("id,title,description,location,cover_path,album_photos(id,storage_path,sort_order)").eq("published", true).eq("destination", "tech").order("created_at", { ascending: false }).order("sort_order", { referencedTable: "album_photos", ascending: true }).then(async ({ data, error }) => {
      if (!live) return;
      if (error) return;
      const withMedia = await Promise.all((data ?? []).map(async (album) => ({ ...album, cover: await signedMediaUrl(album.cover_path), signedPhotos: await Promise.all((album.album_photos ?? []).map(async (photo) => ({ ...photo, url: await signedMediaUrl(photo.storage_path) }))) })));
      if (live) setPublishedAlbums(withMedia);
    });
    return () => { live = false; };
  }, [albumsReady]);

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
  const visibleAlbums = [...builtInTechAlbums, ...publishedAlbums];

  // The shared AppShell renders the site footer after these Tech sections.
  return <main id="main" className="content-column" aria-label="Technology portfolio">
    {/* Hero section: developer introduction and terminal. */}
    <section className="tech-hero" aria-labelledby="tech-title" data-viewport-section><div data-reveal><h1 id="tech-title">Turning ideas into thoughtful digital experiences.</h1><p className="tech-hero__subhead">A Computer Science student specializing in Software Engineering, focused on frontend development and UI/UX where clear interfaces meet dependable code.</p></div><PortfolioTerminal command="whoami" output="Software Engineer | Philanthropist | System Design & AI" ariaLabel="Animated developer introduction" /></section>
    {/* Experience section: learning journey and educational background. */}
    <section className="tech-path" aria-labelledby="path-title" data-viewport-section><SectionHead id="path-title" variant="experience" title={<><strong>Experience</strong><span className="tech-heading__join">&amp;</span><em>Academic Background</em></>} /><article className="experience-log tech-experience card" data-reveal><div className="experience-log__entry"><p className="experience-log__time">Current</p><span className="experience-log__marker" aria-hidden="true" /><div className="experience-log__content"><p className="timeline__meta">Education &amp; community</p><h3>BS Computer Science, major in Software Engineering</h3><p className="experience-log__school">FEU Institute of Technology</p><p>I am building the technical foundation to create reliable software, while leaning further into frontend development and UI/UX design. I also take part in ACM community activities and events at school.</p></div></div></article></section>
    {/* Stack section: interactive tech-stack wall. */}
    <section ref={stackRef} className="tech-toolbox" id="stack" aria-labelledby="stack-title" data-viewport-section><SectionHead id="stack-title" variant="tools" title={<>Tools I <em>build</em> with</>} />{stackReady ? <Suspense fallback={<div className="viewport-placeholder viewport-placeholder--wall" aria-hidden="true" />}><TechStackWall /></Suspense> : <div className="viewport-placeholder viewport-placeholder--wall" aria-hidden="true" />}</section>
    {/* Certificate section: verified learning credentials and shelf. */}
    <CertificateShelf onSelect={(certificate, trigger, restoreFocus) => { certificateTriggerRef.current = { element: trigger, restoreFocus }; setSelectedCertificate(certificate); }} />
    {/* Album section: published Tech photo collections and modal viewer. */}
    <section ref={albumRef} className="tech-community" id="community" aria-labelledby="community-title" data-viewport-section>
      <SectionHead id="community-title" variant="album" title={<>Photo <em>Album</em></>} />
      <div className="album-grid">
        {visibleAlbums.map((album, index) => <button className="album-card card" type="button" data-reveal data-reveal-delay={index % 4 || undefined} key={album.id} onClick={(event) => { triggerRef.current = event.currentTarget; setSelectedAlbum(album); }}><img src={album.cover} srcSet={album.coverSrcSet} sizes="(max-width: 700px) 88vw, (max-width: 1050px) 42vw, 27vw" alt={`Cover for ${album.title}`} loading="lazy" decoding="async" /><span>{album.location || "Tech album"}</span><strong>{album.title}</strong><small>Open album</small></button>)}
      </div>
    </section>
    <AlbumViewer album={selectedAlbum} titleId="tech-album-viewer-title" onRequestClose={closeAlbum} />
    <CertificateDialog dialogRef={certificateDialogRef} selectedCertificate={selectedCertificate} closeCertificate={closeCertificate} onClosed={() => setSelectedCertificate(null)} />
    {/* CTA section; the shared footer follows this page in AppShell. */}
    <section className="story-closing neu-inset" aria-label="Technology philosophy" data-reveal data-viewport-section><blockquote>Build useful things. Make them feel human.</blockquote><span aria-hidden="true">THINK / DESIGN / SHIP</span></section>
  </main>;
}

function CertificateShelf({ onSelect }) {
  const rows = Math.ceil(certificates.length / CERTIFICATES_PER_ROW);

  return <section className="tech-certificates" aria-labelledby="certificates-title" data-viewport-section>
    <SectionHead id="certificates-title" variant="certificates" title={<>Certifications <span>&amp;</span> <em>Awards</em></>} />
    <div className={`credential-shelf credential-shelf--${rows}-rows`} style={{ "--shelf-rows": rows }} data-reveal>
      {certificates.map((certificate, index) => {
        const [preview, document, title, source, label, alt] = certificate;
        return <button className="credential-book" type="button" aria-label={label} aria-haspopup="dialog" data-reveal data-reveal-delay={index || undefined} key={document} onClick={(event) => {
          const restoreFocus = event.detail === 0;
          if (!restoreFocus) event.currentTarget.blur();
          onSelect(certificate, event.currentTarget, restoreFocus);
        }}>
          <figure>
            <img src={responsiveCertificatePath(preview, 720)} srcSet={responsiveCertificateSrcSet(preview)} sizes="(max-width: 700px) 42vw, 20vw" alt={alt} width="1584" height="1224" loading="lazy" decoding="async" />
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
        <img src={responsiveCertificatePath(preview)} srcSet={responsiveCertificateSrcSet(preview)} sizes="min(76vw, 58rem)" alt={`${title} certificate from ${source}`} decoding="async" />
      </figure>
      <div className="certificate-modal__body">
        <h2 id="certificate-modal-title">{title}</h2>
        <p>Verified learning and completion through {source}.</p>
      </div>
    </article>
    <button className="album-modal__close certificate-modal__close" type="button" onClick={closeCertificate} aria-label="Close certificate">×</button>
  </dialog>;
}

function SectionHead({ id, title, copy, variant }) { return <div className={`section-head tech-section-head tech-section-head--${variant}`} data-reveal><h2 id={id}>{title}</h2>{copy && <p>{copy}</p>}</div>; }
