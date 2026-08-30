import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { validateReadinessInventory } from "../../scripts/content-readiness.mjs";

const roots = [];

function homeInventory() {
  return {
    schemaId: "urn:reggie-portfolio:content-readiness:v1",
    schemaVersion: 1,
    mode: "fixture",
    pages: [{
      id: "home", document: "index.html", releaseState: "release-ready",
      sections: [{
        id: "home-content", kind: "content", selector: ".content",
        previousState: "approved", state: "approved", render: true,
      }],
      assets: [{
        id: "home-image", selector: "main img", source: "assets/approved.png",
        previousState: "approved", state: "approved", decorative: false,
        alt: "Approved owner work", width: 640, height: 480,
      }],
      links: [{
        id: "home-tech", selector: "main a", target: "/tech",
        previousState: "approved", state: "approved",
      }],
    }],
  };
}

function homeHtml(copy = "Approved portfolio content") {
  return `<!doctype html><html><body data-release-state="release-ready"><main>
    <h1>Home</h1><section class="content"><h2>${copy}</h2>
    <img src="assets/approved.png" alt="Approved owner work" width="640" height="480">
    <a href="/tech">Tech</a></section></main></body></html>`;
}

async function fixture({ inventory = homeInventory(), html = homeHtml(), asset = true } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "portfolio-readiness-"));
  roots.push(root);
  await mkdir(path.join(root, "assets"), { recursive: true });
  await writeFile(path.join(root, inventory.pages[0].document), html);
  if (inventory.pages[0].document !== "tech.html") {
    await writeFile(path.join(root, "tech.html"), "<h1>Tech</h1>");
  }
  if (asset) await writeFile(path.join(root, "assets/approved.png"), "approved");
  return { rootDir: root, inventory };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("content readiness rejection matrix", () => {
  it.each(["Placeholder project", "Dummy card", "Coming-soon entry"])("rejects forbidden copy: %s", async (copy) => {
    await expect(validateReadinessInventory(await fixture({ html: homeHtml(copy) })))
      .rejects.toThrow(/forbidden (placeholder|dummy|coming-soon) copy/);
  });

  it("rejects forbidden stale comments", async () => {
    await expect(validateReadinessInventory(await fixture({
      html: homeHtml().replace("</section>", "<!-- Future project slot --></section>"),
    }))).rejects.toThrow(/stale future-slot comment/);
  });

  it("rejects a rendered section missing from the inventory", async () => {
    await expect(validateReadinessInventory(await fixture({
      html: homeHtml().replace("</main>", "<section><h2>Undeclared content</h2></section></main>"),
    }))).rejects.toThrow(/rendered top-level section missing from the readiness inventory/);
  });

  it("rejects a fake interactive target", async () => {
    const inventory = homeInventory();
    inventory.pages[0].links[0].target = "#";
    await expect(validateReadinessInventory(await fixture({
      inventory, html: homeHtml().replace('href="/tech"', 'href="#"'),
    }))).rejects.toThrow(/fake interactive target/);
  });

  it("rejects an unresolved approved asset", async () => {
    await expect(validateReadinessInventory(await fixture({ asset: false })))
      .rejects.toThrow(/asset home-image is unresolved/);
  });

  it.each([
    ["alt", ' alt="Approved owner work"', /missing alt/],
    ["dimensions", ' width="640" height="480"', /missing intrinsic dimensions/],
  ])("rejects missing image %s", async (_label, removed, error) => {
    await expect(validateReadinessInventory(await fixture({ html: homeHtml().replace(removed, "") })))
      .rejects.toThrow(error);
  });

  it("rejects an invalid readiness transition", async () => {
    const inventory = homeInventory();
    Object.assign(inventory.pages[0].sections[0], { previousState: "approved", state: "draft", render: false });
    await expect(validateReadinessInventory(await fixture({ inventory })))
      .rejects.toThrow(/invalid readiness transition approved -> draft/);
  });

  it("rejects release-ready Designs without real entries", async () => {
    const inventory = homeInventory();
    inventory.pages = [{
      id: "designs", document: "designs.html", releaseState: "release-ready",
      sections: [
        { id: "designs-status", kind: "content", selector: ".status", previousState: "approved", state: "approved", render: true },
        { id: "design-entries", kind: "design-entries", selector: ".design-entry", previousState: "draft", state: "draft", render: false, entryCount: 0 },
      ],
      assets: [], links: [],
    }];
    const html = '<!doctype html><body data-release-state="release-ready"><main><h1>Designs</h1><section class="status"><h2>Publication status</h2></section></main></body>';
    await expect(validateReadinessInventory(await fixture({ inventory, html })))
      .rejects.toThrow(/cannot be release-ready without approved real entries/);
  });

  it("rejects a design entry count that does not match rendered entries", async () => {
    const inventory = homeInventory();
    inventory.pages = [{
      id: "designs", document: "designs.html", releaseState: "release-ready",
      sections: [{
        id: "design-entries", kind: "design-entries", selector: ".design-entry",
        previousState: "draft", state: "approved", render: true, entryCount: 2,
      }],
      assets: [], links: [],
    }];
    const html = '<!doctype html><body data-release-state="release-ready"><main><h1>Designs</h1><section class="design-entry"><h2>Fixture entry</h2></section></main></body>';
    await expect(validateReadinessInventory(await fixture({ inventory, html })))
      .rejects.toThrow(/design-entries must render 2 times/);
  });
});

describe("allowed non-release states", () => {
  it("accepts valid omissions for unavailable Tech content types", async () => {
    const inventory = homeInventory();
    inventory.pages = [{
      id: "tech", document: "tech.html", releaseState: "release-ready",
      sections: [
        { id: "tech-education", kind: "education", selector: ".education", previousState: "approved", state: "approved", render: true },
        { id: "tech-career", kind: "career-history", selector: ".career", previousState: "omitted", state: "omitted", render: false },
        { id: "tech-job", kind: "job-information", selector: ".job", previousState: "omitted", state: "omitted", render: false },
      ],
      assets: [], links: [],
    }];
    const html = '<!doctype html><body data-release-state="release-ready"><main><h1>Tech</h1><section class="education"><h2>Education</h2></section></main></body>';
    await expect(validateReadinessInventory(await fixture({ inventory, html }))).resolves.toMatchObject({ releaseReady: ["tech"] });
  });

  it("allows rendered draft content only in fixture mode", async () => {
    const inventory = homeInventory();
    inventory.pages = [{
      id: "designs", document: "designs.html", releaseState: "withheld",
      sections: [
        { id: "design-draft", kind: "design-entries", selector: ".design-entry", previousState: "draft", state: "draft", render: true, entryCount: 1 },
      ],
      assets: [], links: [],
    }];
    const html = '<!doctype html><body data-release-state="withheld"><main><h1>Designs</h1><section class="design-entry"><h2>Fixture entry</h2></section></main></body>';
    await expect(validateReadinessInventory(await fixture({ inventory, html }))).resolves.toMatchObject({ withheld: ["designs"] });
    inventory.mode = "production";
    await expect(validateReadinessInventory(await fixture({ inventory, html }))).rejects.toThrow(/production inventory pages|unapproved draft/);
  });

  it("passes the checked-in production inventory without the retired Designs page", async () => {
    await expect(validateReadinessInventory()).resolves.toEqual({
      pages: 2,
      releaseReady: ["home", "tech"],
      withheld: [],
    });
  });
});
