import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export const ENGINE_EVIDENCE_SCHEMA_VERSION = 1;
export const ENGINE_EVIDENCE_REPORTER_VERSION = "1.1.0";
const OUTPUT_FILE = resolve("artifacts/engine-evidence.json");
const PROJECT_ENGINES = [
  ["chromium-engine", "chromium"],
  ["firefox-engine", "firefox"],
  ["webkit-engine", "webkit"],
];
const ENGINE_ORDER = PROJECT_ENGINES.map(([, engine]) => engine);
const EXPECTED_TOOL_NAMES = [
  "@axe-core/playwright",
  "@playwright/test",
  "ajv",
  "engine-evidence-reporter",
  "fast-check",
  "jsdom",
  "lighthouse",
  "playwright",
  "playwright-core",
  "vitest",
].sort();
const routeContract = JSON.parse(
  await readFile(new URL("../tests/fixtures/route-contract.json", import.meta.url), "utf8"),
);
const EXPECTED_ROUTES = routeContract.products
  .map(({ path, h1 }) => ({ path, h1, status: 200 }))
  .sort((left, right) => left.path.localeCompare(right.path));

if (EXPECTED_ROUTES.length !== 4 || new Set(EXPECTED_ROUTES.map(({ path }) => path)).size !== 4) {
  throw new Error("Engine evidence reporter requires exactly four distinct product routes");
}

function attachmentBody(attachment) {
  if (attachment.body) return attachment.body.toString("utf8");
  if (attachment.path) return readFile(attachment.path, "utf8");
  throw new Error("Engine evidence attachment has no body or path");
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export default class EngineEvidenceReporter {
  constructor() {
    this.records = [];
    this.projects = [];
  }

  onBegin(config) {
    this.projects = config.projects.map(({ name }) => name).sort();
  }

  async onTestEnd(_test, result) {
    for (const attachment of result.attachments) {
      if (attachment.name !== "engine-evidence") continue;
      this.records.push(JSON.parse(await attachmentBody(attachment)));
    }
  }

  async onEnd(run) {
    const records = this.records.sort((left, right) =>
      ENGINE_ORDER.indexOf(left.engine) - ENGINE_ORDER.indexOf(right.engine)
      || left.route.path.localeCompare(right.route.path),
    );
    const validationErrors = [];
    const expectedProjects = PROJECT_ENGINES.map(([project]) => project).sort();
    const toolchains = new Set(records.map(({ tools }) => JSON.stringify(tools)));
    const tools = records[0]?.tools ?? {};
    const engines = [];

    if (!sameJson(this.projects, expectedProjects)) {
      validationErrors.push("configuration does not contain exactly the three named engine projects");
    }
    if (toolchains.size !== 1) {
      validationErrors.push("tool revisions are missing or inconsistent across engine evidence");
    }
    if (!sameJson(Object.keys(tools).sort(), EXPECTED_TOOL_NAMES)
      || Object.values(tools).some((version) => !/^\d+\.\d+\.\d+(?:[-+].+)?$/.test(version))) {
      validationErrors.push("tool evidence does not contain every exact pinned tool and reporter version");
    }

    for (const [project, expectedEngine] of PROJECT_ENGINES) {
      const projectRecords = records.filter((record) => record.project === project);
      const browserRecords = new Set(projectRecords.map(({ browser }) => JSON.stringify(browser)));
      const browser = projectRecords[0]?.browser;
      const routes = projectRecords.map(({ route }) => route)
        .sort((left, right) => left.path.localeCompare(right.path));

      if (projectRecords.length !== EXPECTED_ROUTES.length) {
        validationErrors.push(`${expectedEngine} engine evidence does not contain exactly four routes`);
      }
      if (projectRecords.some(({ engine }) => engine !== expectedEngine)) {
        validationErrors.push(`${project} contains evidence from an unexpected engine`);
      }
      if (browserRecords.size !== 1 || !browser
        || !browser.recordedRevisions?.includes(browser.installedRevision)
        || !browser.manifestBrowserVersion || !browser.runtimeBrowserVersion) {
        validationErrors.push(`${expectedEngine} browser revisions are missing, inconsistent, or unrecorded`);
      }
      if (!sameJson(routes, EXPECTED_ROUTES)) {
        validationErrors.push(`${expectedEngine} engine evidence does not contain all four distinct clean routes`);
      }

      if (projectRecords.length) {
        engines.push({
          project,
          engine: expectedEngine,
          evidenceLabel: `${expectedEngine} engine evidence (not branded browser certification)`,
          browser,
          routes,
        });
      }
    }

    const report = {
      schemaVersion: ENGINE_EVIDENCE_SCHEMA_VERSION,
      reporterVersion: ENGINE_EVIDENCE_REPORTER_VERSION,
      evidenceScope: "Playwright engine evidence; no unexecuted branded-browser claims",
      serverContract: "Playwright-managed clean-route preview harness; no external server",
      status: validationErrors.length ? "failed" : run.status,
      tools,
      engines,
      validation: {
        complete: validationErrors.length === 0,
        errors: validationErrors,
      },
    };

    await mkdir(dirname(OUTPUT_FILE), { recursive: true });
    await writeFile(OUTPUT_FILE, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    if (validationErrors.length) {
      console.error(`Engine evidence incomplete: ${validationErrors.join("; ")}`);
      return { status: "failed" };
    }

    console.log(`Engine evidence: ${OUTPUT_FILE}`);
    return undefined;
  }
}
