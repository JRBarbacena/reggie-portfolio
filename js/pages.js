// pages.js — Page Registry (single source of truth for the site's pages).
// Array order is BOTH the navigation display order and the sequential build
// order required by Requirement 9 (home -> tech -> travel -> life -> designs).
//
// PageId = 'home' | 'tech' | 'travel' | 'life' | 'designs'
// tier   = 'primary' (direct top-level link) | 'overflow' (inside "..." menu)

export const PAGES = [
  { id: "home", label: "Home", href: "/", tier: "primary" },
  { id: "tech", label: "Tech", href: "/tech", tier: "primary" },
  { id: "travel", label: "Travel", href: "/travel", tier: "primary" },
  { id: "life", label: "Life", href: "/life", tier: "primary" },
  { id: "designs", label: "Designs", href: "/designs", tier: "overflow" },
];
