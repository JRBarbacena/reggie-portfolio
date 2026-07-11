# Architecture

## Delivery model

This is a static portfolio: Vercel serves the HTML, CSS, JavaScript, and media directly. There is no server-side application or database.

## Layers

- **Pages**: `index.html`, `tech.html`, `travel.html`, `life.html`, and `designs.html` provide page content.
- **Design system**: `css/tokens.css` owns colors, spacing, type, shadows, and motion; `css/main.css` imports the CSS layers in order.
- **Shared UI**: `site-nav.js`, `site-footer.js`, `preloader.js`, and `neumorphic-scrollbar.js` provide reusable site behavior.
- **Page behavior**: `hero.js`, `terminal.js`, and `tech-albums.js` enhance only the pages that need them.
- **Media**: `assets/images/photos/` holds portfolio photography; `assets/images/certificates/` holds credentials; `assets/images/` retains shared SVG assets.
- **Quality checks**: Vitest unit tests cover navigation and accessibility helpers under `tests/unit/`.

## Deployment flow

1. Commit changes to GitHub.
2. Import the repository into Vercel as a static project.
3. Vercel serves the repository root; no build command is required.
4. `vercel.json` preserves the `.html` routes used by the navigation and applies long-lived caching to versioned static assets.
