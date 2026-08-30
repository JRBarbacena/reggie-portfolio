import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = fileURLToPath(new URL("../", import.meta.url));
const ROOT = path.join(PROJECT_ROOT, "dist-react");
const VERCEL_CONFIG = JSON.parse(
  await readFile(new URL("../vercel.json", import.meta.url), "utf8"),
);
const REDIRECTS = new Map(
  (VERCEL_CONFIG.redirects ?? []).map((redirect) => [redirect.source, redirect]),
);
const CONTENT_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".webm", "video/webm"],
]);

export const ROUTE_CONTRACT_VERSION = 2;

function responseHeaders(pathname, file) {
  const headers = new Map();
  for (const rule of VERCEL_CONFIG.headers ?? []) {
    if (!new RegExp(`^${rule.source}$`).test(pathname)) continue;
    for (const { key, value } of rule.headers) headers.set(key, value);
  }
  headers.set("Content-Type", CONTENT_TYPES.get(path.extname(file).toLowerCase()) ?? "application/octet-stream");
  return Object.fromEntries(headers);
}

function safeFile(root, relative) {
  const resolvedRoot = path.resolve(root);
  const target = path.resolve(resolvedRoot, relative);
  const prefix = `${resolvedRoot}${path.sep}`;
  return target === resolvedRoot || target.startsWith(prefix) ? target : null;
}

async function existingFile(root, pathname) {
  const relative = pathname.replace(/^\/+/, "");
  if (!relative) return "index.html";
  const target = safeFile(root, relative);
  if (!target) return null;
  try {
    return (await stat(target)).isFile() ? relative : null;
  } catch {
    return null;
  }
}

export function createPreviewServer(root = ROOT) {
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://preview.local");
      const pathname = decodeURIComponent(url.pathname);
      const redirect = REDIRECTS.get(pathname);
      if (redirect) {
        response.writeHead(redirect.permanent ? 308 : 307, {
          Location: `${redirect.destination}${url.search}`,
          "Cache-Control": "public, max-age=0, must-revalidate",
        });
        response.end();
        return;
      }

      const relative = await existingFile(root, pathname) ?? "index.html";
      const target = safeFile(root, relative);
      if (!target) throw new Error("Resolved path escaped preview root");
      const body = await readFile(target);
      response.writeHead(200, responseHeaders(pathname, relative));
      response.end(request.method === "HEAD" ? undefined : body);
    } catch (error) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Preview server error");
      console.error(error);
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  createPreviewServer().listen(port, "127.0.0.1", () => {
    console.log(`Portfolio preview: http://127.0.0.1:${port}`);
  });
}
