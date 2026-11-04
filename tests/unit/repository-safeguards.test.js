import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { scanTextForSecrets } from "../../scripts/check-secrets.mjs";
import { validateMigrations } from "../../scripts/validate-migrations.mjs";

describe("repository secret scan", () => {
  it("detects provider tokens without returning their values", () => {
    const token = ["ghp_", "a".repeat(36)].join("");
    expect(scanTextForSecrets("fixture.txt", token)).toEqual([
      { file: "fixture.txt", rule: "github-token" },
    ]);
  });

  it("allows empty and explicit placeholder secret variables", () => {
    const example = [
      "SUPABASE_SECRET_KEY=",
      "RESEND_API_KEY=REPLACE_ME",
      "const key = process.env.SUPABASE_SERVICE_ROLE_KEY;",
    ].join("\n");
    expect(scanTextForSecrets(".env.example", example)).toEqual([]);
  });

  it("flags a populated server-secret assignment without returning its value", () => {
    const value = ["not-a-real", "-server-secret"].join("");
    const source = ["SUPABASE_SECRET_KEY", "=", value].join("");
    const findings = scanTextForSecrets("fixture.env", source);

    expect(findings).toEqual([
      { file: "fixture.env", rule: "populated-supabase_secret_key" },
    ]);
    expect(JSON.stringify(findings)).not.toContain(value);
  });
});

describe("migration repository safeguards", () => {
  it("accepts the checked-in ordered migration baseline", async () => {
    const directory = resolve(process.cwd(), "supabase", "migrations");
    await expect(validateMigrations(directory, resolve(directory, "checksums.sha256"))).resolves.toEqual([]);
  });
});
