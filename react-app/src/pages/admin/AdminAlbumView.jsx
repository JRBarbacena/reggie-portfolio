export const MAX_TECH_PHOTOS = 30;
export const MAX_TRAVEL_PHOTOS = 12;
export const MAX_LIFE_PHOTOS = 30;

export function contentName(destination, plural = false) {
  if (destination === "travel") return plural ? "travel journals" : "travel journal";
  if (destination === "life") return plural ? "life albums" : "life album";
  return plural ? "tech albums" : "tech album";
}

export function photoLimitFor(destination) {
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

const workspaces = {
  tech: "Tech album workspace",
  travel: "Travel journal workspace",
  life: "Life album workspace",
};

export default function AdminAlbumView({
  view,
  albums,
  techItems,
  travelItems,
  lifeItems,
  publishedCount,
  inboxState,
  newInquiryCount,
  editing,
  busy,
  onOpenWorkspace,
  onCreate,
  onSave,
  onEdit,
  onPublish,
  onDelete,
  onCancelEdit,
  onRemovePhoto,
}) {
  if (view === "overview") {
    return (
      <section className="admin-dashboard__overview" aria-labelledby="overview-title">
        <div className="admin-content-list__heading"><div><p className="react-eyebrow">At a glance</p><h2 id="overview-title">Portfolio content</h2></div></div>
        <p className="react-muted">{inboxState === "ready" ? `${newInquiryCount} new contact message${newInquiryCount === 1 ? "" : "s"} are waiting in the private inbox.` : "The private contact inbox becomes available after its Supabase migration is installed."}</p>
        <div className="admin-dashboard__stats"><article><strong>{albums.length}</strong><span>Total entries</span></article><article><strong>{publishedCount}</strong><span>Published</span></article><article><strong>{techItems.length}</strong><span>Tech albums</span></article><article><strong>{travelItems.length}</strong><span>Travel journals</span></article><article><strong>{lifeItems.length}</strong><span>Life albums</span></article></div>
        <div className="admin-dashboard__destinations"><button type="button" onClick={() => onOpenWorkspace("tech")}><span>Media collection</span><strong>Manage Tech albums</strong><small>Event and project galleries · up to {MAX_TECH_PHOTOS} photos</small></button><button type="button" onClick={() => onOpenWorkspace("travel")}><span>Written stories</span><strong>Manage Travel journals</strong><small>Article body, cover, category · up to {MAX_TRAVEL_PHOTOS} story images</small></button><button type="button" onClick={() => onOpenWorkspace("life")}><span>Personal moments</span><strong>Manage Life albums</strong><small>Games, rides, coffee, and everyday galleries · up to {MAX_LIFE_PHOTOS} photos</small></button></div>
      </section>
    );
  }

  const items = { tech: techItems, travel: travelItems, life: lifeItems }[view] ?? [];
  return (
    <section className="admin-dashboard__workspace" aria-label={workspaces[view]}>
      <ContentForm destination={view} busy={busy} onSubmit={onCreate} />
      <ContentList destination={view} items={items} busy={busy} onEdit={onEdit} onPublish={onPublish} onDelete={onDelete} />
      {editing?.destination === view && <ContentForm destination={view} item={editing} busy={busy} onSubmit={onSave} onCancel={onCancelEdit} onRemovePhoto={onRemovePhoto} />}
    </section>
  );
}
