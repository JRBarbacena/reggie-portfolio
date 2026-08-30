import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";

const root = process.cwd();
const manifest = JSON.parse(readFileSync(resolve(root, "config/site-manifest.json"), "utf8"));
const componentCss = readFileSync(resolve(root, "css/components.css"), "utf8");
const motionCss = readFileSync(resolve(root, "css/motion.css"), "utf8");
const tokenCss = readFileSync(resolve(root, "css/tokens.css"), "utf8");
const issues = [];

for (const page of manifest.pages) {
  const source = readFileSync(resolve(root, page.document), "utf8");
  const document = new JSDOM(source).window.document;
  const viewport = document.querySelector('meta[name="viewport"]')?.getAttribute("content") ?? "";
  if (!viewport.includes("width=device-width") || !viewport.includes("viewport-fit=cover")) {
    issues.push(`${page.document}: incomplete mobile viewport contract`);
  }

  const nav = document.querySelector("site-nav");
  if (nav?.getAttribute("active-page") !== page.id) {
    issues.push(`${page.document}: active-page must be "${page.id}"`);
  }
}

for (const required of [
  "@media (max-width: 768px)",
  ".site-nav__mobile-toggle",
  ".site-nav__menu",
  '.site-nav[data-menu-open="true"] .site-nav__menu',
]) {
  if (!componentCss.includes(required)) issues.push(`css/components.css: missing responsive contract ${required}`);
}

for (const token of [
  "--duration-fast:",
  "--duration-base:",
  "--duration-slow:",
  "--duration-enter:",
  "--ease-standard:",
  "--ease-emphasized:",
  "--ease-exit:",
]) {
  if (!tokenCss.includes(token)) issues.push(`css/tokens.css: missing motion token ${token}`);
}

if (!motionCss.includes("@media (prefers-reduced-motion: reduce)")) {
  issues.push("css/motion.css: missing reduced-motion policy");
}
if (!motionCss.includes(".motion-disabled [data-reveal]")) {
  issues.push("css/motion.css: missing no-motion content fallback");
}

for (const file of readdirSync(root)) {
  if (/^(?:mobile-|desktop-)|\.(?:mobile|desktop)\.html$/i.test(file)) {
    issues.push(`${file}: separate mobile/desktop documents are not allowed`);
  }
}

if (issues.length) {
  console.error("Responsive/motion QA failed.");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`Responsive/motion source QA passed for ${manifest.pages.length} product pages.`);
