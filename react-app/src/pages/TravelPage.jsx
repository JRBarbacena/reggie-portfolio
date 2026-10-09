import { useEffect, useRef, useState } from "react";
import PortfolioTerminal from "../components/PortfolioTerminal.jsx";
import useNearViewport from "../hooks/useNearViewport.js";
import usePublishedAlbums from "../hooks/usePublishedAlbums.js";

const travelCollections = [
  {
    key: "international",
    eyebrow: "Beyond the Philippines",
    title: "International Travel",
    description: "Passport stamps, unfamiliar streets, and stories gathered farther from home.",
    comingSoon: "The next passport stamp is still unwritten.",
  },
  {
    key: "local",
    eyebrow: "Across the archipelago",
    title: "Local Travel",
    description: "Nearby escapes, island routes, and hidden gems discovered around the Philippines.",
    comingSoon: "There is always another corner of home to explore.",
  },
];

function excerptFor(story) {
  const plainText = story.replace(/\s+/g, " ").trim();
  return plainText.length > 150 ? `${plainText.slice(0, 147)}…` : plainText;
}

export default function TravelPage() {
  const [selectedJournal, setSelectedJournal] = useState(null);
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const [collectionsRef, collectionsReady] = useNearViewport();
  const { albums: journals, status } = usePublishedAlbums("travel", collectionsReady);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (selectedJournal && dialog && !dialog.open) dialog.showModal();
    if (!selectedJournal && dialog?.open) dialog.close();
  }, [selectedJournal]);

  const closeJournal = () => {
    setSelectedJournal(null);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  return (
    <main id="main" className="content-column travel-redesign">
      <section className="tech-hero travel-redesign__hero" aria-labelledby="travel-title" data-viewport-section>
        <div data-reveal><h1 id="travel-title">Drifting around the world</h1>
          <p className="tech-hero__subhead">A growing travel journal of local escapes, international chapters, and the hidden gems found along the way.</p>
        </div>
        <PortfolioTerminal command="Get-Content Destination" output="Journey, Passport, & Hidden Gems" ariaLabel="Animated travel introduction" />
      </section>

      <section ref={collectionsRef} className="travel-collections" aria-label="Travel journals" data-viewport-section>
        {status === "loading" && <p className="album-empty" role="status" data-reveal>Checking for published journals…</p>}
        {status === "error" && <p className="album-empty" role="alert" data-reveal>Journals could not be loaded right now. Please try again later.</p>}
        {status === "unavailable" && <p className="album-empty" data-reveal>Journal service is not configured.</p>}
        <div className="travel-collection-list">
          {travelCollections.map((collection, collectionIndex) => {
            const collectionJournals = journals.filter((journal) => journal.travel_scope === collection.key);
            return (
              <section className="travel-collection" aria-labelledby={`${collection.key}-travel-title`} key={collection.key} data-viewport-section>
                <div className="travel-collection__heading" data-reveal>
                  <p className="timeline__meta">{collection.eyebrow}</p>
                  <h2 id={`${collection.key}-travel-title`}>{collection.title}</h2>
                  <p>{collection.description}</p>
                </div>

                {status === "ready" && collectionJournals.length === 0 && (
                  <p className="travel-journal-empty" role="status" data-reveal>No published stories here yet.</p>
                )}

                <div className="travel-journal-row">
                  {collectionJournals.map((journal, index) => (
                    <article className="travel-journal-card card" data-reveal data-reveal-delay={index % 4 || undefined} key={journal.id}>
                      <button
                        className="travel-journal-card__open"
                        type="button"
                        onClick={(event) => {
                          triggerRef.current = event.currentTarget;
                          setSelectedJournal(journal);
                        }}
                        aria-label={`Read ${journal.title}`}
                      >
                        {journal.cover ? <img src={journal.cover} alt={`Cover for ${journal.title}`} loading="lazy" decoding="async" /> : <span className="travel-album-card__placeholder" aria-hidden="true" />}
                        <span className="travel-journal-card__body">
                          <span className="timeline__meta">{journal.location || collection.title}</span>
                          <strong>{journal.title}</strong>
                          <span>{excerptFor(journal.description || "A travel story waiting to be documented.")}</span>
                          <small>Read journal</small>
                        </span>
                      </button>
                    </article>
                  ))}

                  <article className="travel-coming-soon card" data-reveal data-reveal-delay={(collectionJournals.length + collectionIndex) % 4 || undefined}>
                    <div className="travel-coming-soon__route" aria-hidden="true"><span /><span /><span /></div>
                    <p className="timeline__meta">Next destination</p>
                    <h3>More coming soon</h3>
                    <p>{collection.comingSoon}</p>
                  </article>
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <dialog
        ref={dialogRef}
        className="album-modal travel-journal-modal"
        aria-labelledby="travel-journal-modal-title"
        onCancel={(event) => { event.preventDefault(); closeJournal(); }}
        onClick={(event) => { if (event.target === event.currentTarget) closeJournal(); }}
        onClose={() => setSelectedJournal(null)}
      >
        {selectedJournal && <>
          <div className="album-modal__bar travel-journal-modal__bar">
            <div>
              <p>Travel journal</p>
              <h2 id="travel-journal-modal-title">{selectedJournal.title}</h2>
            </div>
            <button className="album-modal__close" type="button" onClick={closeJournal} aria-label="Close travel journal">×</button>
          </div>

          {selectedJournal.cover && <figure className="travel-journal-modal__cover"><img src={selectedJournal.cover} alt={`Cover for ${selectedJournal.title}`} decoding="async" /></figure>}
          <p className="travel-journal-modal__meta">{selectedJournal.location || "Travel journal"} · {selectedJournal.travel_scope === "international" ? "International Travel" : "Local Travel"}</p>
          <article className="travel-journal-modal__article">
            {(selectedJournal.description || "This journey is still being documented.").split(/\n+/).filter(Boolean).map((paragraph, index) => <p key={`${selectedJournal.id}-${index}`}>{paragraph}</p>)}
          </article>

          {selectedJournal.signedPhotos.length > 0 && <section className="travel-journal-modal__photos" aria-labelledby="journal-photos-title">
            <h3 id="journal-photos-title">Moments along the way</h3>
            <div className="album-modal__gallery">
              {selectedJournal.signedPhotos.map((photo, index) => <figure key={photo.id}><img src={photo.url} alt={`${selectedJournal.title}, moment ${index + 1}`} loading="lazy" decoding="async" /></figure>)}
            </div>
          </section>}
        </>}
      </dialog>
    </main>
  );
}
