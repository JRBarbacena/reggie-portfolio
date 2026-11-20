import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const pageFiles = ["HomePage.jsx", "TechPage.jsx", "TravelPage.jsx", "LifePage.jsx"];
const pageDirectory = resolve(process.cwd(), "react-app", "src", "pages");

describe("public portfolio performance coverage", () => {
  it.each(pageFiles)("applies viewport reveal markers to %s", async (file) => {
    const source = await readFile(resolve(pageDirectory, file), "utf8");

    expect(source).toContain("data-reveal");
    expect(source).toContain("data-viewport-section");
  });

  it("keeps route-level code splitting enabled for every public page", async () => {
    const source = await readFile(resolve(process.cwd(), "react-app", "src", "App.jsx"), "utf8");

    for (const name of ["HomePage", "TechPage", "TravelPage", "LifePage"]) {
      expect(source).toContain(`const ${name} = lazy(() => import(`);
    }
  });

  it("uses the Java language mark instead of relabeling the OpenJDK mascot", async () => {
    const source = await readFile(resolve(process.cwd(), "react-app", "src", "components", "TechStackWall.jsx"), "utf8");

    expect(source).toContain('image: "/images/brand/java.svg"');
    expect(source).not.toContain("siOpenjdk");
  });

  it("keeps album titles and descriptions in a compact divided header", async () => {
    const viewerSource = await readFile(resolve(process.cwd(), "react-app", "src", "components", "AlbumViewer.jsx"), "utf8");
    const viewerStyles = await readFile(resolve(process.cwd(), "react-app", "src", "components", "Masonry.css"), "utf8");

    expect(viewerSource).toContain("album-masonry-modal__title-block");
    expect(viewerSource).toContain("album-masonry-modal__description");
    expect(viewerStyles).toContain("border-left: 1px solid rgb(255 255 255 / 20%)");
  });
});
