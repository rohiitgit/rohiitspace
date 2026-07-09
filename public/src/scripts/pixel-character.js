(function () {
    // ─── The cliff story ──────────────────────────────────────────────────────
    // A pixel warrior roams a floating cliff in the hero while a heroine
    // stands at its edge. As the page scrolls she tips backward off the cliff;
    // he notices, sprints to the edge and dives after her. They fall beside
    // the content for the length of the page, the gap closing until their
    // hands touch, and at the very end they plunge together into the pixel
    // river in the footer.
    //
    // Everything narrative is a pure function of scrollY (fully reversible);
    // time drives only cosmetics: walk cycles, water flow, splash particles.
    //
    // Canvases:
    //   #pixel-hero-canvas   cliff island art (in the hero arena)
    //   .pixel-overlay       fixed full-viewport layer, both characters
    //   #pixel-river-canvas  flowing river band at the very end of the page

    // ─── Config ───────────────────────────────────────────────────────────────
    let S = 3;               // scale: canvas-px per base-pixel (2 on mobile, 3 on desktop)
    const CANVAS_H = 200;    // cliff canvas height (px)
    const SPR_W = 32;        // male sprite bounding box width (base-px, incl sword)
    let SCALED_W = SPR_W * S;
    const BODY_H = 33;       // both characters' standing height (base-px)
    const RIVER_SCALE = 4;   // css px per river art px

    // ─── Palette ──────────────────────────────────────────────────────────────
    const C = {
        // male warrior
        h:  '#130600',   // hair
        s:  '#f0b888',   // skin
        e:  '#050101',   // eye
        a:  '#2d3748',   // armor dark
        al: '#536078',   // armor highlight
        c:  '#c2703a',   // cape (site accent)
        cl: '#d4894e',   // cape light edge
        sb: '#dde8f2',   // sword blade silver
        se: '#98afc0',   // sword edge darker
        sg: '#c9a030',   // sword guard gold
        sh: '#4a1f00',   // sword handle
        b:  '#111820',   // boots
        bt: '#c2703a',   // boot trim (accent)
        // heroine — dark skin, rugged warrior kit, teal accents
        hh: '#1c0f08',   // hair
        hq: '#3d2415',   // hair shine
        hs: '#8a5430',   // skin
        hd: '#6b3d20',   // skin shadow
        he: '#100603',   // eye
        lt: '#5b3a1f',   // leather dark
        ll: '#8b6540',   // leather light
        st: '#aab2ba',   // steel pauldron
        tq: '#2f8f83',   // teal sash / trim
        wr: '#c9b089',   // arm & leg wraps
        hb: '#20140b',   // boots
        // effects
        x1: '#e04434',   // exclamation
        k1: '#fff6d8',   // spark bright
        k2: '#ffd76a',   // spark gold
    };

    const CLIFF_THEME = {
        light: { grass: '#7fb069', grassD: '#5d8b4c', dirt: '#8a6642', rock: '#8a8175', rockD: '#6d655a', rockE: '#a89e8f' },
        dark:  { grass: '#3f6b4f', grassD: '#2e5039', dirt: '#4a3826', rock: '#454b63', rockD: '#333850', rockE: '#5a6180' },
    };

    const RIVER_THEME = {
        light: { deep: '#3a7db0', mid: '#4a90c2', up: '#5fa8d3', surf: '#8ecae6', foam: '#e8f6fd', glint: '#bfe0f2' },
        dark:  { deep: '#081426', mid: '#0a1a30', up: '#10254a', surf: '#1c3a6e', foam: '#9db8e8', glint: '#4a6aa8' },
    };

    const FIRE = {
        core: '#ffe38a', mid: '#ff9a3d', outer: '#e0521f',
        log: '#5a3413', logD: '#3d2209', dark: '#150c06', smoke: '#8a8a8a',
    };

    // ─── Pixel helpers ────────────────────────────────────────────────────────
    function r(k, bx, by, bw, bh) { return [k, bx, by, bw, bh]; }
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function clamp01(t) { return t < 0 ? 0 : (t > 1 ? 1 : t); }
    function smooth(t) { t = clamp01(t); return t * t * (3 - 2 * t); }
    function lerp(a, b, t) { return a + (b - a) * t; }

    // ─── Male sprite parts (base pixels, facing RIGHT) ───────────────────────
    const HAIR = [
        r('h', 5, 0, 7, 3),
        r('h', 4, 1, 2, 6),
        r('h', 11, 2, 1, 5),
        r('h', 5, 6, 3, 2),
        r('h', 5, 8, 2, 4),
    ];
    const FACE = [
        r('s', 5, 3, 6, 5),
        r('s', 4, 6, 7, 2),
        r('e', 6, 4, 2, 2),
        r('e', 9, 4, 1, 1),
        r('h', 5, 3, 1, 1),
    ];
    const CAPE = [
        r('c',  2,  9, 3, 14),
        r('cl', 2,  9, 1,  6),
        r('c',  3, 23, 2,  4),
        r('cl', 1, 12, 1,  5),
    ];
    const NECK = [r('s', 7, 8, 3, 2)];
    const BODY = [
        r('a',  5, 10, 7, 9),
        r('al', 5, 10, 1, 9),
        r('al', 11,10, 1, 9),
        r('al', 5, 10, 7, 1),
        r('al', 6, 13, 5, 1),
        r('h',  5, 18, 7, 2),
        r('sg', 7, 18, 3, 2),
    ];
    const LEFT_ARM = [
        r('a',  3, 10, 2, 7),
        r('s',  3, 17, 2, 3),
        r('a',  2, 10, 1, 5),
    ];
    const RIGHT_ARM = [
        r('a',  12, 10, 2, 7),
        r('s',  12, 17, 2, 2),
    ];
    const SWORD = [
        r('sh', 14, 15, 5, 3),
        r('h',  14, 15, 1, 3),
        r('h',  17, 15, 1, 3),
        r('sg', 13, 13, 2, 7),
        r('sg', 11, 14, 5, 1),
        r('sg', 11, 18, 5, 1),
        r('sb', 15, 13, 17, 1),
        r('sb', 15, 14, 17, 2),
        r('se', 15, 16, 16, 1),
        r('sb', 29, 13, 2, 4),
        r('sb', 31, 14, 1, 2),
        r('al', 17, 14, 8, 1),
    ];

    function legsStand(bob) {
        const y = 20 + (bob % 2);
        return [
            r('al', 5, y, 3, 8),   r('al', 9, y, 3, 8),
            r('b',  4, y+8, 5, 5), r('b',  8, y+8, 5, 5),
            r('bt', 4, y+8, 5, 1), r('bt', 8, y+8, 5, 1),
        ];
    }

    const LEGS_WALK = [
        [   // frame 0 — left leg fwd
            r('al', 5, 19, 3, 8), r('al', 9, 21, 3, 8),
            r('b',  4, 27, 6, 4), r('b',  8, 29, 4, 4),
            r('bt', 4, 27, 6, 1), r('bt', 8, 29, 4, 1),
        ],
        [   // frame 1 — right leg fwd
            r('al', 5, 21, 3, 8), r('al', 9, 19, 3, 8),
            r('b',  4, 29, 4, 4), r('b',  8, 27, 6, 4),
            r('bt', 4, 29, 4, 1), r('bt', 8, 27, 6, 1),
        ],
    ];

    // Diving head-first, cape streaming up, front arm reaching down.
    // Grid is 16 wide, head at the BOTTOM; hand tip ends at y30.
    const MALE_DIVE = [
        r('c',  2, 0, 3, 12), r('cl', 2, 0, 1, 6), r('c', 4, -3, 2, 4),
        r('b',  4, 0, 5, 4),  r('bt', 4, 3, 5, 1),
        r('b',  9, -2, 4, 4), r('bt', 9, 1, 4, 1),
        r('al', 5, 4, 3, 8),  r('al', 9, 2, 3, 8),
        r('a',  5, 12, 7, 9), r('al', 5, 12, 1, 9), r('al', 11, 12, 1, 9), r('al', 6, 17, 5, 1),
        r('a',  3, 13, 2, 6), r('s', 3, 19, 2, 2),
        r('s',  7, 20, 3, 1),
        r('s',  5, 21, 6, 5),
        r('e',  6, 24, 2, 2), r('e', 9, 24, 1, 1),
        r('h',  4, 25, 7, 3), r('h', 5, 28, 4, 2), r('h', 10, 22, 1, 4),
        r('a',  12, 14, 2, 8), r('s', 12, 22, 2, 6), r('s', 13, 28, 2, 2),
    ];

    // ─── Heroine sprite parts (base pixels, authored facing RIGHT) ───────────
    const W_STAND = [
        // short cropped hair
        r('hh', 5, 0, 7, 3), r('hq', 6, 0, 3, 1), r('hh', 4, 1, 2, 5),
        r('hh', 11, 2, 1, 4), r('hh', 4, 6, 2, 2),
        // face
        r('hs', 5, 3, 6, 5), r('hs', 4, 6, 7, 2),
        r('he', 6, 4, 2, 2), r('he', 9, 4, 1, 1),
        r('hh', 5, 3, 2, 1), r('hh', 10, 3, 1, 2),
        r('hs', 7, 8, 3, 2),  // neck
        // torso: leather top, steel pauldron, teal sash, ragged tassets
        r('lt', 5, 10, 7, 7), r('ll', 5, 10, 1, 7), r('ll', 5, 10, 7, 1),
        r('st', 4, 9, 4, 2),  r('st', 3, 10, 2, 2),
        r('tq', 5, 16, 7, 1),
        r('lt', 4, 17, 9, 3), r('ll', 4, 17, 1, 3),
        r('lt', 4, 20, 2, 1), r('lt', 8, 20, 2, 1), r('lt', 12, 20, 1, 1),
        // arms
        r('hd', 3, 11, 2, 6), r('wr', 3, 14, 2, 2), r('hd', 3, 17, 2, 2),
        r('hs', 12, 11, 2, 6), r('wr', 12, 13, 2, 2), r('hs', 12, 17, 2, 2),
        // legs: bare thighs, wraps, boots with teal trim
        r('hs', 5, 21, 3, 4), r('hs', 9, 21, 3, 4),
        r('wr', 5, 25, 3, 2), r('wr', 9, 25, 3, 2),
        r('hs', 5, 27, 3, 1), r('hs', 9, 27, 3, 1),
        r('hb', 4, 28, 5, 5), r('hb', 8, 28, 5, 5),
        r('tq', 4, 28, 5, 1), r('tq', 8, 28, 5, 1),
    ];

    // Falling on her back — horizontal, head at the LEFT, face up toward the
    // cliff. Grid 34 wide × 16 tall.
    const W_FALL = [
        // short hair tuft below the head
        r('hh', 2, 8, 3, 2), r('hh', 3, 10, 2, 1),
        // head, face up
        r('hh', 3, 4, 5, 7),
        r('hs', 5, 3, 5, 5),
        r('he', 6, 3, 2, 1), r('he', 9, 3, 1, 1),
        r('hs', 5, 8, 4, 2),
        // torso
        r('lt', 10, 5, 9, 7), r('ll', 10, 5, 9, 1),
        r('st', 10, 4, 3, 3),
        r('tq', 18, 5, 1, 7),
        r('lt', 19, 6, 4, 6),
        // scissored legs, boots to the right
        r('hs', 23, 4, 6, 3), r('wr', 26, 4, 3, 3), r('hb', 29, 3, 5, 4), r('tq', 29, 3, 1, 4),
        r('hs', 23, 9, 5, 3), r('wr', 25, 9, 3, 3), r('hb', 28, 10, 5, 4), r('tq', 28, 10, 1, 4),
    ];
    const W_ARM_REST = [ r('hd', 12, 2, 6, 2), r('wr', 15, 2, 2, 2) ];
    const W_ARM_MID = [     // half-raised, between rest and full reach
        r('hd', 13, -2, 2, 4),
        r('hs', 12, -4, 2, 2),
    ];
    const W_ARM_REACH = [   // extended straight up (negative y, above the grid)
        r('hd', 13, -4, 2, 6), r('wr', 13, -1, 2, 1),
        r('hs', 12, -7, 2, 3),
    ];

    // Swimming: head, shoulders and a stroking arm above the waterline,
    // authored facing LEFT (downstream). Two stroke frames each.
    const M_SWIM = [
        [ r('h', 2, 0, 5, 3), r('s', 1, 2, 5, 3), r('e', 2, 3, 1, 1),
          r('a', 6, 4, 6, 2), r('s', 10, 1, 2, 2) ],
        [ r('h', 2, 0, 5, 3), r('s', 1, 2, 5, 3), r('e', 2, 3, 1, 1),
          r('a', 6, 4, 6, 2), r('s', 0, 4, 2, 2) ],
    ];
    const W_SWIM = [
        [ r('hh', 2, 0, 5, 3), r('hs', 1, 2, 5, 3), r('he', 2, 3, 1, 1),
          r('lt', 6, 4, 6, 2), r('tq', 6, 4, 1, 2), r('hs', 10, 1, 2, 2) ],
        [ r('hh', 2, 0, 5, 3), r('hs', 1, 2, 5, 3), r('he', 2, 3, 1, 1),
          r('lt', 6, 4, 6, 2), r('tq', 6, 4, 1, 2), r('hs', 0, 4, 2, 2) ],
    ];

    // ─── Story timeline (scroll px) ───────────────────────────────────────────
    const TIP0 = 70,  TIP1 = 190;   // heroine tips backward off the edge
    const RUN0 = 230, RUN1 = 400;   // male sprints to the edge
    const LEAP1 = 560;              // ballistic arc off the cliff ends
    const FBLEND = 340;             // scroll px to blend cliff-anchor → cruise
    const CATCH0 = 800;             // gap starts closing
    const CATCH_END_FRAC = 0.86;    // hands touch by this fraction of max scroll

    // ─── State ────────────────────────────────────────────────────────────────
    const IDLE_MS = 320;

    let CANVAS_W = 0;
    let groundY  = 0;
    let EDGE = 0;            // cliff edge x in cliff-canvas px

    // he stands at his watch spot (x set in setupCliff); frames drive idle bob
    let char = { x: 40, frame: 0, frameTimer: 0 };

    let cliffCanvas, cliffCtx, arena;
    let overlay, octx;
    let riverDiv, riverCanvas, rctx;
    let docH = 0, maxScroll = 1;
    let darkNow = null;
    let splash = [];        // particles {x,y,vx,vy,life,col}
    let ripples = [];       // {x,y,w,life}
    let underWater = { her: false };
    let rippleTimer = 0;

    const isDark = () => document.documentElement.classList.contains('dark');

    // ─── Sprite rendering ─────────────────────────────────────────────────────
    function draw(g, rects, cx, cy) {
        for (const [k, bx, by, bw, bh] of rects) {
            g.fillStyle = C[k];
            g.fillRect(cx + bx * S, cy + by * S, bw * S, bh * S);
        }
    }

    // flipW: base-px width of the sprite's own box when mirroring
    function flipped(g, cx, flipW, fn) {
        g.save();
        g.translate(cx + flipW * S, 0);
        g.scale(-1, 1);
        fn(0);
        g.restore();
    }

    function drawMale(g, cx, cy, frame, state, facing) {
        const paint = (x) => {
            draw(g, CAPE, x, cy);
            draw(g, LEFT_ARM, x, cy);
            draw(g, BODY, x, cy);
            draw(g, NECK, x, cy);
            draw(g, HAIR, x, cy);
            draw(g, FACE, x, cy);
            draw(g, RIGHT_ARM, x, cy);
            draw(g, SWORD, x, cy);
            if (state === 'walk' || state === 'jump' || state === 'run') {
                draw(g, LEGS_WALK[frame % 2], x, cy);
            } else {
                draw(g, legsStand(frame), x, cy);
            }
        };
        if (facing === 'left') flipped(g, cx, SPR_W, paint);
        else paint(cx);
    }

    function drawHeroineStand(g, cx, cy, facing) {
        const paint = (x) => draw(g, W_STAND, x, cy);
        if (facing === 'left') flipped(g, cx, 16, paint);
        else paint(cx);
    }

    // Mirrored (head to the RIGHT) so it continues the tip-over rotation's
    // orientation without a flip: she tips clockwise off the edge and keeps
    // falling head-right, face up. armStage: 0 rest, 1 half-raised, 2 reach.
    function drawHeroineFall(g, cx, cy, armStage) {
        flipped(g, cx, 34, (x) => {
            draw(g, W_FALL, x, cy);
            let arm = W_ARM_REST;
            if (armStage >= 2) arm = W_ARM_REACH;
            else if (armStage === 1) arm = W_ARM_MID;
            draw(g, arm, x, cy);
        });
    }

    function drawExclaim(g, cx, cy) {
        g.fillStyle = C.x1;
        g.fillRect(cx, cy, 2 * S, 5 * S);
        g.fillRect(cx, cy + 6 * S, 2 * S, 2 * S);
    }

    // ─── Cliff island (static art, redrawn on resize/theme) ──────────────────
    function px(g, color, x, y, w, h) { g.fillStyle = color; g.fillRect(x, y, w, h); }
    // deterministic pseudo-random so the island doesn't reshuffle every redraw
    function det(i) { return ((i * 7919) % 97) / 97; }

    function drawCliff() {
        const g = cliffCtx;
        g.clearRect(0, 0, CANVAS_W, CANVAS_H);
        const P = CLIFF_THEME[darkNow ? 'dark' : 'light'];
        const feet = groundY + BODY_H * S;
        const left = 0;

        // grass lip with tufts
        px(g, P.grass, left, feet, EDGE - left, 2 * S);
        px(g, P.grassD, left, feet + 2 * S, EDGE - left, S);
        for (let i = 0; i < Math.floor((EDGE - left) / (14 * S)); i++) {
            const tx = left + 4 * S + Math.floor(det(i) * (EDGE - left - 8 * S));
            px(g, P.grass, tx, feet - S, S, S);
            if (det(i + 31) > 0.5) px(g, P.grassD, tx + S, feet - S, S, S);
        }
        // grass overhang at the edge
        px(g, P.grass, EDGE - S, feet, 2 * S, S);

        // dirt band
        px(g, P.dirt, left, feet + 3 * S, EDGE - left - S, 3 * S);

        // rock face: flat at the left (runs off-screen), stepping in at the edge
        let rgt = EDGE - S;
        let y = feet + 6 * S;
        let i = 0;
        while (y < CANVAS_H && rgt > 8 * S) {
            const rowH = 4 * S;
            px(g, P.rock, 0, y, rgt, rowH);
            for (let k = 0; k < 4; k++) {
                const dx = Math.floor(det(i * 3 + k) * Math.max(1, rgt - 6 * S));
                px(g, P.rockD, dx, y + S, Math.floor(3 + det(i + k) * 4) * S, 2 * S);
            }
            px(g, P.rockE, rgt - S, y, S, rowH);
            rgt -= Math.floor(1 + det(i + 13) * 3) * S;
            y += rowH;
            i++;
        }
    }

    // ─── Shoreline at the page's end: land runs from the left edge to 3/4 of
    // the viewport; open water fills the space to its right. The pair falls
    // into the water and swims left to shore. Low-res, css px = art px * 4. ──
    let flowT = 0;
    let riverTopDoc = 0;     // document y of the river canvas top
    let riverH = 0;          // canvas css height
    const RIVER_SURF = 36;   // art row of the waterline / grass line — the
                             // air rows above it hold the cave

    function buildRiver() {
        if (!riverDiv || !riverCanvas) return;
        const rect = riverDiv.getBoundingClientRect();
        riverTopDoc = rect.top + window.scrollY;
        riverH = rect.height;
        riverCanvas.width = Math.ceil(rect.width / RIVER_SCALE);
        riverCanvas.height = Math.ceil(riverH / RIVER_SCALE);
        rctx.imageSmoothingEnabled = false;
    }

    function drawRiver(dt) {
        if (!rctx || !riverH) return;
        flowT += dt / 1000;
        const g = rctx;
        const w = riverCanvas.width, h = riverCanvas.height;
        const P = RIVER_THEME[darkNow ? 'dark' : 'light'];
        const K = CLIFF_THEME[darkNow ? 'dark' : 'light'];
        g.clearRect(0, 0, w, h);
        const mx = Math.round(w * 0.75);   // where the land ends, water begins

        // water: surface line + depth bands
        px(g, P.surf, mx, RIVER_SURF, w - mx, 2);
        px(g, P.up,   mx, RIVER_SURF + 2, w - mx, 5);
        px(g, P.mid,  mx, RIVER_SURF + 7, w - mx, 8);
        px(g, P.deep, mx, RIVER_SURF + 15, w - mx, Math.max(0, h - RIVER_SURF - 15));

        // surface foam dither
        for (let x = mx; x < w; x += 2) {
            if ((x + Math.floor(flowT * 8)) % 9 === 0) px(g, P.foam, x, RIVER_SURF, 1, 1);
        }
        // glints drifting left, toward the shore
        for (let lane = 0; lane < 5; lane++) {
            const y = RIVER_SURF + 3 + lane * 4;
            if (y >= h) break;
            const spacing = 28 + lane * 9;
            const off = (flowT * (10 + lane * 4)) % spacing;
            for (let x = w - off - lane * 6; x > mx + 1; x -= spacing) {
                px(g, P.glint, Math.round(x), y, 4, 1);
            }
        }
        // water lapping against the bank
        if (Math.floor(flowT * 5) % 3 === 0) px(g, P.foam, mx, RIVER_SURF - 1, 2, 1);
        px(g, P.foam, mx, RIVER_SURF, 2, 2);

        // land: grass lip, dirt, rock down to the bottom; bank face drops
        // into the water at mx
        px(g, K.grass, 0, RIVER_SURF, mx, 2);
        px(g, K.grassD, 0, RIVER_SURF + 2, mx, 1);
        px(g, K.dirt, 0, RIVER_SURF + 3, mx, 3);
        px(g, K.rock, 0, RIVER_SURF + 6, mx, Math.max(0, h - RIVER_SURF - 6));
        px(g, K.dirt, mx - 2, RIVER_SURF + 3, 2, Math.min(8, h - RIVER_SURF - 3));
        for (let i = 0; i < Math.floor(mx / 10); i++) {
            const tx = Math.floor(det(i + 3) * Math.max(1, mx - 4));
            if (det(i) > 0.55) px(g, K.grass, tx, RIVER_SURF - 1, 1, 1);
            px(g, K.rockD, tx, RIVER_SURF + 8 + Math.floor(det(i + 11) * Math.max(1, h - RIVER_SURF - 12)), 3, 2);
        }

        drawCave(g, K);
    }

    // ─── Stone cave on the left of the land, bonfire burning inside ─────────
    const CAVE = { x: 6, w: 48, h: 30 };   // art px; sits on the grass line
    const CAVE_ROCK = { base: '#3a3a40', dk: '#26262c', lt: '#55555e', edge: '#191920' };

    function drawCave(g, K) {
        const G = RIVER_SURF;              // ground row
        const R = CAVE_ROCK;
        const halfW = CAVE.w / 2;
        const cx = CAVE.x + halfW;         // arch center column
        const CAP = 13;                    // rounded-cap rows of the ∩ arch

        // ∩ silhouette: straight sides, circular cap — row half-widths
        const halves = [];
        for (let i = 0; i < CAVE.h; i++) {
            const half = i < CAP
                ? Math.max(3, Math.round(halfW * Math.sqrt(1 - ((CAP - i) / CAP) ** 2)))
                : halfW;
            halves.push(half);
            px(g, R.base, Math.round(cx - half), G - CAVE.h + i, half * 2, 1);
        }

        // stacked-stone masonry: dark seams every course, running-bond joints,
        // and a highlight on each stone's top edge
        for (let i = 0; i < CAVE.h; i++) {
            const y = G - CAVE.h + i;
            const half = halves[i];
            const course = Math.floor(i / 3);
            if (i % 3 === 2) {
                px(g, R.dk, Math.round(cx - half) + 1, y, half * 2 - 2, 1);
            } else if (i % 3 === 0) {
                const stoneW = 6 + (course % 2);
                const off = (course % 2) * 3 + Math.floor(det(course) * 2);
                for (let x = cx - half + off; x < cx + half - 1; x += stoneW) {
                    px(g, R.dk, Math.round(x), y, 1, 2);
                    px(g, R.lt, Math.round(x) + 2, y, 2, 1);
                }
            }
        }

        // outline + a couple of tumbled boulders at the base for a natural foot
        for (let i = 0; i < CAVE.h; i++) {
            const y = G - CAVE.h + i;
            px(g, R.edge, Math.round(cx - halves[i]), y, 1, 1);
            px(g, R.edge, Math.round(cx + halves[i]) - 1, y, 1, 1);
        }
        px(g, R.base, CAVE.x - 4, G - 3, 5, 3);
        px(g, R.lt, CAVE.x - 3, G - 3, 2, 1);
        px(g, R.edge, CAVE.x - 4, G - 1, 1, 1);
        px(g, R.base, CAVE.x + CAVE.w - 1, G - 2, 4, 2);
        px(g, R.lt, CAVE.x + CAVE.w, G - 2, 2, 1);
        // moss tufts on the crown
        px(g, K.grassD, Math.round(cx) - 3, G - CAVE.h - 1, 4, 1);
        px(g, K.grass, Math.round(cx) + 4, G - CAVE.h, 2, 1);

        // entrance: dark ∩ arch opening down to the ground
        const EH = 20, ER = 8;             // entrance height / cap rows
        for (let i = 0; i < EH; i++) {
            const y = G - EH + i;
            const ehalf = i < ER
                ? Math.max(2, Math.round(8 * Math.sqrt(1 - ((ER - i) / ER) ** 2)))
                : 8;
            px(g, FIRE.dark, Math.round(cx - ehalf), y, ehalf * 2, 1);
            px(g, R.edge, Math.round(cx - ehalf) - 1, y, 1, 1);
            px(g, R.edge, Math.round(cx + ehalf), y, 1, 1);
        }

        // bonfire on the cave floor
        const fx = Math.round(cx);
        const fy = G - 1;
        const flick = Math.floor(flowT * 9) % 3;

        // warm glow spilling out (stronger in the dark theme)
        const pulse = 0.05 * Math.sin(flowT * 11);
        g.globalAlpha = (darkNow ? 0.22 : 0.11) + pulse;
        g.fillStyle = FIRE.mid;
        g.fillRect(fx - 8, fy - 10, 16, 11);
        g.globalAlpha = (darkNow ? 0.14 : 0.07) + pulse;
        g.fillRect(fx - 12, fy - 14, 24, 15);
        g.globalAlpha = 1;

        // logs + stone ring
        px(g, FIRE.logD, fx - 4, fy, 8, 1);
        px(g, FIRE.log, fx - 3, fy - 1, 6, 1);
        px(g, K.rockD, fx - 6, fy, 2, 1);
        px(g, K.rockD, fx + 4, fy, 2, 1);

        // flames: three flicker frames
        px(g, FIRE.outer, fx - 3, fy - 4, 6, 3);
        px(g, FIRE.mid, fx - 2, fy - 5, 4, 3);
        px(g, FIRE.core, fx - 1, fy - 4, 2, 2);
        if (flick === 0) {
            px(g, FIRE.mid, fx - 1, fy - 7, 2, 2);
            px(g, FIRE.outer, fx + 2, fy - 5, 1, 1);
        } else if (flick === 1) {
            px(g, FIRE.mid, fx, fy - 7, 2, 2);
            px(g, FIRE.core, fx - 1, fy - 5, 1, 1);
            px(g, FIRE.outer, fx - 3, fy - 5, 1, 1);
        } else {
            px(g, FIRE.mid, fx - 2, fy - 6, 2, 1);
            px(g, FIRE.core, fx, fy - 6, 1, 2);
        }

        // embers rising inside the entrance
        for (let k = 0; k < 2; k++) {
            const rise = (flowT * (7 + k * 3) + k * 5) % 12;
            g.globalAlpha = 1 - rise / 12;
            g.fillStyle = k ? FIRE.core : FIRE.mid;
            g.fillRect(fx - 1 + Math.round(Math.sin(flowT * 3 + k * 2) * 2), Math.round(fy - 6 - rise), 1, 1);
        }
        // smoke drifting from the cave mouth
        for (let k = 0; k < 3; k++) {
            const rise = (flowT * 4 + k * 6) % 18;
            g.globalAlpha = 0.35 * (1 - rise / 18);
            g.fillStyle = FIRE.smoke;
            g.fillRect(fx + 6 + Math.round(rise * 0.4), Math.round(G - EH - 2 - rise), 2, 1);
        }
        g.globalAlpha = 1;
    }

    // ─── Splash & ripples (overlay space) ─────────────────────────────────────
    function spawnSplash(x, y, big) {
        const P = RIVER_THEME[darkNow ? 'dark' : 'light'];
        const n = big ? 18 : 10;
        for (let i = 0; i < n; i++) {
            splash.push({
                x, y,
                vx: rnd(-2.4, 2.4) * (big ? 1.2 : 0.8),
                vy: rnd(-6.5, -2) * (big ? 1.1 : 0.8),
                life: rnd(450, 800),
                col: Math.random() < 0.5 ? P.foam : P.glint,
            });
        }
        ripples.push({ x, y, w: 6, life: 900 });
    }

    function updateEffects(dt) {
        for (const p of splash) {
            p.x += p.vx * S * dt / 16;
            p.vy += 0.32 * dt / 16;
            p.y += p.vy * S * dt / 16;
            p.life -= dt;
        }
        splash = splash.filter((p) => p.life > 0);
        for (const q of ripples) { q.w += dt * 0.06; q.life -= dt; }
        ripples = ripples.filter((q) => q.life > 0);
    }

    function drawEffects(g) {
        for (const p of splash) {
            g.globalAlpha = clamp01(p.life / 400);
            g.fillStyle = p.col;
            g.fillRect(Math.round(p.x), Math.round(p.y), S, S);
        }
        g.globalAlpha = 1;
        const foam = RIVER_THEME[darkNow ? 'dark' : 'light'].foam;
        for (const q of ripples) {
            g.globalAlpha = clamp01(q.life / 900) * 0.9;
            g.fillStyle = foam;
            g.fillRect(Math.round(q.x - q.w * S), Math.round(q.y), Math.round(q.w * S * 0.6), S);
            g.fillRect(Math.round(q.x + q.w * S * 0.4), Math.round(q.y), Math.round(q.w * S * 0.6), S);
        }
        g.globalAlpha = 1;
    }

    // ─── Male idle (he stands watch; only the scroll story moves him) ────────
    function update(dt) {
        char.frameTimer += dt;
        if (char.frameTimer >= IDLE_MS) { char.frame++; char.frameTimer = 0; }
    }

    // ─── Story geometry ───────────────────────────────────────────────────────
    function cruiseX(vw) {
        const sprW = 34 * S;
        if (vw >= 1200) {
            const contentRight = vw / 2 + 512;   // max-w-4xl right edge
            return Math.min(vw - sprW - 24, contentRight + 46);
        }
        return Math.min(vw * 0.78, vw - sprW - 8);
    }

    // Everything below returns positions in viewport (overlay) CSS px.
    function renderStory(dt) {
        const s = window.scrollY;
        const vw = overlay.width, vh = overlay.height;
        const g = octx;
        g.clearRect(0, 0, vw, vh);

        const rect = cliffCanvas.getBoundingClientRect();
        const feetCanvasY = groundY + BODY_H * S;
        const edgeV = { x: rect.left + EDGE, y: rect.top + feetCanvasY };

        const D = maxScroll;

        // shoreline geometry: waterline + where the land ends
        const surfaceDoc = riverTopDoc + RIVER_SURF * RIVER_SCALE;
        const shoreX = vw * 0.75;
        const entryX = cruiseX(vw) + 4 * S;          // where they hit the water
        const E0 = riverH ? Math.max(CATCH0 + 500, D - 380) : D + 9999; // dive begins
        const E1 = Math.max(E0 + 80, D - 260);       // splash / swim start
        const catchEnd = Math.min(Math.max(CATCH0 + 250, D * CATCH_END_FRAC), E0 - 60);
        const swm = (s - E1) / Math.max(1, D - E1);  // swim progress 0..1

        // ── heroine ──
        const sway = Math.sin(s * 0.004) * 10;
        const hcx = cruiseX(vw) + sway;
        const hcy = vh * 0.58 + Math.sin(s * 0.0023) * vh * 0.03;

        let herPos = null;     // top-left of the 34x16 fall sprite
        let herMode;

        if (s < TIP0) {
            herMode = 'stand';
        } else if (s < TIP1) {
            herMode = 'tip';
        } else if (swm <= 0) {
            herMode = 'fall';
            // anchor starts where the tip-over rotation left her head (just
            // past the edge, at platform level), plummets in page space, then
            // blends to the viewport cruise position
            const drop = (s - TIP1) * 0.55;
            const ax = edgeV.x - 2 * S;
            const ay = edgeV.y + S + drop;
            const w = smooth((s - TIP1) / FBLEND);
            herPos = { x: lerp(ax, hcx, w), y: lerp(ay, hcy, w) };
            // final descent to the water surface; the target sits right above
            // the swim-phase start position so the hand-off is seamless
            const pre = smooth((s - E0) / Math.max(1, E1 - E0));
            if (pre > 0) {
                herPos.x = lerp(herPos.x, entryX - 17 * S, pre);
                herPos.y = lerp(herPos.y, surfaceDoc - s - 10 * S, pre);
            }
        } else {
            herMode = 'swim';
        }

        // ── swim left across the water, then climb out onto the land ──
        const landYDoc = surfaceDoc;                 // grass line = waterline
        const landX = shoreX - 46 * S;               // stand spot on the land
        let herSwim = null, himSwim = null, ashore = 0;
        if (swm > 0 && riverH) {
            ashore = smooth((swm - 0.72) / 0.24);
            const st = smooth(Math.min(1, swm / 0.8));
            const surfVY = surfaceDoc - s;
            herSwim = {
                x: lerp(lerp(entryX, shoreX + 8 * S, st), landX + 20 * S, ashore),
                y: lerp(surfVY - 4 * S, landYDoc - s - 6 * S, ashore),
            };
            himSwim = {
                x: lerp(lerp(entryX + 15 * S, shoreX + 22 * S, st), landX, ashore),
                y: lerp(surfVY - 3 * S, landYDoc - s - 6 * S, ashore),
            };
        }

        // ── male ──
        let malePos = null;    // top-left of the 16x34 dive sprite
        let maleMode;

        if (swm > 0) {
            maleMode = 'swim';
        } else if (s < RUN0) {
            maleMode = 'cliff';
        } else if (s < RUN1) {
            maleMode = 'run';
        } else if (s < LEAP1) {
            maleMode = 'leap';
        } else {
            maleMode = 'dive';
        }

        if (maleMode === 'dive') {
            const gap0 = vh * 0.42;
            const touchGap = 37 * S;
            const cp = smooth((s - CATCH0) / Math.max(1, catchEnd - CATCH0));
            const gap = lerp(gap0, touchGap, cp);
            const hy = herPos ? herPos.y : hcy;
            const hx = herPos ? herPos.x : hcx;
            // settle from the leap arc into formation over ~250px of scroll
            const settle = smooth((s - LEAP1) / 250);
            // exactly where the leap arc ends (its t=1 position), so the
            // jump-to-dive pose swap reads as a flip, not a teleport
            const leapEndX = edgeV.x + 26 * S;
            const leapEndY = edgeV.y + 47 * S + (s - LEAP1) * 0.5;
            malePos = {
                // +7*S lines his reaching hand up with her mirrored raised arm
                x: lerp(leapEndX, hx + 7 * S, settle),
                y: lerp(leapEndY, hy - gap, settle),
            };
        }

        const swimFrame = Math.floor(flowT * 3);

        // heroine draw — facing the hero, she tips clockwise backward OFF the
        // edge; the fall pose is mirrored to continue that same orientation
        // (head to the right, face up), so the sprite never flips.
        if (herMode === 'stand') {
            drawHeroineStand(g, edgeV.x - 15 * S, edgeV.y - BODY_H * S, 'left');
        } else if (herMode === 'tip') {
            const t = smooth((s - TIP0) / (TIP1 - TIP0));
            g.save();
            g.translate(edgeV.x - 7 * S, edgeV.y);          // pivot at her feet
            g.rotate(t * t * 1.75);                          // ~100° backward
            drawHeroineStand(g, -8 * S, -BODY_H * S, 'left');
            g.restore();
        } else if (herMode === 'fall' && herPos) {
            // the arm raises in two steps so the pose change reads as motion
            let armStage = 0;
            if (s > CATCH0 + (catchEnd - CATCH0) * 0.55) armStage = 2;
            else if (s > CATCH0 + (catchEnd - CATCH0) * 0.3) armStage = 1;
            drawHeroineFall(g, Math.round(herPos.x), Math.round(herPos.y), armStage);
        } else if (herSwim) {
            if (ashore > 0.85) {
                drawHeroineStand(g, Math.round(herSwim.x), Math.round(landYDoc - s - BODY_H * S), 'left');
            } else {
                draw(g, W_SWIM[swimFrame % 2], Math.round(herSwim.x), Math.round(herSwim.y));
            }
        }

        // male draw
        if (maleMode === 'cliff') {
            drawMale(g, rect.left + Math.round(char.x), rect.top + groundY, char.frame, 'idle', 'right');
            if (s > TIP1 - 40 && s < RUN0) {
                drawExclaim(g, rect.left + Math.round(char.x) + 6 * S, rect.top + groundY - 9 * S);
            }
        } else if (maleMode === 'run') {
            const t = clamp01((s - RUN0) / (RUN1 - RUN0));
            const x = lerp(char.x, EDGE - 30 * S, t * t);
            drawMale(g, rect.left + Math.round(x), rect.top + groundY, Math.floor(t * 14), 'run', 'right');
        } else if (maleMode === 'leap') {
            const t = clamp01((s - RUN1) / (LEAP1 - RUN1));
            const x = edgeV.x - 30 * S + t * 56 * S;
            const y = edgeV.y - BODY_H * S - 20 * S * 4 * t * (1 - t) + 80 * S * t * t;
            drawMale(g, Math.round(x), Math.round(y), Math.floor(t * 6), 'jump', 'right');
        } else if (maleMode === 'dive' && malePos) {
            draw(g, MALE_DIVE, Math.round(malePos.x), Math.round(malePos.y));
            // hands spark while touching
            if (herPos && (herPos.y - malePos.y) < 38 * S) {
                const tx = Math.round(malePos.x + 12 * S);
                const ty = Math.round(malePos.y + 30 * S);
                g.fillStyle = C.k1;
                g.fillRect(tx - S, ty, S, S);
                g.fillRect(tx + 2 * S, ty - S, S, S);
                g.fillStyle = C.k2;
                g.fillRect(tx + S, ty + S, S, S);
                g.fillRect(tx - 2 * S, ty - 2 * S, S, S);
            }
        } else if (himSwim) {
            if (ashore > 0.85) {
                drawMale(g, Math.round(himSwim.x), Math.round(landYDoc - s - BODY_H * S), 0, 'idle', 'right');
            } else {
                draw(g, M_SWIM[(swimFrame + 1) % 2], Math.round(himSwim.x), Math.round(himSwim.y));
            }
        }

        // ── water entry splash + swim wake ──
        const inWater = swm > 0 && ashore < 0.85;
        if (inWater && !underWater.her) {
            spawnSplash(entryX, surfaceDoc - s, true);
            spawnSplash(entryX + 15 * S, surfaceDoc - s, false);
        }
        underWater.her = inWater;
        if (inWater && herSwim) {
            rippleTimer -= dt;
            if (rippleTimer <= 0) {
                ripples.push({ x: herSwim.x + 8 * S, y: herSwim.y + 5 * S, w: 3, life: 900 });
                if (himSwim) ripples.push({ x: himSwim.x + 10 * S, y: himSwim.y + 5 * S, w: 2, life: 700 });
                rippleTimer = 420;
            }
        }

        updateEffects(dt);
        drawEffects(g);
    }

    // ─── Canvas setup ─────────────────────────────────────────────────────────
    function extraLeftPx() {
        if (window.innerWidth < 640) return 0;
        const arenaRect = arena.getBoundingClientRect();
        const lastWord = document.querySelector('#hero h1 .hero-word:last-child');
        if (!lastWord) return 0;
        const wordRect = lastWord.getBoundingClientRect();
        return Math.max(0, arenaRect.left - wordRect.left);
    }

    function setupCliff() {
        S        = window.innerWidth < 640 ? 2 : 3;
        SCALED_W = SPR_W * S;
        const arenaRect = arena.getBoundingClientRect();
        const arenaW = arenaRect.width || arena.offsetWidth || 280;
        // the cliff runs from the LEFT edge of the screen to the arena's right
        CANVAS_W  = Math.max(Math.ceil(arenaRect.right), SCALED_W + 20 * S);
        EDGE      = CANVAS_W - 4 * S;
        cliffCanvas.width          = CANVAS_W;
        cliffCanvas.height         = CANVAS_H;
        cliffCanvas.style.position = 'absolute';
        cliffCanvas.style.right    = '0';
        cliffCanvas.style.top      = '0';
        cliffCanvas.style.zIndex   = '5';
        cliffCanvas.style.pointerEvents = 'none';
        cliffCtx.imageSmoothingEnabled = false;
        groundY = 10;
        // his watch spot: where the old roaming canvas used to begin
        char.x = Math.max(20, Math.min(CANVAS_W - (arenaW + extraLeftPx()) + 40, EDGE - 44 * S));
        drawCliff();
    }

    function setupOverlay() {
        overlay.width = window.innerWidth;
        overlay.height = window.innerHeight;
        octx.imageSmoothingEnabled = false;
    }

    function refreshDoc() {
        docH = document.body.offsetHeight;
        maxScroll = Math.max(1, docH - window.innerHeight);
        buildRiver();
    }

    // ─── Entry point ─────────────────────────────────────────────────────────
    function start() {
        arena       = document.getElementById('pixel-hero-arena');
        cliffCanvas = document.getElementById('pixel-hero-canvas');
        if (!arena || !cliffCanvas) return;
        cliffCtx = cliffCanvas.getContext('2d');

        riverDiv    = document.getElementById('pixel-river');
        riverCanvas = document.getElementById('pixel-river-canvas');
        if (riverCanvas) rctx = riverCanvas.getContext('2d');

        overlay = document.createElement('canvas');
        overlay.className = 'pixel-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        document.body.appendChild(overlay);
        octx = overlay.getContext('2d');

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function tryInit(attempts) {
            const w = arena.getBoundingClientRect().width;
            if (w === 0 && attempts < 60) {
                requestAnimationFrame(() => tryInit(attempts + 1));
                return;
            }
            darkNow = isDark();
            setupCliff();
            setupOverlay();
            refreshDoc();

            if (prefersReducedMotion) {
                // Static scene: both stand on the cliff, still river. Redraw on
                // scroll/resize only to stay anchored — no animation.
                const still = () => {
                    if (isDark() !== darkNow) { darkNow = isDark(); drawCliff(); }
                    const g = octx;
                    g.clearRect(0, 0, overlay.width, overlay.height);
                    const rect = cliffCanvas.getBoundingClientRect();
                    const feetY = groundY + BODY_H * S;
                    drawHeroineStand(g, rect.left + EDGE - 15 * S, rect.top + feetY - BODY_H * S, 'left');
                    drawMale(g, rect.left + Math.round(char.x), rect.top + groundY, 0, 'idle', 'right');
                    drawRiver(0);
                };
                window.addEventListener('scroll', still, { passive: true });
                window.addEventListener('resize', () => { setupCliff(); setupOverlay(); refreshDoc(); still(); });
                still();
                return;
            }

            if (window.ResizeObserver) {
                const ro = new ResizeObserver(() => {
                    const r = arena.getBoundingClientRect();
                    if (r.width > 0) {
                        const newS = window.innerWidth < 640 ? 2 : 3;
                        if (Math.abs(Math.ceil(r.right) - CANVAS_W) > 2 || newS !== S) setupCliff();
                    }
                });
                ro.observe(arena);
                new ResizeObserver(refreshDoc).observe(document.body);
            }
            window.addEventListener('resize', () => { setupCliff(); setupOverlay(); refreshDoc(); });

            let lastTime = 0;
            function loop(ts) {
                if (!lastTime) lastTime = ts;
                const dt = Math.min(ts - lastTime, 48);
                lastTime = ts;
                if (isDark() !== darkNow) { darkNow = isDark(); drawCliff(); }
                update(dt);
                renderStory(dt);
                // river animates whenever any part of it is near the viewport
                if (riverCanvas) {
                    const rt = riverCanvas.getBoundingClientRect();
                    if (rt.top < window.innerHeight + 200 && rt.bottom > -200) drawRiver(dt);
                }
                requestAnimationFrame(loop);
            }
            requestAnimationFrame(loop);
        }

        requestAnimationFrame(() => tryInit(0));
    }

    if (document.readyState === 'complete') {
        start();
    } else {
        window.addEventListener('load', start);
    }
})();
