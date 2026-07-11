// nav-model.js — pure navigation logic (no DOM). Kept framework-free so it
// can be unit- and property-tested in isolation. (Req 3.2–3.4, 3.7–3.9)

/**
 * Split the page registry into ordered primary and overflow link groups,
 * preserving registry order. Emits exactly one link per page (Req 3.4).
 *
 * @param {Array<{id:string,label:string,href:string,tier:string}>} pages
 * @returns {{ primary: Array, overflow: Array }}
 */
export function buildNavModel(pages) {
  const primary = [];
  const overflow = [];
  for (const page of pages) {
    const link = { id: page.id, label: page.label, href: page.href };
    if (page.tier === "overflow") {
      overflow.push(link);
    } else {
      primary.push(link);
    }
  }
  return { primary, overflow };
}

/**
 * Resolve which navigation elements are active for the current page.
 * Unknown/missing activePageId yields "no active page" (defensive, no throw).
 *
 * @param {Array} pages
 * @param {string|null|undefined} activePageId
 * @returns {{
 *   activePrimaryId: string|null,
 *   activeOverflowId: string|null,
 *   overflowControlActive: boolean
 * }}
 */
export function resolveActiveState(pages, activePageId) {
  const current = pages.find((p) => p.id === activePageId);
  if (!current) {
    return {
      activePrimaryId: null,
      activeOverflowId: null,
      overflowControlActive: false,
    };
  }
  if (current.tier === "overflow") {
    return {
      activePrimaryId: null,
      activeOverflowId: current.id,
      overflowControlActive: true,
    };
  }
  return {
    activePrimaryId: current.id,
    activeOverflowId: null,
    overflowControlActive: false,
  };
}
