# Changelog

## [2026-07-09 23:13] — code-review fixes across all source files

Fixed the findings from the full engineering review of the site's five source
files. Surgical changes only; verified with a headless Chromium pass (all five
volleyball stages render, timeline bars still fill to 100% from the ball, both
story overlays present, no JS exceptions).

- **api/server.js** (security + correctness): CORS now matches `*.vercel.app`
  as a real host suffix instead of a substring (closes the
  `evil-vercel.app.attacker.com` bypass); OAuth state secret fails closed
  instead of signing with an empty key; OAuth redirect base is limited to a
  trusted-host allowlist and the reflected `?error=` value is URL-encoded;
  token seeding no longer clobbers a token refreshed during the lambda's life
  (was forcing a re-refresh every request); concurrent refreshes share one
  in-flight promise; recent-tracks re-auth keys off the real 401 status, not a
  string match; GitHub GraphQL response is null-guarded; internal error
  messages are no longer echoed to clients.
- **main.js**: `isSafeUrl` now rejects `data:`/`vbscript:` (they slipped through
  the relative-path branch); removed the dead `header.offsetHeight` deep-link
  math (no header exists) in favor of a fixed -24 offset; dropped the retired
  `timeline-dot-animated` div and the empty `populateNavigation` stub;
  `showContentLoadError` no longer stacks overlays; Lenis teardown cancels its
  rAF loop and nulls `window.lenisInstance`; anchor-click listeners are now
  cleanup-tracked.
- **pixel-character.js**: finale anchors latch when the heroine tips over so a
  lazy image loading below can't shift the shoreline and snap the diver
  mid-dive (cleared above the tip-over, stays reversible); the flow clock now
  advances every frame so the swim animation doesn't freeze when the river is
  off-screen.
- **volleyball-story.js**: anchors are read every frame so the phase thresholds
  and the live bar/rail measurements share one layout (fixes drift when the page
  grows); guarded the TRAVEL/SPIKE phase divisors against non-positive spans;
  the reduced-motion tableau now re-anchors on body resize; removed dead state
  (`docH`, `maxScroll`, `darkNow`, `isDark`, `A.serverX0/spikerX0`).
- **main.css**: removed the now-unused `.timeline-dot-animated` rule.

Second pass (self-review of the above fixes):
- **pixel-character.js**: the finale-anchor latch fired at the tip-over
  (scroll ~190px, top of the page) — far too early, so it captured a still-
  growing layout and would freeze a stale shoreline for the whole descent.
  Moved the latch to the dive APPROACH (within one viewport of the live dive
  start, near the footer) with hysteresis, so it captures the settled layout
  right before it matters and still re-latches fresh on each descent.
- **api/server.js**: `loadTokens` early-return meant a rotated
  `SPOTIFY_REFRESH_TOKEN` env var was never picked up on a warm container.
  Env is now authoritative for the refresh token (adopted when it differs from
  memory), while the in-memory access token is still kept when the env refresh
  token is unchanged — so rotation works without forcing a re-refresh every
  call.

Files: api/server.js, public/src/scripts/main.js,
public/src/scripts/pixel-character.js, public/src/scripts/volleyball-story.js,
public/src/styles/main.css

## [2026-07-09] — volleyball finale reworked to fully scroll-driven

