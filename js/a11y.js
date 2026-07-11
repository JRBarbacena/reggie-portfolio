// a11y.js — pure accessibility helpers (no DOM dependency for the math).
// contrastRatio() implements WCAG 2.1 sRGB relative-luminance math and
// validateHeadingOrder() enforces a single H1 with no skipped levels.
// (Req 10.3, 10.4, 10.5, 10.6)

/**
 * Parse a hex color (#rgb or #rrggbb) into [r, g, b] in the 0–255 range.
 * @param {string} hex
 * @returns {[number, number, number]}
 */
export function parseHex(hex) {
  let h = String(hex).trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/**
 * Relative luminance of an sRGB color per WCAG 2.1.
 * @param {[number, number, number]} rgb  channels in 0–255
 * @returns {number} luminance in [0, 1]
 */
export function relativeLuminance([r, g, b]) {
  const lin = (channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * WCAG contrast ratio between two colors. Symmetric; result in [1, 21].
 * Accepts hex strings or [r,g,b] arrays.
 * @param {string|number[]} a
 * @param {string|number[]} b
 * @returns {number}
 */
export function contrastRatio(a, b) {
  const rgbA = Array.isArray(a) ? a : parseHex(a);
  const rgbB = Array.isArray(b) ? b : parseHex(b);
  const lA = relativeLuminance(rgbA);
  const lB = relativeLuminance(rgbB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Validate a document's heading-level sequence (in document order).
 * Rules: exactly one top-level H1; when descending, a level may increase by
 * at most one relative to the current outline depth (no skipped levels).
 *
 * @param {number[]} levels  e.g. [1, 2, 2, 3, 2]
 * @returns {{ valid: boolean, reason: string|null }}
 */
export function validateHeadingOrder(levels) {
  if (!Array.isArray(levels) || levels.length === 0) {
    return { valid: false, reason: "no headings" };
  }
  const h1Count = levels.filter((l) => l === 1).length;
  if (h1Count !== 1) {
    return { valid: false, reason: `expected exactly one H1, found ${h1Count}` };
  }
  if (levels[0] !== 1) {
    return { valid: false, reason: "first heading is not H1" };
  }
  let previous = 0;
  for (const level of levels) {
    if (level > previous + 1) {
      return {
        valid: false,
        reason: `heading level jumped from ${previous} to ${level}`,
      };
    }
    previous = level;
  }
  return { valid: true, reason: null };
}
