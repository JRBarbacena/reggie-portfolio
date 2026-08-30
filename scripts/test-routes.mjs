import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { createPreviewServer, ROUTE_CONTRACT_VERSION } from "./preview-server.mjs";

const manifest = JSON.parse(await readFile(new URL("../config/site-manifest.json", import.meta.url), "utf8"));
assert.equal(ROUTE_CONTRACT_VERSION, 2);

async function followRoute(base, pathname) {
  let current = new URL(pathname, base);
  const visited = new Set([current.href]);
  let redirects = 0;
  while (true) {
    const response = await fetch(current, { redirect: "manual" });
    if (response.status < 300 || response.status >= 400) {
      return { response, body: Buffer.from(await response.arrayBuffer()), finalUrl: current.pathname, redirects };
    }
    const location = response.headers.get("location");
    assert.ok(location, `${pathname} redirected without a Location header`);
    const next = new URL(location, current);
    assert.equal(next.origin, current.origin, `${pathname} redirected off origin`);
    assert.ok(!visited.has(next.href), `${pathname} caused a redirect loop`);
    visited.add(next.href);
    current = next;
    redirects += 1;
    assert.ok(redirects <= 2, `${pathname} exceeded two redirects`);
  }
}

function assertSecurityHeaders(response, label) {
  assert.equal(response.headers.get("x-content-type-options"), "nosniff", `${label} nosniff header`);
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin", `${label} referrer policy`);
  const policy = response.headers.get("content-security-policy") ?? "";
  assert.match(policy, /default-src 'self'/, `${label} default CSP`);
  assert.match(policy, /https:\/\/\*\.supabase\.co/, `${label} Supabase CSP`);
}

function assertReactShell(result, expectedPath, expectedRedirects, label) {
  assert.equal(result.response.status, 200, `${label} status`);
  assert.equal(result.finalUrl, expectedPath, `${label} final URL`);
  assert.equal(result.redirects, expectedRedirects, `${label} redirect count`);
  assert.equal(result.response.headers.get("content-type"), "text/html; charset=utf-8", `${label} content type`);
  assertSecurityHeaders(result.response, label);
  const document = new JSDOM(result.body.toString("utf8")).window.document;
  assert.ok(document.querySelector("#root"), `${label} did not serve the React shell`);
  assert.ok(document.querySelector('script[type="module"][src^="/assets/"]'), `${label} omitted the built application script`);
  return { path: label, status: 200, finalUrl: result.finalUrl, redirects: result.redirects };
}

async function executeContract() {
  const server = createPreviewServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const products = [];
    const aliases = [];
    for (const page of manifest.pages) {
      products.push(assertReactShell(await followRoute(base, page.route), page.route, 0, page.route));
      aliases.push(assertReactShell(await followRoute(base, `/${page.document}`), page.route, 1, `/${page.document}`));
    }

    const admin = assertReactShell(await followRoute(base, "/admin"), "/admin", 0, "/admin");
    const unknown = assertReactShell(await followRoute(base, "/definitely-missing"), "/definitely-missing", 0, "/definitely-missing");

    const offline = await followRoute(base, "/offline.html");
    assert.equal(offline.response.status, 200);
    assert.equal(offline.finalUrl, "/offline.html");
    assert.equal(offline.redirects, 0, "offline fallback must remain a physical document");
    assert.equal(new JSDOM(offline.body.toString("utf8")).window.document.querySelector("h1")?.textContent, "This page needs a connection.");

    const favicon = await followRoute(base, "/images/brand/favicon-32.png");
    const sourceFavicon = await readFile(new URL("../assets/images/brand/favicon-32.png", import.meta.url));
    assert.equal(favicon.response.status, 200);
    assert.equal(favicon.response.headers.get("content-type"), "image/png");
    assert.equal(createHash("sha256").update(favicon.body).digest("hex"), createHash("sha256").update(sourceFavicon).digest("hex"));

    return { products, aliases, admin, offline: { status: 200, path: "/offline.html" }, unknown, faviconBytes: favicon.body.byteLength };
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

const first = await executeContract();
const second = await executeContract();
assert.deepEqual(second, first, "React route contract changed between repeated runs");
console.log(JSON.stringify({ contractVersion: ROUTE_CONTRACT_VERSION, runsCompared: 2, result: first }, null, 2));
