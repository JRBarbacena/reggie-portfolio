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

export async function signedAlbumMediaUrls(client, paths) {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  if (!uniquePaths.length) return new Map();
  const storage = client.storage.from("album-media");
  const { data, error } = await storage.createSignedUrls(uniquePaths, 60 * 60);
  if (!error) return new Map((data ?? []).map((item) => [item.path, item.signedUrl ?? ""]));

  // Preserve partial media when a legacy backend rejects the batch.
  const fallback = await Promise.all(uniquePaths.map(async (path) => {
    const result = await storage.createSignedUrl(path, 60 * 60);
    return [path, result.error ? "" : result.data?.signedUrl ?? ""];
  }));
  return new Map(fallback);
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

  const albums = response.data ?? [];
  const mediaPaths = albums.flatMap((album) => [
    album.cover_path,
    ...(album.album_photos ?? []).map((photo) => photo.storage_path),
  ]);
  const signedUrls = await signedAlbumMediaUrls(client, mediaPaths);

  return albums.map((album) => ({
    ...album,
    ...(isTravel ? { travel_scope: album.travel_scope ?? "local" } : {}),
    cover: signedUrls.get(album.cover_path) ?? "",
    signedPhotos: (album.album_photos ?? []).map((photo) => ({
      ...photo,
      url: signedUrls.get(photo.storage_path) ?? "",
    })),
  }));
}
