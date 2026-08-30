import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildSiteArtifacts, generateSite } from "../../scripts/generate-site.mjs";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../..");
const roots = [];
const pageData = [
  ["home", "Home", "/", "index.html", "primary"],
  ["tech", "Tech", "/tech", "tech.html", "primary"],
  ["travel", "Travel", "/travel", "travel.html", "primary"],
  ["life", "Life", "/life", "life.html", "primary"],
];

function manifestFixture() {
  return {
    $schema: "./site-manifest.schema.v1.json",
    schemaVersion: 1,
    cache: { namespace: "fixture-site" },
    hosting: {
      buildCommand: "npm run build:react",
      cleanUrls: true,
      framework: "vite",
      outputDirectory: "dist-react",
      rewrites: [{ source: "/(.*)", destination: "/" }],
      trailingSlash: false,
      headers: [],
    },
    pages: pageData.map(([id, label, route, document, tier], order) => ({
      id, label, route, document, tier, order, h1: label,
    })),
    utilities: [
      { id: "not-found", route: "/404", document: "404.html", cacheRole: "none", h1: "Missing" },
      { id: "offline", route: "/offline", document: "offline.html", cacheRole: "shell", h1: "Offline" },
    ],
    assets: [
      { path: "js/main.js", kind: "module", availability: "required", mutability: "mutable", cacheRole: "shell" },
      { path: "css/main.css", kind: "style", availability: "required", mutability: "mutable", cacheRole: "shell" },
      { path: "images/optional.png", kind: "image", availability: "optional", mutability: "content-addressed", cacheRole: "runtime" },
    ],
  };
}

async function createFixture(mutate = () => {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "portfolio-manifest-"));
  roots.push(root);
  await Promise.all(["config", "js", "css"].map((dir) => mkdir(path.join(root, dir), { recursive: true })));
  const schema = await readFile(path.join(PROJECT_ROOT, "config/site-manifest.schema.v1.json"));
  await writeFile(path.join(root, "config/site-manifest.schema.v1.json"), schema);
  const manifest = manifestFixture();
  mutate(manifest);
  await writeFile(path.join(root, "config/site-manifest.json"), JSON.stringify(manifest, null, 2));
  for (const [, label, , document] of pageData) await writeFile(path.join(root, document), `<h1>${label}</h1>\n`);
  await writeFile(path.join(root, "404.html"), "<h1>Missing</h1>\n");
  await writeFile(path.join(root, "offline.html"), "<h1>Offline</h1>\n");
  await writeFile(path.join(root, "js/main.js"), 'import "./dependency.js";\n');
  await writeFile(path.join(root, "js/dependency.js"), "export const value = 1;\n");
  await writeFile(path.join(root, "css/main.css"), '@import "./dependency.css";\n');
  await writeFile(path.join(root, "css/dependency.css"), ":root { color: black; }\n");
  return { root, rootDir: root, manifestPath: path.join(root, "config/site-manifest.json") };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});
describe("site manifest validation", () => {
  it.each([
    ["duplicate product routes", (manifest) => { manifest.pages[1].route = "/"; }, /duplicate route/],
    ["missing product routes", (manifest) => { manifest.pages.pop(); }, /must NOT have fewer than 4 items/],
    ["utility navigation entries", (manifest) => { manifest.utilities[0].tier = "primary"; }, /must NOT have additional properties/],
    ["invalid cache roles", (manifest) => { manifest.assets[0].cacheRole = "precache-everything"; }, /must be equal to one of the allowed values/],
  ])("rejects %s", async (_label, mutate, error) => {
    const fixture = await createFixture(mutate);
    await expect(buildSiteArtifacts(fixture)).rejects.toThrow(error);
  });

  it("rejects a missing mandatory asset while allowing a missing optional asset", async () => {
    const fixture = await createFixture();
    await rm(path.join(fixture.root, "js/main.js"));
    await expect(buildSiteArtifacts(fixture)).rejects.toThrow(/missing mandatory asset/);
  });

  it.each([
    ["unresolved", 'import "./missing.js";\n', /unresolved import/],
    ["out-of-root", 'import "../../outside.js";\n', /escapes site root/],
  ])("rejects %s imports", async (_label, source, error) => {
    const fixture = await createFixture();
    await writeFile(path.join(fixture.root, "js/main.js"), source);
    await expect(buildSiteArtifacts(fixture)).rejects.toThrow(error);
  });

  it("rejects cyclic transitive imports", async () => {
    const fixture = await createFixture();
    await writeFile(path.join(fixture.root, "js/dependency.js"), 'import "./main.js";\n');
    await expect(buildSiteArtifacts(fixture)).rejects.toThrow(/cyclic import/);
  });
});

describe("site artifact determinism", () => {
  it("writes byte-identical artifacts and passes check mode", async () => {
    const fixture = await createFixture();
    const first = await generateSite(fixture);
    const firstBytes = new Map();
    for (const relative of first.artifacts.keys()) {
      firstBytes.set(relative, await readFile(path.join(fixture.root, relative), "utf8"));
    }
    const second = await generateSite(fixture);
    expect(second.stale).toEqual([]);
    await expect(generateSite({ ...fixture, check: true })).resolves.toMatchObject({ stale: [] });
    for (const [relative, bytes] of firstBytes) {
      expect(await readFile(path.join(fixture.root, relative), "utf8")).toBe(bytes);
    }
  });

  it("changes only the cache artifact and identity for one imported-file mutation", async () => {
    const fixture = await createFixture();
    const before = await buildSiteArtifacts(fixture);
    await writeFile(path.join(fixture.root, "css/dependency.css"), ":root { color: navy; }\n");
    const after = await buildSiteArtifacts(fixture);
    const changed = [...before.artifacts.keys()].filter((key) => before.artifacts.get(key) !== after.artifacts.get(key));
    expect(after.identity).not.toBe(before.identity);
    expect(changed).toEqual(["js/generated/cache-manifest.js"]);
  });

  it("detects stale checked-in output without rewriting it", async () => {
    const fixture = await createFixture();
    await generateSite(fixture);
    await writeFile(path.join(fixture.root, "js/generated/pages.js"), "stale\n");
    await expect(generateSite({ ...fixture, check: true })).rejects.toThrow(/js\/generated\/pages\.js/);
    expect(await readFile(path.join(fixture.root, "js/generated/pages.js"), "utf8")).toBe("stale\n");
  });
});
