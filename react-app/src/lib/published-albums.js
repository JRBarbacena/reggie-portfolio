const ALBUM_FIELDS = "id,title,description,location,cover_path,album_photos(id,storage_path,sort_order)";
const TRAVEL_ALBUM_FIELDS = "id,title,description,location,cover_path,travel_scope,album_photos(id,storage_path,sort_order)";

function publishedAlbumQuery(client, destination, includeTravelScope) {
  return client
    .from("albums")
    .select(includeTravelScope ? TRAVEL_ALBUM_FIELDS : ALBUM_FIELDS)
    .eq("published", true)
    .eq("destination", destination)
    .order("created_at", { ascending: false })
    .order("sort_order", { referencedTable: "album_photos", ascending: true });
}

export async function signedAlbumMediaUrl(client, path) {
  if (!path) return "";
  const { data, error } = await client.storage.from("album-media").createSignedUrl(path, 60 * 60);
  return error ? "" : data?.signedUrl ?? "";
}

export async function loadPublishedAlbums(client, destination) {
  const isTravel = destination === "travel";
  let response = await publishedAlbumQuery(client, destination, isTravel);

  // Keep Travel compatible with databases that have not applied the
  // travel_scope migration yet.
  if (isTravel && response.error) {
    response = await publishedAlbumQuery(client, destination, false);
  }

  if (response.error) throw response.error;

  return Promise.all((response.data ?? []).map(async (album) => ({
    ...album,
    ...(isTravel ? { travel_scope: album.travel_scope ?? "local" } : {}),
    cover: await signedAlbumMediaUrl(client, album.cover_path),
    signedPhotos: await Promise.all((album.album_photos ?? []).map(async (photo) => ({
      ...photo,
      url: await signedAlbumMediaUrl(client, photo.storage_path),
    }))),
  })));
}
