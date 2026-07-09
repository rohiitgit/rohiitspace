# Task: Sakura pixel-sky background for hero section

Port the pixel-art sakura sky from `~/Public/experiment/the31/guibre` (React) to
this vanilla-JS portfolio, showing it behind the hero only, fading naturally
into the existing white-paper dot background.

## Plan

- [x] Create `public/src/scripts/sakura-sky.js` — vanilla port of
      `SakuraBackground.jsx`: banded dithered sky, petals, clouds, wind gusts
      on a low-res canvas. Theme via `.dark` class on `<html>`
      (MutationObserver), reduced-motion → still frame, sized to hero bottom
      via ResizeObserver. → verified: `node --check` passes, no console errors.
- [x] Add wrapper `<div>` + `<canvas>` to `public/index.html` and a script tag.
      → verified: markup renders, canvas behind content.
- [x] Add CSS to `public/src/styles/main.css`: absolute full-width wrapper,
      `z-index: -1`, `image-rendering: pixelated`, bottom `mask-image`
      gradient for the fade into the paper background. → verified: visual check
      in browser, light + dark.
- [x] Verify: serve locally, screenshot light/dark, check scroll transition.

## Round 2 (design feedback, 2026-07-09)

- [x] Move dot grid off `body` onto a new `#paper-sheet` layer starting at the
      hero's bottom edge — no dots ever render over the sky; removed the dot
      texture from the frosted tldr card too.
- [x] Paper sheet gets a 160px dot-free gradient top edge so the sky blends
      into solid paper before the dots begin.
- [x] Parallax: sky + pixel character translate down at 0.3× scroll (rAF-
      throttled, passive listener, disabled with prefers-reduced-motion); the
      opaque paper sheet scrolls normally and slides over the sky.
- [x] Sky band arc compressed to complete above the paper fade so the pink
      band stays visible around the tldr card; 3 drifting clouds.
- [x] Verified via headless screenshots at scroll 0/400/800/1100 in light and
      0/600 in dark: arc visible, no dots on sky, clean paper below, no
      console errors.

## Round 3 (2026-07-09)

- [x] Side boundary columns converted from fixed to an absolute overlay,
      anchored by sakura-sky.js at the start of the paper fade strip
      (heroBottom - PAPER_FADE) with a matching 160px top mask — they fade in
      across the same strip as the sky-to-paper blend and reach full opacity
      where the dots begin, so every intersection with the horizontal
      separator lines is at equal opacity. → verified via screenshot.
- [x] Separator line opacity raised 0.1 → 0.2 (light and dark) to match the
      vertical boundary lines. → verified via screenshots.

## Round 4 (2026-07-09)

- [x] Hero fills the first screen: `min-height: calc(100svh - 7rem)` (vh
      fallback) with the inner grid stretched via flex and
      `align-content: space-between` so pfp/heading/card spread down the sky.
      → verified: hero bottom lands ~12px above the fold at 1440×900,
      1440×1100, and 390×844; sky/paper/boundary layers follow automatically
      via the hero ResizeObserver.
- [x] Composition fix: replaced `space-between` (which stranded the heading
      mid-sky) with `grid-template-rows: auto auto 1fr` + `align-self: end`
      on the card — photo/greeting cluster at top, single open-sky gap, card
      anchored at the hero's bottom. → verified at 1710×1112 and 390×844.

## Round 5 — scroll-driven pixel story (2026-07-09)

Cliff + heroine + falling catch + river. Everything scroll-driven (pure
function of scrollY → reversible), time only for cosmetics (walk cycles,
water flow, splash).

All items below completed (including user-directed revisions: cliff to the
left screen edge, standing-watch male, short-haired heroine, no-flip fall
orientation, frame-continuity fixes at every phase seam, and the river
redesigned from a curved channel to a natural shoreline — land on the left
3/4 of the page bottom, open water on the right, pair swims ashore and
stands). Verified via screenshot sweeps at every story phase, light + dark.

