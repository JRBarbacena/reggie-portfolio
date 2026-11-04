import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const MAX_SCANNED_BYTES = 2 * 1024 * 1024;

const TOKEN_RULES = [
  ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g],
  ["github-token", /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g],
  ["aws-access-key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ["google-api-key", /\bAIza[A-Za-z0-9_-]{30,}\b/g],
  ["slack-token", /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g],
  ["stripe-live-secret", /\bsk_live_[A-Za-z0-9]{16,}\b/g],
  ["supabase-secret-key", /\bsb_secret_[A-Za-z0-9_-]{16,}\b/g],
  ["resend-api-key", /\bre_[A-Za-z0-9]{24,}\b/g],
];

const SECRET_ASSIGNMENT = /\b(SUPABASE_(?:SERVICE_ROLE|SECRET)_KEY|RESEND_API_KEY|AWS_SECRET_ACCESS_KEY|VERCEL_TOKEN|GITHUB_TOKEN)\b[\t ]*[:=][\t ]*["']?([^\s"',;`}]+)/g;
const JWT_CANDIDATE = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;

function isPlaceholder(value) {
  return !value
    || /^(?:process\.env|import\.meta\.env|\$\{|<|your[_-]|replace|change[_-]?me|example|undefined|null)/i.test(value);
}

function decodesToServiceRole(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    return payload?.role === "service_role";
  } catch {
    return false;
  }
}

export function scanTextForSecrets(file, text) {
  const findings = new Set();

  for (const [rule, pattern] of TOKEN_RULES) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) findings.add(rule);
  }

  SECRET_ASSIGNMENT.lastIndex = 0;
  for (const match of text.matchAll(SECRET_ASSIGNMENT)) {
    if (!isPlaceholder(match[2])) findings.add(`populated-${match[1].toLowerCase()}`);
  }

  JWT_CANDIDATE.lastIndex = 0;
  for (const match of text.matchAll(JWT_CANDIDATE)) {
    if (decodesToServiceRole(match[0])) findings.add("supabase-service-role-jwt");
  }

  return [...findings].map((rule) => ({ file, rule }));
}

export function scanTrackedFiles(root = process.cwd()) {
  const tracked = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
  const findings = [];

  for (const file of tracked) {
    const contents = readFileSync(resolve(root, file));
    if (contents.length > MAX_SCANNED_BYTES || contents.includes(0)) continue;
    findings.push(...scanTextForSecrets(file, contents.toString("utf8")));
  }

  return findings;
}

function main() {
  const findings = scanTrackedFiles();
  if (!findings.length) {
    console.log("Secret scan passed for eligible repository text files.");
    return;
  }

  console.error("Potential committed secrets were detected (values are intentionally hidden):");
  for (const finding of findings) console.error(`- ${finding.file}: ${finding.rule}`);
  process.exitCode = 1;
}

const entryUrl = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (entryUrl === import.meta.url) main();
