# Responsive experience design strategy

Date: 2026-11-07  
Status: implementation brief for the current responsive redesign  
Evidence: source review and 41 full-page Chromium captures across the requested
320–1920px matrix. Physical-device verification remains outstanding.

## Design direction

The portfolio keeps one visual identity while changing its composition and
interaction model by available space:

- **Desktop — immersive and expansive.** Preserve the scattered Home collage,
  centered navigation, fan carousel, fixed social dock, motion systems, and
  bounded editorial sections. Desktop is the reference, not an implementation
  shortcut for smaller screens.
- **Tablet — adaptive and balanced.** Use compact inline navigation from 769px,
  deliberate multi-column grids, content-driven portrait heroes, readable
  article measures, and touch-sized controls. Tablet portrait should not retain
  empty space merely to fill a viewport; landscape should not inherit phone
  stacking.
- **Mobile — focused and direct.** Keep the strong two-column Home photo mosaic,
  one-column narrative flow, and complete content. Keep the social dock fixed
  above Zenith, use a swipeable one-tap Home destination rail, and balance
  incomplete rows deliberately.

## Visual audit findings

| Priority | Area | Observed problem | Root cause | Design response |
|---|---|---|---|---|
| Critical | Shared mobile utilities | The fixed social dock and Zenith can compete for the same corner on compact layouts. | Both utilities used the lower-right edge without coordinated spacing. | Keep the social dock above the safe-area-aware Zenith launcher. |
| High | Home destination carousel | The phone fan does not persistently identify destinations and a side card requires two taps. | Desktop fan transforms and hover-oriented disclosure remain active on phones. | Render the same links as a horizontal snap rail at 430px and below, with permanent title/copy and one-tap navigation. |
| High | Home portrait tablet hero | 744–1024px portrait captures contain a large dead band below otherwise complete hero content. | The compact grid still inherits a full-viewport minimum height. | Use content-driven height in tablet portrait while preserving short-landscape and desktop composition. |
| High | Privacy | Mobile title scale overwhelms the article; tablet/desktop lines are too wide and section rhythm is weak. | Generic card and heading rules are used for a long-form reading surface. | Add a bounded reading column, mobile-specific title scale/padding, and explicit section rhythm. |
| High | Admin setup state | The heading and setup instruction are separated by an excessive vertical gap. | The route-level grid distributes two loose children across its minimum height. | Group and style the service-free state as one centered panel without changing authentication behavior. |
| Medium | Home facts | The fifth chip is orphaned and raw asset filenames read as implementation detail. | An odd two-column grid and file-backed captions were carried directly into the compact composition. | Center the fifth chip and use short reviewed display labels while retaining alt text and source filenames. |
| Medium | Life mobile gallery | Three full-width sports photographs produce avoidable page length at larger phone widths. | The mobile parity layer forces every shot to one column. | Keep the first landscape image full width; pair the two portraits from 375–430px. |
| Medium | Tech narrow timeline | At 320–375px, logos and fixed utilities leave the experience copy overly narrow. | A 6.5rem logo column is retained at the smallest widths. | Reduce the logo column only at the narrowest range; preserve the chronology and certificate shelf. |
| Medium | Service-free Travel | Empty collection cards underuse tablet width. | The normal journal grid sizing is retained for a single placeholder. | Let empty states occupy a balanced measure without changing real journal-card grids. |

## Page and component decisions

### Home

- Desktop keeps the existing scattered collage and animated fan.
- Tablet keeps the six-photo, three-column collage and five fact controls, but
  the hero becomes content-driven in portrait.
- Mobile keeps the current two-column mosaic because screenshot review shows it
  is balanced at 320–430px. The fifth fact is centered. Destination cards become
  a scroll-snap rail with a visible next-card cue and persistent information.

### Tech, Travel, and Life

- Preserve the centered Tech/Travel heroes, Tech certificate shelf, Life hero
  collage, and one-column narrative cards; these rendered strongly.
- Correct Tech's narrowest logo allocation, balance empty Travel states, and
  pair Life's portrait sports images on standard/large phones.
- Do not replace clear card stacks with horizontal rails or hide service-free
  content.

### Shared and informational routes

- Social links remain a fixed lower-right dock with 44px targets and sit above
  Zenith on compact layouts.
- Zenith opens inward from the right on compact layouts; its panel retains the
  existing focus trap and internal scroll regions.
- Privacy receives document-specific reading geometry.
- Admin's unconfigured state is visually grouped, with no auth or data change.

## Breakpoint rationale

- **430px and below:** phone-specific interaction and composition. This is the
  point where the fan carousel becomes a direct horizontal rail.
- **431–700px:** compact/split-screen composition. Preserve phone-like gutters
  but allow broader content measures.
- **701–900px:** portrait-tablet composition with inline navigation and
  deliberate two-/three-column content.
- **901–1180px:** large-tablet and landscape composition; retain bounded grids
  until the desktop Home scatter has enough space.
- **Above 1180px:** preserve the established desktop compositions.

These are content breakpoints. Pointer and motion media queries continue to
control target sizing and animation independently of width.

## Acceptance criteria

- No fixed utility intersects readable or interactive content at top, middle,
  or bottom scroll positions.
- The phone Home rail exposes every destination with one tap, persistent text,
  keyboard focus, and scroll snapping.
- Tablet portrait heroes end within a deliberate 64–96px section transition,
  not an arbitrary viewport-height dead band.
- Privacy prose stays near a 65–72ch reading measure and retains 16px minimum
  phone body text.
- Odd final grid items look intentionally centered or spanning.
- Desktop captures remain compositionally consistent with the baseline.
- Chromium and WebKit emulation supplement, but do not replace, Preview testing
  on physical iPhone, iPad, Android phone, and Android tablet hardware.
