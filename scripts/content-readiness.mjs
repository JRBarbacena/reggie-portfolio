import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { JSDOM } from "jsdom";
import { CONTENT_READINESS_SCHEMA } from "../config/content-readiness.schema.mjs";

const MODULE_PATH = fileURLToPath(import.meta.url);
const DEFAULT_ROOT = path.resolve(path.dirname(MODULE_PATH), "..");
const EXPECTED_PRODUCTION_PAGES = ["home", "tech"];
const ALLOWED_TRANSITIONS = {
  draft: new Set(["draft", "approved", "omitted"]),
  approved: new Set(["approved"]),
  omitted: new Set(["omitted", "draft", "approved"]),
};
const FORBIDDEN_COPY = [
  ["placeholder", /\bplaceholder\b/i],
  ["dummy", /\bdummy\b/i],
  ["coming-soon", /\bcoming[\s-]+soon\b/i],
  ["lorem-ipsum", /\blorem\s+ipsum\b/i],
  ["future-slot", /\bfuture\s+(?:slot|project|entry)\b/i],
];

export class ReadinessValidationError extends Error {
  constructor(issues) {
    super(`Content readiness validation failed:\n${issues.map((issue) => `- ${issue}`).join("\n")}`);
    this.name = "ReadinessValidationError";
    this.issues = issues;
  }
}

function pushUniqueIssues(items, label, issues) {
  const ids = new Set();
  const selectors = new Set();
  for (const item of items) {
    if (ids.has(item.id)) issues.push(`${label} has duplicate id ${item.id}`);
    if (selectors.has(item.selector)) issues.push(`${label} has duplicate selector ${item.selector}`);
    ids.add(item.id);
    selectors.add(item.selector);
  }
}

async function exists(target) {
  try { await access(target); return true; } catch { return false; }
}

