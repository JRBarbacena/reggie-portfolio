import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const readProjectFile = (path) => readFile(resolve(process.cwd(), path), "utf8");

describe("privacy and least-privilege contract", () => {
  it("publishes the privacy route and links to it at data collection", async () => {
    const [app, widget, privacy] = await Promise.all([
      readProjectFile("react-app/src/App.jsx"),
      readProjectFile("react-app/src/components/ChatbotWidget.jsx"),
      readProjectFile("react-app/src/pages/PrivacyPage.jsx"),
    ]);

    expect(app).toContain('path="/privacy"');
    expect(widget).toContain('href="/privacy"');
    expect(privacy).toContain("automatically deleted 180 days");
  });

  it("keeps resolved-inquiry cleanup narrow and unavailable to browser roles", async () => {
    const migration = await readProjectFile("supabase/migrations/20261026_008_privacy_and_grants.sql");

    expect(migration).toContain("status in ('replied', 'archived')");
    expect(migration).toContain("interval '180 days'");
    expect(migration).toContain("revoke all on function public.delete_resolved_contact_inquiries() from public, anon, authenticated");
    expect(migration).toContain("revoke all on table public.admin_allowlist from anon, authenticated");
  });
});