- Replaced the time-based scroll-lock finale with a pure scroll-driven one: the
  ball's zoom toward the viewer is now a function of scrollY, pinned to viewport
  center and growing to fill the screen. The whole story (serve → travel →
  spike → screen-fill) is now reverse-scrollable like the cliff story — scroll
  up and every phase, including the ball zoom, rewinds. The background "slows"
  (doesn't stop) by spreading the finale over ~2.2 viewport-heights of scroll,
  so the content crawls/parallaxes behind the approaching ball without
  hijacking the scroll engine. Players fade + drift for depth as the ball takes
  over. Removed the Lenis stop()/start() lock and the wheel/touch blocking.
  Verified: ball scales with scroll and reverses; reduced-motion scrolls freely;
  no console errors.

## [2026-07-09] — volleyball scroll-story (about → experience)

- New self-contained scroll animation in `public/src/scripts/volleyball-story.js`
  (own overlay canvas `.pixel-overlay-vb` at z-31, independent of the cliff
  story). Two original generic pixel athletes — a server (#9, back to viewer)
  on the about→experience line and a spiker (#10, facing viewer) on the
  experience→projects line — act out a rally driven by scroll: a ball arcs in
  from the left into the server's hands, he serves, it travels down the
  experience timeline rail, the spiker leaps high and spikes it at the camera,
  then the finale locks scroll (Lenis `.stop()` + wheel/touch/key block) while
  the ball zooms up to fill the screen with a parallax drift, then releases and
  the page resumes from where it locked. Narrative motion is scroll-driven
  (reversible); the screen-fill is a one-shot timed lock (guarded so scrolling
  back up/down never re-traps). Reduced-motion → static tableau, no lock.
  - Supporting edits: `main.js` exposes `window.lenisInstance` (1 line);
    `main.css` adds `.pixel-overlay-vb`; `index.html` adds the script tag.
    Experience bar-fill (`.timeline-item-progress`) left untouched (removed in
    a later step).
  - Verified: all phases render light+dark; real wheel is blocked during the
    lock and scroll resumes after ~900ms; reduced-motion scrolls freely; cliff
    story + river still animate; no console errors.
  - Style pass: both players wear the same dark navy team kit (white numbers 9
    / 10); the ball is a paneled volleyball (white/red/green vertical panels,
    dark outline) — small pixel sprite for the rally, geometry-drawn panels for
    the finale zoom. Original art matching a generic paneled-volleyball look.

## [2026-07-09] — fall/splash now timed to the shoreline appearing

- The scroll-story's dive+splash was anchored to fixed offsets from the page
  bottom (`D-380`/`D-260`), so the fast fall happened during the achievements
  section and the pair plunged into water that was still off-screen. Re-anchored
  `E0`/`E1` in `renderStory()` to `riverTopDoc - vh` (the shoreline entering the
  viewport): the fall accelerates as the grass/water scrolls into view, the
  splash lands on visible water, and a full 130px swim-to-shore plays out
  on-screen before the ending. Clamped so `CATCH0 < catchEnd < E0 < E1 < D`
  holds on tall + short viewports. Verified via screenshots at every finale
  beat, no console errors. (`pixel-character.js`)

## [2026-07-09] — smoother cold load (font-swap reflow fix)

- The display font (Instrument Serif) loads after DOMContentLoaded and shrinks
  the hero by ~12px desktop / ~63px mobile. Previously the sky, paper sheet,
  and boundary columns repositioned ~150ms later via the debounced hero
  ResizeObserver — a visible late jump. Now both sky and story scripts also
  recompute on `document.fonts.ready`, so they settle in lockstep with the
  font. Verified: paper-sheet top aligns to hero bottom (gap ≈ 0) across 5
  cold loads each on desktop + mobile, no console errors.
  (`sakura-sky.js`, `pixel-character.js`)
- Audit result (no code change needed): no race conditions, no wrong-theme
  flash (inline head script sets theme pre-paint), no use-before-init, no
  div-by-zero; all pixel layers self-heal via ResizeObservers; achievements
  image already reserves space via width/height attrs.

## [2026-07-09] — theme toggle moved into the bottom social dock

- Relocated the theme toggle from its top-right float into the floating social
  pill at bottom-center, after a subtle divider, styled to match the social
  icons (transparent at rest, accent on hover). Top-right of the hero is now
  fully clear. id + sun/moon spans preserved so the head-level wiring still
  works from first paint. Removed the now-unused `.theme-toggle-float` CSS.

## [2026-07-09] — navbar → right-edge section indicator

- Removed the fixed top navbar (logo, desktop nav, mobile hamburger + menu)
  so the hero sky flows edge to edge. Replaced it with a vertical tick rail on
  the right edge: one short horizontal tick per visible section (home, about,
  experience, projects, github, achievements), the active tick widening to
  accent color, section name revealed on hover, click/Enter jumps via Lenis.
  Theme toggle moved to its own fixed top-right button (id preserved).
  - `index.html`: header removed, `.theme-toggle-float` + `.section-rail`
    added, `main` `pt-20`→`pt-8`.
  - `main.js`: removed `highlightActiveSection`/`requestHighlightTick` (the
    former threw on `header.offsetHeight` once the header was gone) and
    `initMobileMenu`; added `initSectionIndicator()` (IntersectionObserver,
    `-45%` active band, winner by ratio, hero fallback).
  - `main.css`: rail/tick/label/toggle styles (light+dark, mobile scale-down,
    reduced-motion, focus-visible); removed dead nav CSS; hero `7rem`→`2rem`;
    `scroll-margin-top` `100px`→`24px`.

## [2026-07-09] — cave with bonfire on the shoreline

- Stone cave on the left of the land at the page bottom: jittered rock dome
  with a mossy crown, dark arched entrance, and an animated bonfire inside
  (three flicker frames, rising embers, pulsing warm glow — stronger in dark
  theme — and smoke drifting from the mouth). Shoreline band raised to 260px
  (`RIVER_SURF` 8 → 36) to give the cave headroom; all story geometry keys
  off that constant. Boundary columns now dissolve just above the scene.
  (`pixel-character.js` drawCave, `main.css`, `sakura-sky.js`)

## [2026-07-09] — production scroll-performance fixes

- GitHub contributions graph now paints as a single DPR-scaled canvas instead
  of ~370 SVG rects (constant paint cost); per-day tooltip preserved via one
  mousemove handler. `#github` gets `content-visibility: auto` so it costs
  nothing until scrolled near. (`main.js` renderGitHubHeatmap, `main.css`)
- Achievements photo gets intrinsic `width/height` (2048×1365) — removes the
  ~255px lazy-load layout shift that also drifted the scroll-story's end.
- "recently played" (Spotify) section hidden for now: `hidden` attributes in
  index.html + `initSpotify()` call commented out. All Spotify code (API
  handlers, auth UI, config) left dormant for a future swap.

## [2026-07-09]

- Scroll-driven pixel story across the whole page: warrior and heroine on a
  cliff in the hero; on scroll she tips backward off the edge, he sprints and
  dives after her, the gap closes until their hands touch, they splash into
  the water at the page's end, swim to shore, and stand together on the land.
  Everything narrative is a pure function of scrollY (reversible); time only
  drives cosmetics (idle bob, water flow, splash particles).
  - `public/src/scripts/pixel-character.js` — rewritten as the story engine:
    cliff canvas (spans from the left screen edge to the hero arena), fixed
    full-viewport overlay for both characters, shoreline canvas (land on the
    left 3/4, open water right), splash/ripple effects, reduced-motion static
    scene, light/dark palettes.
  - `public/index.html` — added `#pixel-river` shoreline band after `<main>`.
  - `public/src/styles/main.css` — `.pixel-overlay` (fixed, z-30) and
    `#pixel-river` styles.
- Hero background: sakura pixel sky (port of the guibre experiment) behind a
  full-screen hero, with parallax; page content rides an opaque dotted "paper
  sheet" that slides over the sky; boundary columns and separators fade in
  with the paper. (`sakura-sky.js`, `main.css`, `index.html`)
