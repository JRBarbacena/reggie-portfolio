# Responsive portability audit

Date: 2026-11-07  
Scope: React public routes, Admin's service-free state, shared navigation/footer,
Zenith, dialogs, galleries, major motion systems, and responsive browser checks.

This audit is based on repository source, the existing Playwright contracts, and
local Chromium plus WebKit emulation. It does not claim physical-device
verification.

The independent device-experience follow-up and its composition decisions are
documented in `docs/RESPONSIVE_DESIGN_STRATEGY.md`.

## Workspace and evidence

- Starting commit: `ac39acda9531137ccf15d218e8e43fca632d0e9a` on
  `chore/ai-continuous-improvement`.
- Execution mode: foreground Local task with one implementation owner. Delegated
  mobile/accessibility, tablet/layout, and QA/performance audits were read-only.
- Styling spans the shared layer stack, legacy `styles.css`, final
  `responsive.css`, and colocated complex-component CSS. Responsive fixes must
  therefore keep selector ownership narrow and be browser-reviewed.
- Existing automated viewport coverage was 390×844, 820×1180, and 1440×900.
  Root horizontal overflow was checked, but descendant clipping could be hidden
  by the global `overflow-x` guard.

## Initial findings

| Priority | Component or section | Current problem | Root cause | Recommended responsive behavior |
|---|---|---|---|---|
| Critical | Home collage | Phones and 601–700px tablets lose four of six photos and all five personal-detail controls. | Final responsive rules use `display: none` to reduce the desktop scatter. | Keep every photo and detail available in a content-flow grid; retain the scattered desktop composition only where it fits. |
| Critical | Responsive QA | A page can pass the document `scrollWidth` check while a visible descendant is clipped. Several required widths, landscape, `/privacy`, and resize behavior are not exercised. | Root `overflow-x: hidden/clip` masks some failures and the project matrix covers only three portrait-oriented widths. | Inspect visible element bounds as well as document width and run a focused 320–1920px matrix, including phone/tablet landscape. |
| High | Home lane carousel | Dot controls are visually and interactively about 6px; tablet arrows remain smaller than comfortable touch targets above 700px. | Target sizing is tied to narrow viewport rules rather than pointer capability. | Preserve the small indicators inside 24px minimum targets, using 44px targets on coarse pointers. |
| High | Zenith | Several quick actions, toolbar actions, labels, and status texts are too small for comfortable touch use; outer and inner scrolling can compete in short viewports. | Desktop-dense component sizing and a late coarse-pointer override that makes the whole panel scroll. | Use dynamic viewport/safe-area bounds, keep intentional internal scroll regions, and provide 44px coarse-pointer actions with readable text. |
| High | Album viewer | Phone descriptions are clamped to three lines without an expansion control; the final gallery row has no bottom gesture-area clearance. | Mobile CSS hides overflow and the gallery scroller omits the bottom safe-area inset. | Keep the complete description readable in a bounded header and add safe-area-aware gallery padding. |
| High | 901–1024px Home | Six photos can collapse into one dense six-column row, while 701–900px uses a more deliberate three-column layout. | The tablet override stops at 900px even though the desktop scatter does not return until above 1180px. | Use a three-photo-column composition through 1180px, with a balanced detail-control row. |
| Medium | Shell, fixed controls, Admin | Safe-area offsets are mostly limited to widths at or below 768px, and some full-height containers use only `100vh`. | Insets and mobile browser chrome were treated as phone-width concerns. | Apply zero-cost safe-area functions to fixed/sticky shell elements at every width and use `100dvh` with `100vh` fallbacks. |
| Medium | Masonry | Gallery columns are selected from viewport width even though the component already measures its container; hover work still starts on coarse pointers. | Viewport media queries and pointer handlers are independent of the actual gallery container and input capability. | Derive columns from measured container width and bypass hover animation work on coarse/reduced-motion inputs. |
| Medium | CSS ownership | 768px, 700/720px, 900px, and 1180px rules overlap across global and component files. | Responsive behavior accumulated in several late layers. | Keep new behavior in the existing owning component or final responsive contract; avoid a new parallel stylesheet or broad rewrite. |
| Low | Image delivery | Built-in photos expose `sizes`, but the helper currently returns no `srcset`. | Reviewed width variants have not been generated. | Handle as a separate asset-quality task with generated variants, byte measurements, and visual review; do not invent URLs in this overhaul. |

