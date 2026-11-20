import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { scanTextForSecrets, scanTrackedFiles } from "../../scripts/check-secrets.mjs";
import { validateMigrations } from "../../scripts/validate-migrations.mjs";

const scannerPath = resolve(process.cwd(), "scripts", "check-secrets.mjs");
const temporaryRepositories = [];

function git(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}

function createRepository() {
  const root = mkdtempSync(join(tmpdir(), "portfolio-secret-scan-"));
  temporaryRepositories.push(root);
  git(root, ["init", "--quiet"]);
  git(root, ["config", "user.name", "Repository Safeguard Test"]);
  git(root, ["config", "user.email", "safeguards@example.invalid"]);
  return root;
}

function commitAll(root) {
  git(root, ["add", "--all"]);
  git(root, ["commit", "--quiet", "-m", "fixture"]);
}

afterEach(() => {
  for (const root of temporaryRepositories.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

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

  it("skips an unstaged tracked deletion while scanning an untracked file whose name contains spaces", () => {
    const root = createRepository();
    const trackedPath = join(root, "tracked.txt");
    writeFileSync(trackedPath, "safe tracked text\n");
    commitAll(root);
    unlinkSync(trackedPath);

    const token = ["ghp_", "b".repeat(36)].join("");
    writeFileSync(join(root, "untracked secret fixture.txt"), `${token}\n`);

    expect(scanTrackedFiles(root)).toEqual([
      { file: "untracked secret fixture.txt", rule: "github-token" },
    ]);
  });

  it("reports findings without printing detected secret values", () => {
    const root = createRepository();
    const token = ["ghp_", "c".repeat(36)].join("");
    writeFileSync(join(root, "untracked output fixture.txt"), `${token}\n`);

    const result = spawnSync(process.execPath, [scannerPath], {
      cwd: root,
      encoding: "utf8",
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('"untracked output fixture.txt": github-token');
    expect(result.stderr).not.toContain(token);
  });

  it("excludes binary image content without relying on a NUL byte", () => {
    const root = createRepository();
    const token = ["ghp_", "d".repeat(36)].join("");
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    writeFileSync(join(root, "binary preview.png"), Buffer.concat([
      pngSignature,
      Buffer.from(token, "utf8"),
    ]));

    expect(scanTrackedFiles(root)).toEqual([]);
  });

  it("fails when a candidate exists in Git but its filesystem target is unexpectedly missing", () => {
    const root = createRepository();
    symlinkSync("missing-target.txt", join(root, "broken fixture link.txt"));
    commitAll(root);

    const result = spawnSync(process.execPath, [scannerPath], {
      cwd: root,
      encoding: "utf8",
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("ENOENT");
  });

  it.skipIf(process.platform === "win32" || process.getuid?.() === 0)(
    "fails when a candidate is unreadable",
    () => {
      const root = createRepository();
      const unreadablePath = join(root, "unreadable fixture.txt");
      writeFileSync(unreadablePath, "safe text\n");
      commitAll(root);
      chmodSync(unreadablePath, 0o000);

      let result;
      try {
        result = spawnSync(process.execPath, [scannerPath], {
          cwd: root,
          encoding: "utf8",
        });
      } finally {
        chmodSync(unreadablePath, 0o600);
      }

      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/EACCES|EPERM/);
    },
  );
});

describe("migration repository safeguards", () => {
  it("accepts the checked-in ordered migration baseline", async () => {
    const directory = resolve(process.cwd(), "supabase", "migrations");
    await expect(validateMigrations(directory, resolve(directory, "checksums.sha256"))).resolves.toEqual([]);
  });
});
