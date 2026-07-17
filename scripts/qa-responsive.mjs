import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const root = process.cwd();
const pages = [
  { file: "index.html", id: "home", path: "/" },
  { file: "tech.html", id: "tech", path: "/tech" },
  { file: "travel.html", id: "travel", path: "/travel" },
  { file: "life.html", id: "life", path: "/life" },
  { file: "designs.html", id: "designs", path: "/designs" },
];

const css = readFileSync(resolve(root, "css/components.css"), "utf8");
const baseCss = readFileSync(resolve(root, "css/base.css"), "utf8");
const issues = [];
const contentStyleVersions = new Set();

function html(page) {
  return readFileSync(resolve(root, page), "utf8");
}

function includesAll(source, page, checks) {
  for (const [label, snippet] of checks) {
    if (!source.includes(snippet)) issues.push(`${page}: missing ${label}`);
  }
}

function mediaBlocks(maxWidth) {
  const blocks = [];
  const pattern = new RegExp(`@media\\s*\\(max-width:\\s*${maxWidth}px\\)\\s*\\{`, "g");
  let match;

  while ((match = pattern.exec(css))) {
    let depth = 1;
    let index = pattern.lastIndex;
    while (index < css.length && depth > 0) {
      const char = css[index];
      if (char === "{") depth += 1;
      if (char === "}") depth -= 1;
      index += 1;
    }
    blocks.push(css.slice(pattern.lastIndex, index - 1));
  }

  return blocks;
}

const mobileCss = [1000, 900, 768, 560, 480].flatMap(mediaBlocks).join("\n");

function requireMobileRule(page, selector) {
  if (!mobileCss.includes(selector)) {
    issues.push(`${page}: ${selector} is used but has no mobile breakpoint rule`);
  }
}

const contentPreloaderVersions = new Set();

for (const page of pages) {
  const source = html(page.file);

  includesAll(source, page.file, [
    ["mobile viewport", '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />'],
    ["asset guard", '<script type="module" src="js/asset-guard.js" defer></script>'],
    ["shared navigation component", '<script type="module" src="js/site-nav.js" defer></script>'],
    ["shared footer component", '<script type="module" src="js/site-footer.js" defer></script>'],
    ["motion layer", '<script type="module" src="js/motion.js" defer></script>'],
    ["critical asset banner", '<p class="critical-error-banner" role="alert">'],
    ["skip link", '<a class="skip-link" href="#main">Skip to content</a>'],
    ["main landmark", '<main id="main"'],
    ["shared footer element", "<site-footer></site-footer>"],
  ]);

  const stylesheet = source.match(/<link rel="stylesheet" href="css\/main\.css\?v=([^"]+)" \/>/);
  if (!stylesheet) {
    issues.push(`${page.file}: missing versioned shared stylesheet`);
  } else {
    contentStyleVersions.add(stylesheet[1]);
  }

  const preloader = source.match(/<script src="(js\/preloader\.js\?v=[^"]+)"><\/script>/);
  if (!preloader) {
    issues.push(`${page.file}: missing versioned preloader script`);
  } else {
    contentPreloaderVersions.add(preloader[1]);
  }

  const nav = source.match(/<site-nav active-page="([^"]+)"><\/site-nav>/);
  if (!nav) {
    issues.push(`${page.file}: missing active shared nav`);
  } else if (nav[1] !== page.id) {
    issues.push(`${page.file}: active nav "${nav[1]}" should be "${page.id}"`);
  }
}

if (contentPreloaderVersions.size > 1) {
  issues.push(`content pages use different preloader versions: ${[...contentPreloaderVersions].join(", ")}`);
}

if (contentStyleVersions.size > 1) {
  issues.push(`content pages use different stylesheet versions: ${[...contentStyleVersions].join(", ")}`);
}

const preloaderSource = readFileSync(resolve(root, "js/preloader.js"), "utf8");
if (!preloaderSource.includes('navigationType() === "reload"')) {
  issues.push("js/preloader.js: refreshes must replay the entry gate");
}
if (!preloaderSource.includes("SESSION_KEY")) {
  issues.push("js/preloader.js: page navigation state must stay scoped to the current tab");
}
if (preloaderSource.includes("AUTO_ENTER_DELAY") || preloaderSource.includes("setTimeout(enterPortfolio")) {
  issues.push("js/preloader.js: the entry gate must wait for an explicit user click");
}

const pageContracts = {
  "index.html": [".hero--home", ".gallery--lanes", ".gallery", ".photo-window"],
  "tech.html": [".current-build", ".stack-grid", ".credential-shelf", ".project-queue", ".album-grid", ".album-modal"],
  "travel.html": [".story-hero", ".story-stats", ".travel-entry", ".travel-stamps", ".story-closing"],
  "life.html": [".story-hero", ".race-console", ".life-gallery", ".small-wins__grid", ".coffee-story", ".life-collage"],
  "designs.html": [".page-intro", ".gallery"],
};

for (const [page, selectors] of Object.entries(pageContracts)) {
  const source = html(page);
  for (const selector of selectors) {
    const className = selector.slice(1);
    if (source.includes(className)) requireMobileRule(page, selector);
  }
}

includesAll(css, "css/components.css", [
  ["mobile nav menu breakpoint", ".site-nav__menu"],
  ["mobile nav toggle breakpoint", ".site-nav__mobile-toggle"],
  ["mobile nav open state", '.site-nav[data-menu-open="true"] .site-nav__menu'],
]);

if (!baseCss.includes("overflow-x: hidden")) {
  issues.push("css/base.css: body must guard against horizontal mobile overflow");
}

const routeFiles = new Set(pages.map((page) => page.file));
for (const file of readdirSync(root)) {
  const lower = file.toLowerCase();
  const looksLikeSplitMobilePage =
    lower.endsWith(".mobile.html") ||
    lower.endsWith(".desktop.html") ||
    lower.startsWith("mobile-") ||
    lower.startsWith("desktop-");

  if (looksLikeSplitMobilePage && !routeFiles.has(basename(file))) {
    issues.push(`${file}: do not create separate mobile/desktop page versions`);
  }
}

if (!existsSync(resolve(root, "css/main.css"))) {
  issues.push("css/main.css: shared stylesheet missing");
}

if (issues.length) {
  console.error("Responsive QA failed.");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`Responsive QA passed for ${pages.length} pages.`);
