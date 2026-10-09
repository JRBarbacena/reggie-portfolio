import { describe, expect, it } from "vitest";
import { loadPublishedAlbums } from "../../react-app/src/lib/published-albums.js";

function clientWith({ responses, signedUrls = {} }) {
  const selects = [];
  const signedBatches = [];
  return {
    selects,
    signedBatches,
    from(table) {
      expect(table).toBe("albums");
      return {
        select(fields) {
          selects.push(fields);
          const response = responses.shift();
          const builder = {
            eq() { return builder; },
            order() {
              if (builder.orderCalls++ === 0) return builder;
              return Promise.resolve(response);
            },
            orderCalls: 0,
          };
          return builder;
        },
      };
    },
    storage: {
      from(bucket) {
        expect(bucket).toBe("album-media");
        return {
          async createSignedUrls(paths) {
            signedBatches.push(paths);
            return {
              data: paths.filter((path) => signedUrls[path]).map((path) => ({ path, signedUrl: signedUrls[path] })),
              error: null,
            };
          },
          async createSignedUrl(path) {
            return signedUrls[path]
              ? { data: { signedUrl: signedUrls[path] }, error: null }
              : { data: null, error: new Error("missing media") };
          },
        };
      },
    },
  };
}

describe("published albums", () => {
  it("loads albums and enriches their media with signed URLs", async () => {
    const client = clientWith({
      responses: [{ data: [{
        id: "album-1",
        cover_path: "album-1/cover.jpg",
        album_photos: [{ id: "photo-1", storage_path: "album-1/photo.jpg" }],
      }], error: null }],
      signedUrls: {
        "album-1/cover.jpg": "https://media.test/cover",
        "album-1/photo.jpg": "https://media.test/photo",
      },
    });

    await expect(loadPublishedAlbums(client, "tech")).resolves.toMatchObject([{
      cover: "https://media.test/cover",
      signedPhotos: [{ url: "https://media.test/photo" }],
    }]);
    expect(client.selects).toHaveLength(1);
    expect(client.signedBatches).toEqual([["album-1/cover.jpg", "album-1/photo.jpg"]]);
  });

  it("retries Travel without travel_scope and defaults it to local", async () => {
    const client = clientWith({
      responses: [
        { data: null, error: new Error("missing travel_scope") },
        { data: [{ id: "travel-1", cover_path: null, album_photos: [] }], error: null },
      ],
    });

    await expect(loadPublishedAlbums(client, "travel")).resolves.toMatchObject([{
      id: "travel-1",
      travel_scope: "local",
    }]);
    expect(client.selects).toHaveLength(2);
    expect(client.selects[0]).toContain("travel_scope");
    expect(client.selects[1]).not.toContain("travel_scope");
  });

  it("surfaces a persistent query error", async () => {
    const error = new Error("albums unavailable");
    const client = clientWith({
      responses: [
        { data: null, error },
        { data: null, error },
      ],
    });

    await expect(loadPublishedAlbums(client, "travel")).rejects.toBe(error);
  });
});
