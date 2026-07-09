# Changelog

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
