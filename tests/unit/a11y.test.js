import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  contrastRatio,
  validateHeadingOrder,
  parseHex,
} from "../../js/a11y.js";

const channelArb = fc.integer({ min: 0, max: 255 });
const rgbArb = fc.tuple(channelArb, channelArb, channelArb);

describe("a11y contrast math", () => {
  // Feature: portfolio-website, Property 12: Contrast thresholds and contrast-ratio math
  it("P12: contrastRatio is symmetric and within [1, 21]", () => {
    fc.assert(
      fc.property(rgbArb, rgbArb, (a, b) => {
        const ab = contrastRatio(a, b);
        const ba = contrastRatio(b, a);
        expect(ab).toBeGreaterThanOrEqual(1);
        expect(ab).toBeLessThanOrEqual(21);
        expect(ab).toBeCloseTo(ba, 10); // symmetric
      }),
      { numRuns: 100 }
    );
  });

  it("P12: enumerated design-token pairs meet their WCAG thresholds", () => {
    const bg = "#e4e9f0";
    // body text >= 4.5:1
    expect(contrastRatio("#2b303a", bg)).toBeGreaterThanOrEqual(4.5);
    // muted text (used as body-sized secondary) >= 4.5:1
    expect(contrastRatio("#55606f", bg)).toBeGreaterThanOrEqual(4.5);
    // large/heading text >= 3:1
    expect(contrastRatio("#3a4150", bg)).toBeGreaterThanOrEqual(3);
    // focus ring vs adjacent background >= 3:1
    expect(contrastRatio("#0b5cff", bg)).toBeGreaterThanOrEqual(3);
    // accent colors used as body-sized text/links on the neumorphic base
    expect(contrastRatio("#c8001c", bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#1d4ed8", bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#115e59", bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#92400e", bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("black vs white is 21:1 and identical colors are 1:1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio("#123456", "#123456")).toBeCloseTo(1, 5);
  });

  it("parseHex supports shorthand and full form", () => {
    expect(parseHex("#fff")).toEqual([255, 255, 255]);
    expect(parseHex("2b303a")).toEqual([43, 48, 58]);
  });
});

describe("a11y heading order", () => {
  // Feature: portfolio-website, Property 11: Heading order validity
  it("P11: accepts sequences with one H1 and no skipped descending levels", () => {
    // Build valid sequences: start at 1, each next level <= prev + 1, only one 1.
    const validSeqArb = fc
      .array(fc.integer({ min: -1, max: 1 }), { minLength: 0, maxLength: 12 })
      .map((deltas) => {
        const levels = [1];
        let current = 1;
        for (const d of deltas) {
          let next = current + d;
          if (next < 2) next = 2; // never emit another H1; stay >= 2 after first
          if (next > current + 1) next = current + 1;
          levels.push(next);
          current = next;
        }
        return levels;
      });

    fc.assert(
      fc.property(validSeqArb, (levels) => {
        expect(validateHeadingOrder(levels).valid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects multiple H1s", () => {
    expect(validateHeadingOrder([1, 2, 1]).valid).toBe(false);
  });

  it("rejects skipped levels (H1 -> H3)", () => {
    expect(validateHeadingOrder([1, 3]).valid).toBe(false);
  });

  it("rejects a document that does not start with H1", () => {
    expect(validateHeadingOrder([2, 3]).valid).toBe(false);
  });
});
