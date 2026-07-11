// pages.js — Page Registry (single source of truth for the site's pages).
// Array order is BOTH the navigation display order and the sequential build
// order required by Requirement 9 (home -> tech -> travel -> life -> designs).
//
// PageId = 'home' | 'tech' | 'travel' | 'life' | 'designs'
// tier   = 'primary' (direct top-level link) | 'overflow' (inside "..." menu)

export const PAGES = [
  { id: "home", label: "Home", href: "index.html", tier: "primary" },
  { id: "tech", label: "Tech", href: "tech.html", tier: "primary" },
  { id: "travel", label: "Travel", href: "travel.html", tier: "primary" },
  { id: "life", label: "Life", href: "life.html", tier: "primary" },
  { id: "designs", label: "Designs", href: "designs.html", tier: "overflow" },
];