## Implemented responsive decisions

- Desktop Home remains scattered above 1180px. From 701–1180px, photos use a
  balanced three-column grid and detail controls form a centered row. At 700px
  and below, all photos and details use a two-column flow with explicit labels.
- Coarse-pointer targets use 44px effective controls without enlarging the
  visual carousel indicators.
- Safe-area insets protect navigation, footer, social controls, Zenith, and the
  album gallery. Dynamic viewport units are layered after legacy `vh` fallbacks.
- Masonry uses its observed container width for column selection, improving
  split-screen and nested-dialog behavior.
- Browser checks retain the established 390/820/1440 projects and add explicit
  320, 375, 430, 768, 1024, 1280, and 1920 widths plus phone landscape. The
  checks inspect visible descendant bounds at the top, middle, and bottom of
  each route.

## Verification boundary

The final local verification produced these results:

- `npm run verify`: passed repository safeguards, lint with the nine existing
  warnings and no errors, configured JavaScript analysis, 51 unit tests, and the
  production build. The known 540.42 kB minified Ballpit warning remains.
- `npm run test:e2e`: 64 passed and 29 intentional project-specific skips across
  93 Chromium project instances.
- Ad hoc Playwright WebKit phone/tablet run for the responsive and Zenith suites:
  38 passed and 24 intentional project-specific skips. The temporary local
  WebKit configuration was not added to the repository or CI contract.
- `npm audit --audit-level=high`: passed the high-severity threshold with four
  moderate ESLint/minimatch findings. No dependency change or force fix was
  made.
- `git diff --check`: passed.

Chromium and WebKit emulation verify reflow, pointer-mode styling, keyboard
behavior, dialog bounds, and screenshots. They cannot prove mobile browser
chrome or software-keyboard behavior, real safe-area values, Android OEM
differences, GPU/backdrop-filter performance, thermal throttling, or physical
touch latency. Those items require a Preview build on representative iPhone,
iPad, Android phone, and Android tablet hardware before release approval.

## Independent mobile and tablet design follow-up

The second visual pass used 41 full-page before captures and 41 full-page final
captures at the requested phone, tablet portrait/landscape, desktop, and
ultra-wide dimensions. Screenshot inspection showed that the prior engineering
overhaul had solved containment but left four design-quality problems:

1. the fixed social dock and Zenith competed with compact content;
2. the Home fan carousel was not a self-explanatory phone interaction;
3. tablet portrait Home retained viewport-height whitespace after its compact
   content was complete; and
4. Privacy and the Admin setup state inherited generic page geometry.

The follow-up deliberately preserved the mobile compositions that already
rendered strongly: the six-photo Home mosaic, centered Tech and Travel heroes,
Tech certificate shelf, Life hero collage/rhythm cards, and one-column album
cards. It then introduced these device-specific decisions:

- phones use a one-tap horizontal snap rail with persistent destination title,
  description, and action; tablets retain the fan with a dedicated active-card
  copy surface; desktop retains the original fan;
- social links remain fixed at the lower right and sit above Zenith on compact
  layouts; Zenith opens inward from the right on phone/tablet and remains on
  the established left edge on desktop;
- Home uses content-driven height in tablet portrait, full inline navigation
  from 701px, balanced odd fact controls, and reviewed photo labels;
- Life pairs its two portrait sport photographs at 375–430px while retaining a
  single column on the smallest phone;
- Privacy uses a 52rem card and roughly 68ch prose measure with phone-specific
  title, padding, and section rhythm;
- Admin's unconfigured heading and instruction are grouped in one panel; and
- single Travel placeholders and two Tech albums receive balanced medium-width
  layouts.

Final local verification for this follow-up:

- `npm run verify`: passed repository checks, lint with the nine existing
  warnings and no errors, configured JavaScript analysis, 51 unit tests, and
  the production build. The known 540.42 kB Ballpit warning remains.
- Chromium Playwright: 74 passed and 49 intentional project-specific skips
  across 123 instances.
- WebKit Playwright using a temporary local configuration: 74 passed and 49
  intentional project-specific skips across the same responsive/Zenith
  contract. The temporary configuration was removed after the run.
- The final screenshot matrix contains 41 Chromium-emulated captures. These are
  visual-emulation results, not physical-device evidence.