function localTarget(rootDir, target) {
  if (/^(?:[a-z]+:)?\/\//i.test(target) || target.startsWith("data:")) return null;
  const clean = target.split(/[?#]/, 1)[0];
  if (/^\/(?:tech|travel|life)?$/.test(clean)) {
    return path.join(rootDir, clean === "/" ? "index.html" : `${clean.slice(1)}.html`);
  }
  const relative = clean.startsWith("/") ? clean.slice(1) : clean;
  const resolved = path.resolve(rootDir, relative);
  return resolved.startsWith(`${path.resolve(rootDir)}${path.sep}`) ? resolved : null;
}

function validateTransitions(items, label, issues) {
  for (const item of items) {
    if (!ALLOWED_TRANSITIONS[item.previousState]?.has(item.state)) {
      issues.push(`${label} ${item.id} has invalid readiness transition ${item.previousState} -> ${item.state}`);
    }
  }
}

function validateHeadings(document, pageId, issues) {
  const levels = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")]
    .map((heading) => Number(heading.tagName.slice(1)));
  if (levels.filter((level) => level === 1).length !== 1) {
    issues.push(`${pageId} must contain exactly one h1`);
  }
  for (let index = 1; index < levels.length; index += 1) {
    if (levels[index] > levels[index - 1] + 1) {
      issues.push(`${pageId} heading order skips from h${levels[index - 1]} to h${levels[index]}`);
    }
  }
}

function validateCopy(source, document, pageId, issues) {
  const sourceWithoutCode = source
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ");
  const visibleCopy = `${document.body?.textContent ?? ""}\n${sourceWithoutCode.replace(/<[^>]+>/g, " ")}`;
  const comments = [...source.matchAll(/<!--[\s\S]*?-->/g)].map(([comment]) => comment).join("\n");
  for (const [label, pattern] of FORBIDDEN_COPY) {
    if (pattern.test(visibleCopy)) issues.push(`${pageId} contains forbidden ${label} copy`);
    if (pattern.test(comments)) issues.push(`${pageId} contains stale ${label} comment`);
  }
}

function validateSections(inventory, page, document, issues) {
  pushUniqueIssues(page.sections, `${page.id} sections`, issues);
  validateTransitions(page.sections, `${page.id} section`, issues);
  const renderedSections = new Set();
  for (const section of page.sections) {
    const matches = [...document.querySelectorAll(section.selector)];
    const expectedCount = section.kind === "design-entries"
      ? section.entryCount
      : section.render ? 1 : 0;
    if (matches.length !== expectedCount) {
      issues.push(`${page.id} section ${section.id} must render ${expectedCount} time${expectedCount === 1 ? "" : "s"}`);
    }
    if (section.render) matches.forEach((match) => renderedSections.add(match));
    for (const match of matches) {
      const annotatedState = match.getAttribute("data-readiness-state");
      if (annotatedState && annotatedState !== section.state) {
        issues.push(`${page.id} section ${section.id} readiness annotation must be ${section.state}`);
      }
    }
    if (section.state === "approved" && !section.render) issues.push(`${page.id} approved section ${section.id} is not rendered`);
    if (section.state === "omitted" && section.render) issues.push(`${page.id} omitted section ${section.id} is rendered`);
    if (inventory.mode === "production" && section.state === "draft" && section.render) {
      issues.push(`${page.id} production section ${section.id} renders an unapproved draft`);
    }
  }
  for (const element of document.querySelectorAll("main > section")) {
    if (!renderedSections.has(element)) {
      issues.push(`${page.id} contains a rendered top-level section missing from the readiness inventory`);
    }
  }
}

async function validateAssets(rootDir, page, document, issues) {
  pushUniqueIssues(page.assets, `${page.id} assets`, issues);
  validateTransitions(page.assets, `${page.id} asset`, issues);
  const renderedImages = [...document.querySelectorAll("main img")];
  if (renderedImages.length !== page.assets.length) {
    issues.push(`${page.id} inventory declares ${page.assets.length} assets for ${renderedImages.length} rendered images`);
  }
  for (const image of renderedImages) {
    const source = image.getAttribute("src") ?? "";
    if (!source || !localTarget(rootDir, source)) issues.push(`${page.id} image uses a non-local or empty source ${source || "<empty>"}`);
    if (!image.hasAttribute("alt")) issues.push(`${page.id} image ${source} is missing alt`);
    if (!(Number(image.getAttribute("width")) > 0) || !(Number(image.getAttribute("height")) > 0)) {
      issues.push(`${page.id} image ${source} is missing intrinsic dimensions`);
    }
  }
  for (const asset of page.assets) {
    const matches = document.querySelectorAll(asset.selector);
    if (matches.length !== 1) { issues.push(`${page.id} asset ${asset.id} must match exactly one image`); continue; }
    const image = matches[0];
    if (image.getAttribute("src") !== asset.source) issues.push(`${page.id} asset ${asset.id} source does not match inventory`);
    if (image.getAttribute("alt") !== asset.alt) issues.push(`${page.id} asset ${asset.id} alt does not match inventory`);
    if (Number(image.getAttribute("width")) !== asset.width || Number(image.getAttribute("height")) !== asset.height) {
      issues.push(`${page.id} asset ${asset.id} dimensions do not match inventory`);
    }
    if (asset.state !== "approved") issues.push(`${page.id} rendered asset ${asset.id} is not approved`);
    const target = localTarget(rootDir, asset.source);
    if (!target || !(await exists(target))) issues.push(`${page.id} asset ${asset.id} is unresolved: ${asset.source}`);
  }
}

async function validateLinks(rootDir, page, document, issues) {
  pushUniqueIssues(page.links, `${page.id} links`, issues);
  validateTransitions(page.links, `${page.id} link`, issues);
  if (document.querySelector('a[href="#"]')) issues.push(`${page.id} contains fake interactive target href="#"`);
  const renderedLinks = [...document.querySelectorAll("main a[href]")];
  if (renderedLinks.length !== page.links.length) {
    issues.push(`${page.id} inventory declares ${page.links.length} links for ${renderedLinks.length} rendered links`);
  }
  for (const link of page.links) {
    const matches = document.querySelectorAll(link.selector);
    if (matches.length !== 1) { issues.push(`${page.id} link ${link.id} must match exactly one anchor`); continue; }
    if (matches[0].getAttribute("href") !== link.target) issues.push(`${page.id} link ${link.id} target does not match inventory`);
    if (link.state !== "approved") issues.push(`${page.id} rendered link ${link.id} is not approved`);
    const target = localTarget(rootDir, link.target);
    if (!target || !(await exists(target))) issues.push(`${page.id} link ${link.id} is unresolved: ${link.target}`);
  }
}

function validatePagePolicy(inventory, page, document, issues) {
  const bodyState = document.body?.dataset.releaseState;
  if (bodyState !== page.releaseState) issues.push(`${page.id} body release state must be ${page.releaseState}`);
  if (page.releaseState === "release-ready" && page.sections.some(({ state }) => state === "draft")) {
    issues.push(`${page.id} is release-ready while a section remains draft`);
  }
  if (page.id === "tech") {
    for (const kind of ["education", "career-history", "job-information"]) {
      if (page.sections.filter((section) => section.kind === kind).length !== 1) {
        issues.push(`tech must inventory exactly one ${kind} content type`);
      }
    }
  }
  if (page.id === "designs") {
    const entries = page.sections.find(({ kind }) => kind === "design-entries");
    const hasRealEntries = entries?.state === "approved" && entries.render && entries.entryCount > 0;
    if (page.releaseState === "release-ready" && !hasRealEntries) {
      issues.push("designs cannot be release-ready without approved real entries");
    }
    if (inventory.mode === "production" && !hasRealEntries && page.releaseState !== "withheld") {
      issues.push("designs without approved entries must remain withheld");
    }
  }
}

export async function validateReadinessInventory({
  rootDir = DEFAULT_ROOT,
  inventoryPath = path.join(rootDir, "config/content-readiness.json"),
  inventory,
} = {}) {
  const data = inventory ?? JSON.parse(await readFile(inventoryPath, "utf8"));
  const validateSchema = new Ajv2020({ allErrors: true, strict: true }).compile(CONTENT_READINESS_SCHEMA);
  if (!validateSchema(data)) {
    const issues = validateSchema.errors.map(({ instancePath, message }) => `schema ${instancePath || "/"} ${message}`);
    throw new ReadinessValidationError(issues);
  }
  const issues = [];
  const pageIds = data.pages.map(({ id }) => id);
  if (new Set(pageIds).size !== pageIds.length) issues.push("inventory contains duplicate page ids");
  if (data.mode === "production" && pageIds.join(",") !== EXPECTED_PRODUCTION_PAGES.join(",")) {
    issues.push(`production inventory pages must be exactly ${EXPECTED_PRODUCTION_PAGES.join(", ")}`);
  }
  for (const page of data.pages) {
    const sourcePath = path.join(rootDir, page.document);
    if (!(await exists(sourcePath))) { issues.push(`${page.id} document is unresolved: ${page.document}`); continue; }
    const source = await readFile(sourcePath, "utf8");
    const document = new JSDOM(source).window.document;
    validateCopy(source, document, page.id, issues);
    validateHeadings(document, page.id, issues);
    validateSections(data, page, document, issues);
    await validateAssets(rootDir, page, document, issues);
    await validateLinks(rootDir, page, document, issues);
    validatePagePolicy(data, page, document, issues);
  }
  if (issues.length) throw new ReadinessValidationError(issues);
  return {
    pages: data.pages.length,
    releaseReady: data.pages.filter(({ releaseState }) => releaseState === "release-ready").map(({ id }) => id),
    withheld: data.pages.filter(({ releaseState }) => releaseState === "withheld").map(({ id }) => id),
  };
}

const isCli = path.resolve(process.argv[1] ?? "") === MODULE_PATH;
if (isCli) {
  try {
    const result = await validateReadinessInventory();
    console.log(`Content readiness QA passed: ${result.releaseReady.join(", ")} release-ready; ${result.withheld.join(", ")} explicitly withheld.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
