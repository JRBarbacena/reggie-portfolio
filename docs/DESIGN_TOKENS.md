# Design tokens

All visual constants live in [`css/tokens.css`](../css/tokens.css). Every page
loads them through [`css/main.css`](../css/main.css) only — do not link
`tokens.css` directly from HTML.

## What to change where

| Need | Token area | Notes |
|------|------------|-------|
| Background / surface | `--bg-base`, `--bg-raised` | Neumorphic base; keep text contrast ≥ 4.5:1 |
| Body / muted / heading text | `--text-primary`, `--text-muted`, `--text-large` | Covered by unit tests |
| Brand / links / CTAs | `--accent-primary`, `--accent-primary-strong` | Must stay ≥ 4.5:1 on `--bg-base` |
| Soft accents | `--accent-*-soft` | Decorative or **dark surfaces only** — not body text on `--bg-base` |
| Secondary graphite | `--accent-secondary*` | Supporting detail, not primary CTAs |
| Focus ring | `--focus-ring` | ≥ 3:1 vs adjacent background |
| Type scale | `--font-size-1` … `--font-size-6` | Keep ≤ 6 sizes |
| Spacing | `--space-1` … `--space-7` | Min block gap ≥ 16px (`--space-2`) |
| Radii / shadows | `--radius-*`, `--neu-*` | Soft-UI resting / hover / pressed |
| Motion | `--duration-*`, `--ease-*`, `--reveal-offset` | CSS-only motion; respect reduced motion |

## Rules

1. **Change tokens, not one-off hex in components** — if a value appears twice,
   it belongs in `tokens.css`.
2. **Verify contrast** after palette edits:
   ```bash
   npm test -- tests/unit/a11y.test.js
   ```
   Update the enumerated pairs in that file when accents change.
3. **Soft accents** (`--accent-primary-soft`, `--accent-cool-soft`) fail AA on the
   light neumorphic base. Use them on dark panels or as non-text decoration.
4. **Cache bust** by bumping the `?v=` query on `css/main.css` in HTML when you
   ship token changes that must bypass CDN/browser cache.

## Import order

`main.css` imports: `tokens` → `base` → `neumorphism` → `components` → `motion`.
Do not reorder without checking cascade assumptions in components.
