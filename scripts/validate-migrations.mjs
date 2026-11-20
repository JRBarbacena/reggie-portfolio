import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const MIGRATION_NAME = /^(\d{8})_(\d{3})_([a-z0-9_]+)\.sql$/;
const MANIFEST_LINE = /^([a-f0-9]{64}) {2}([^/]+\.sql)$/;

function sha256(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

export async function validateMigrations(migrationDirectory, manifestPath) {
  const names = (await readdir(migrationDirectory))
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const errors = [];
  const records = [];
  let expectedSequence = 1;

  for (const name of names) {
    const match = name.match(MIGRATION_NAME);
    if (!match) {
      errors.push(`${name}: expected YYYYMMDD_NNN_description.sql naming.`);
      continue;
    }

    const sequence = Number(match[2]);
    if (sequence !== expectedSequence) {
      errors.push(`${name}: expected sequence ${String(expectedSequence).padStart(3, "0")}.`);
    }
    expectedSequence = sequence + 1;

    const contents = await readFile(resolve(migrationDirectory, name));
    const text = contents.toString("utf8");
    if (!text.trim()) errors.push(`${name}: migration is empty.`);
    if (text.includes("\uFFFD") || text.charCodeAt(0) === 0xfeff) {
      errors.push(`${name}: migration must be plain UTF-8 without a byte-order mark.`);
    }
    if (!text.trimEnd().endsWith(";")) errors.push(`${name}: migration must end with a semicolon.`);
    if (/^\s*\\(?:connect|c|!|setenv)\b/im.test(text)) {
      errors.push(`${name}: psql connection and shell meta-commands are not allowed.`);
    }
    if (/\b(?:postgres(?:ql)?:\/\/|https?:\/\/[^\s'";]*\.supabase\.co)\b/i.test(text)) {
      errors.push(`${name}: migrations must not contain a database connection target.`);
    }
    records.push({ name, digest: sha256(contents) });
  }

  const manifest = await readFile(manifestPath, "utf8");
  const expected = new Map();
  for (const line of manifest.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const match = line.match(MANIFEST_LINE);
    if (!match) {
      errors.push(`checksums.sha256: malformed line for ${line.slice(0, 40)}.`);
      continue;
    }
    if (expected.has(match[2])) errors.push(`checksums.sha256: duplicate entry for ${match[2]}.`);
    expected.set(match[2], match[1]);
  }

  for (const { name, digest } of records) {
    if (!expected.has(name)) errors.push(`${name}: missing checksum manifest entry.`);
    else if (expected.get(name) !== digest) errors.push(`${name}: checksum changed; do not edit an existing migration.`);
    expected.delete(name);
  }
  for (const name of expected.keys()) errors.push(`${name}: checksum entry has no migration file.`);

  return errors;
}

async function main() {
  const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const migrationDirectory = resolve(repositoryRoot, "supabase", "migrations");
  const manifestPath = resolve(migrationDirectory, "checksums.sha256");
  const errors = await validateMigrations(migrationDirectory, manifestPath);

  if (!errors.length) {
    console.log("Migration validation passed: ordered names, safe targets, and checksums match.");
    return;
  }

  console.error("Migration validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
}

const entryUrl = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (entryUrl === import.meta.url) await main();