- [x] Rewrite pixel-character.js as the story engine:
      cliff canvas (#pixel-hero-canvas) draws a floating rock island; both
      characters render on a new fixed full-viewport overlay canvas (z-30,
      pointer-events none) positioned off the cliff's live bounding rect.
- [ ] Heroine sprite set (dark skin, rugged warrior outfit): stand,
      fall-on-back-looking-up, reach-up. Male additions: run (fast walk
      frames), dive-head-down-reaching.
- [ ] Timeline: heroine tips backward off the edge early in the scroll →
      male notices (!), runs to the edge, leaps → both fall at right side of
      viewport, gap eases shut over the page → hands touch near the end →
      both blend into the river surface exactly at max scroll → splash.
- [ ] River: full-width pixel water band at document end (#pixel-river),
      animated flow, light/dark themes, splash particles + ripples.
- [ ] index.html: river div. main.css: overlay + river styles.
- [ ] Reduced motion: static scene (both standing on cliff), still river.
- [ ] Verify: node --check; screenshots at ~8 scroll positions, light+dark,
      mobile width; check hands-touch and splash frames.

## Round 6 — production smoothness (2026-07-09)

- [x] `#github` content-visibility + intrinsic size (main.css).
- [x] Contributions graph SVG → single canvas, DPR-scaled, tooltip kept.
- [x] Achievements image `width/height` — doc height now stable across a
      full scroll (2px vs 255px drift).
- [x] Music section hidden (`hidden` attrs + initSpotify() commented out);
      Spotify backend/UI code dormant for a future Last.fm swap (deferred).
- [x] Verified: no spotify requests, no console errors, canvas graph parity
      in light theme (dark path unchanged, re-renders via theme observer).

## Round 7 — shoreline cave (2026-07-09)

- [x] Boundary columns end above the shoreline scene with a 48px fade.
- [x] Stone cave + animated bonfire (flicker frames, embers, glow, smoke) on
      the left of the land; band 260px, RIVER_SURF 36. Verified light + dark,
      no console errors, couple/story geometry unaffected.

## Round 8 — navbar → section indicator (2026-07-09)

- [x] Removed fixed navbar; theme toggle floated top-right (id preserved).
- [x] Right-edge tick rail, 6 ticks, IntersectionObserver active tracking
      (`-45%` band, winner by ratio, hero fallback), click/keyboard jump via
      Lenis, hover labels, light+dark, mobile scale-down, reduced-motion.
- [x] Removed dead code: highlightActiveSection (threw on header.offsetHeight),
      requestHighlightTick, initMobileMenu; hero 7rem→2rem, pt-20→pt-8,
      scroll-margin 100→24.
- [x] Verified: no header in DOM, no console errors, correct active tick when
      each section is centered (all 6), click lands at projTop=24, toggle
      flips theme, hover reveals label, mobile rail present. Light + dark.

## Round 9 — theme toggle into bottom dock (2026-07-09)

- [x] Moved theme toggle from top-right float into the social dock (divider +
      matching icon style). Removed `.theme-toggle-float` CSS. id/spans kept.
- [x] Verified: float gone, btn inside dock, resting bg transparent (matches
      social icons), toggles theme, no console errors, top-right clear,
      light + dark.

## Round 10 — pixel-animation load audit + font-swap fix (2026-07-09)

- [x] Audited all 3 pixel systems (sky, cliff/story, river/cave) via 3 parallel
      code audits + runtime tests. No races, no errors, correct theme on first
      paint, self-healing geometry.
- [x] Fixed the one real cold-load imperfection: font-swap hero reflow now
      triggers an immediate `document.fonts.ready` recompute in sakura-sky.js
      and pixel-character.js (no more 150ms-debounced jump).
- [x] Verified gap≈0 (paper↔hero) across 5 cold loads, desktop + mobile, no
      console errors.

## Round 11 — fall timing to shoreline (2026-07-09)

- [x] Re-anchored dive/splash (E0/E1) to the river band entering the viewport
      instead of fixed offset from page bottom. Fall accelerates + splash now
      happen on-screen near the footer; 130px swim window preserved.
- [x] Verified: no early plunge during achievements, splash on visible water,
      swim visible; ordering CATCH0<catchEnd<E0<E1<D holds at vh 900/1300/650;
      no console errors.

## Round 12 — volleyball scroll-story (2026-07-09)

- [x] New volleyball-story.js (own overlay, independent of cliff story).
- [x] Original generic pixel athletes #9 (server, back) + #10 (spiker, front),
      pixel volleyball with spin, jersey-number pixel-digit font.
- [x] Phases: ball enters from left → server catch/serve → travel down exp
      timeline → spiker high jump/spike → scroll-lock + screen-fill zoom +
      parallax → resume.
- [x] True scroll-lock via window.lenisInstance.stop()/start() + wheel/touch/
      key preventDefault; one-shot guard (no re-trap on scroll up/down).
- [x] Reduced-motion static tableau (no lock). Both themes. Left-margin
      positioning clear of content text.
- [x] Verified: real wheel blocked during lock, resumes after ~900ms; reduced
      motion scrolls freely; cliff story unaffected; no console errors.
- [ ] LATER: remove the experience .timeline-item-progress bar-fill so the
      ball fully replaces it (deferred per user).

## Review

- Sky renders behind the hero in both themes; petals/clouds/gusts animate.
- Bottom of the sky mask-fades into the notebook-dot paper background right
  before the first section separator — no hard edge.
- Theme toggle repaints the sky (day ↔ night palettes) via the existing
  `.dark` class, no changes to the theme system needed.
- No new console errors; the only errors on a static serve are the
  pre-existing Spotify/GitHub fetches that need `vercel dev`.
- No tsc/eslint configs exist in this repo (plain static JS site), so
  verification was `node --check` + headless-browser screenshots.
