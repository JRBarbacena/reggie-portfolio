import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

describe("admin image upload policy", () => {
  it("matches backend formats and applies a smaller cover dimension", async () => {
    const source = await readFile(resolve(process.cwd(), "react-app/src/pages/AdminPage.jsx"), "utf8");

    expect(source).toContain('new Set(["image/jpeg", "image/png", "image/webp"])');
    expect(source).toContain("const MAX_COVER_DIMENSION = 1280");
    expect(source).toContain('label === "cover" ? MAX_COVER_DIMENSION : MAX_UPLOAD_DIMENSION');
    expect(source).toContain("preparedFile.size > MAX_IMAGE_BYTES");
  });
});
