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

- [ ] Rewrite pixel-character.js as the story engine:
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
