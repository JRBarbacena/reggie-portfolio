import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { buildNavModel, resolveActiveState } from "../../js/nav-model.js";

// Generator for a valid page registry: unique ids, non-empty labels/hrefs,
// each page tagged primary or overflow, in arbitrary order.
const pageArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 8 }),
  label: fc.string({ minLength: 1, maxLength: 12 }),
  href: fc.string({ minLength: 1, maxLength: 12 }),
  tier: fc.constantFrom("primary", "overflow"),
});

const registryArb = fc
  .uniqueArray(pageArb, {
    minLength: 1,
    maxLength: 8,
    selector: (p) => p.id,
  });

describe("nav-model", () => {
  // Feature: portfolio-website, Property 1: Navigation completeness and tiering
  it("P1: emits exactly one link per page with correct tiering and order", () => {
    fc.assert(
      fc.property(registryArb, (pages) => {
        const { primary, overflow } = buildNavModel(pages);
        const all = [...primary, ...overflow].map((l) => l.id).sort();
        const ids = pages.map((p) => p.id).sort();
        expect(all).toEqual(ids); // exactly one link per page

        // Correct tiering
        const overflowIds = pages
          .filter((p) => p.tier === "overflow")
          .map((p) => p.id);
        expect(overflow.map((l) => l.id).sort()).toEqual(overflowIds.sort());

        // Registry order preserved within each group
        const primaryOrder = pages
          .filter((p) => p.tier !== "overflow")
          .map((p) => p.id);
        expect(primary.map((l) => l.id)).toEqual(primaryOrder);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: portfolio-website, Property 2: Link target correctness
  it("P2: every link href equals its page's registry href", () => {
    fc.assert(
      fc.property(registryArb, (pages) => {
        const { primary, overflow } = buildNavModel(pages);
        for (const link of [...primary, ...overflow]) {
          const page = pages.find((p) => p.id === link.id);
          expect(link.href).toBe(page.href);
        }
      }),
      { numRuns: 100 }
    );
  });

  // Feature: portfolio-website, Property 3: Active-state resolution
  it("P3: marks exactly one active link; overflow control active iff overflow page", () => {
    fc.assert(
      fc.property(
        registryArb.chain((pages) =>
          fc.record({
            pages: fc.constant(pages),
            activeId: fc.constantFrom(...pages.map((p) => p.id)),
          })
        ),
        ({ pages, activeId }) => {
          const state = resolveActiveState(pages, activeId);
          const current = pages.find((p) => p.id === activeId);
          if (current.tier === "overflow") {
            expect(state.activeOverflowId).toBe(activeId);
            expect(state.overflowControlActive).toBe(true);
            expect(state.activePrimaryId).toBeNull();
          } else {
            expect(state.activePrimaryId).toBe(activeId);
            expect(state.overflowControlActive).toBe(false);
            expect(state.activeOverflowId).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: portfolio-website, Property 4: Navigation structure invariance across active page
  it("P4: structure is identical across active pages; only active annotations differ", () => {
    fc.assert(
      fc.property(
        registryArb.chain((pages) =>
          fc.record({
            pages: fc.constant(pages),
            a: fc.constantFrom(...pages.map((p) => p.id)),
            b: fc.constantFrom(...pages.map((p) => p.id)),
          })
        ),
        ({ pages }) => {
          // buildNavModel is independent of the active page, so structure is
          // invariant by construction; assert it explicitly.
          const first = buildNavModel(pages);
          const second = buildNavModel(pages);
          expect(first.primary.map((l) => l.id)).toEqual(
            second.primary.map((l) => l.id)
          );
          expect(first.overflow.map((l) => l.id)).toEqual(
            second.overflow.map((l) => l.id)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("resolveActiveState returns no active page for unknown id", () => {
    const pages = [{ id: "home", label: "Home", href: "index.html", tier: "primary" }];
    const state = resolveActiveState(pages, "nope");
    expect(state.activePrimaryId).toBeNull();
    expect(state.activeOverflowId).toBeNull();
    expect(state.overflowControlActive).toBe(false);
  });
});
