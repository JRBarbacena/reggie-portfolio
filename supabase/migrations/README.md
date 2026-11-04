# Migration safeguards

`npm run check:migrations` validates migration filenames, sequence numbers,
encoding, terminators, the absence of embedded database targets or psql shell
commands, and the SHA-256 manifest in `checksums.sha256`.

The manifest makes edits to the current migration baseline visible during code
review. Add every new migration as a new ordered `.sql` file, then add its
checksum to the manifest. Do not update a checksum to disguise an edit to an
already-applied migration.

This is a static repository check. It does not parse PostgreSQL fully, start a
local Supabase stack, prove that a migration was applied remotely, or authorize
running SQL against any project. Schema and RLS behavior still require a local
or isolated non-production Supabase test with synthetic data.
