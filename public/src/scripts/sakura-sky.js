(function () {
    // Ambient pixel-art backdrop behind the hero: a banded, dithered sky with
    // sakura petals, clouds, and wind gusts drifting across it. Drawn on a
    // low-resolution canvas scaled up with image-rendering: pixelated. Purely
    // decorative: behind the page, no pointer events. On scroll the sky (and
    // the pixel character) shift down at PARALLAX speed while the opaque
    // dotted paper sheet (#paper-sheet) scrolls normally and slides over the
    // sky. With prefers-reduced-motion the scene is a still image, no parallax.

    // ─── Config ───────────────────────────────────────────────────────────────
    const PIXEL = 5;              // CSS pixels per art pixel
    const AREA_PER_PETAL = 2600;  // art px² per petal — lower is denser
    const SKY_EXTRA = 160;        // sky buffer below the hero, hidden under the
                                  // paper sheet; absorbs rubber-band scrolling
    const CLOUD_COUNT = 3;
    const PARALLAX = 0.3;         // fraction of scroll the sky lags behind by
    const PAPER_FADE = 160;       // height of .paper-sheet::before's gradient;
                                  // the sky's band arc completes above it

    // Sky bands, top to bottom, dithered at each boundary.
    const SKY = {
        light: ['#9fc8ec', '#b5d6f1', '#cde2f4', '#e2edf8', '#f4e4e2'],
        dark: ['#0a0f24', '#111838', '#1a2347', '#252e52', '#38294a'],
    };

    // Sprite grids; digits index PETAL_COLORS, dots are transparent.
    // The first two are full blossoms (gold stamen center), the rest loose petals.
    const SPRITES = [
        ['.2.2.', '21312', '.343.', '21312', '.2.2.'],
        ['.1.1.', '13231', '.2.2.'],
        ['.12', '122', '223', '33.'],
        ['12.', '223', '.33'],
        ['12', '23'],
    ];

    const PETAL_COLORS = {
        1: '#f7c1d0',
        2: '#ee94b1',
        3: '#d95f89',
        4: '#f7d78f',
    };

    // Lumpy tops, flat shaded undersides. 1 = body, 2 = shadow.
    const CLOUD_GRIDS = [
        [
            '......11111.......',
            '...111111111111...',
            '.1111111111111111.',
            '111111111111111111',
            '.2222222222222222.',
        ],
        [
            '...1111....',
            '.111111111.',
            '11111111111',
            '.222222222.',
        ],
    ];

    const CLOUD_COLORS = {
        light: { 1: '#ffffff', 2: '#d9e7f5' },
        dark: { 1: '#3f4a78', 2: '#303a63' },
    };

    const WIND_COLORS = { light: '#ffffff', dark: '#aab6e3' };

    // ─── Scene pieces ─────────────────────────────────────────────────────────

    // A wind gust path: a wavy run, a curl (loop-the-loop), an exit run, and
    // sometimes a second smaller curl. Returned as dense local points that get
    // drawn pixel by pixel with a fading tail.
    function makeGustPoints() {
        const pts = [];
        let x = 0;
        const wave = (length, amp) => {
            const from = x;
            for (let s = 0; s < length; s += 0.5) {
                pts.push([from + s, Math.sin((from + s) * 0.3) * amp]);
            }
            x = from + length;
        };
        const curl = (r) => {
            for (let a = Math.PI / 2; a > Math.PI / 2 - Math.PI * 2; a -= 0.5 / r) {
                pts.push([x + r * Math.cos(a), -r + r * Math.sin(a)]);
            }
        };
        wave(16 + Math.random() * 10, 1.5);
        curl(3 + Math.random() * 2);
        wave(12 + Math.random() * 8, 1.2);
        if (Math.random() < 0.4) {
            curl(2);
            wave(8, 1);
        }
        return pts.map(([px, py]) => [Math.round(px), Math.round(py)]);
    }

    function makeSpriteCanvas(grid, palette) {
        const canvas = document.createElement('canvas');
        canvas.width = grid[0].length;
        canvas.height = grid.length;
        const ctx = canvas.getContext('2d');
        grid.forEach((row, y) => {
            for (let x = 0; x < row.length; x++) {
                const color = palette[row[x]];
                if (!color) continue;
                ctx.fillStyle = color;
                ctx.fillRect(x, y, 1, 1);
            }
        });
        return canvas;
    }

    // Bands are compressed into the top `bandSpace` rows so the full
    // blue-to-pink arc stays visible above the paper sheet's fade; the rows
    // below keep the last band's color.
    function drawSkyBands(ctx, width, height, bands, bandSpace) {
        const space = Math.max(bands.length, Math.min(bandSpace || height, height));
        ctx.fillStyle = bands[bands.length - 1];
        ctx.fillRect(0, 0, width, height);
        const bandHeight = space / bands.length;
        bands.forEach((color, i) => {
            ctx.fillStyle = color;
            ctx.fillRect(0, Math.floor(i * bandHeight), width, Math.ceil(bandHeight) + 1);
        });
        // Checkerboard dither so band edges read as pixel art, not hard stripes.
        for (let i = 1; i < bands.length; i++) {
            const edge = Math.floor(i * bandHeight);
            ctx.fillStyle = bands[i - 1];
            for (let x = 0; x < width; x++) {
                if ((x + edge) % 2 === 0) ctx.fillRect(x, edge, 1, 1);
                if ((x + edge) % 4 === 1) ctx.fillRect(x, edge + 1, 1, 1);
            }
        }
    }

    function makePetal(width, height, anywhere) {
        return {
            sprite: Math.floor(Math.random() * SPRITES.length),
            baseX: Math.random() * width,
            y: anywhere ? Math.random() * height : -4,
            fall: 6 + Math.random() * 10,   // art px / s
            drift: 2 + Math.random() * 4,   // sideways wind, art px / s
            swayAmp: 3 + Math.random() * 6,
            swayFreq: 0.4 + Math.random() * 0.5, // rad / s
            phase: Math.random() * Math.PI * 2,
            alpha: 0.6 + Math.random() * 0.35,
        };
    }

    // ─── Setup ────────────────────────────────────────────────────────────────
    function init() {
        const wrapper = document.getElementById('sakura-sky');
        const canvas = document.getElementById('sakura-sky-canvas');
        const hero = document.getElementById('hero');
        if (!wrapper || !canvas || !hero) return;
        const paper = document.getElementById('paper-sheet');
        const arena = document.getElementById('pixel-hero-arena');
        const boundary = document.querySelector('.content-wrapper');

        const ctx = canvas.getContext('2d');
        const sprites = SPRITES.map((grid) => makeSpriteCanvas(grid, PETAL_COLORS));
        const skyCanvas = document.createElement('canvas');
        const stillMode = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // The site toggles theme with a .dark class on <html>.
        const isDark = () => document.documentElement.classList.contains('dark');

        let petals = [];
        let clouds = [];
        let cloudSprites = [];
        let gusts = [];
        let nextGustAt = 2;
        let windColor = WIND_COLORS.light;
        let rafId = null;
        let last = null;
        let elapsed = 0;
        let wasDark = null;
        let bandSpace = 0; // art rows for the band arc, set in start()

        const paintSky = () => {
            skyCanvas.width = canvas.width;
            skyCanvas.height = canvas.height;
            const dark = isDark();
            wasDark = dark;
            drawSkyBands(skyCanvas.getContext('2d'), skyCanvas.width, skyCanvas.height, SKY[dark ? 'dark' : 'light'], bandSpace);
            cloudSprites = CLOUD_GRIDS.map((grid) =>
                makeSpriteCanvas(grid, CLOUD_COLORS[dark ? 'dark' : 'light'])
            );
            windColor = WIND_COLORS[dark ? 'dark' : 'light'];
        };

        const drawFrame = () => {
            ctx.drawImage(skyCanvas, 0, 0);
            for (const c of clouds) {
                ctx.drawImage(cloudSprites[c.sprite], Math.round(c.x), c.y);
            }
            ctx.fillStyle = windColor;
            for (const g of gusts) {
                const head = Math.floor(g.head);
                const tailStart = Math.max(0, head - g.tail);
                for (let i = tailStart; i < Math.min(head, g.pts.length); i++) {
                    ctx.globalAlpha = (0.8 * (i - tailStart)) / g.tail;
                    ctx.fillRect(g.x0 + g.pts[i][0], g.y0 + g.pts[i][1], 1, 1);
                }
            }
            ctx.globalAlpha = 1;
            for (const p of petals) {
                const x = p.baseX + Math.sin(elapsed * p.swayFreq + p.phase) * p.swayAmp;
                ctx.globalAlpha = p.alpha;
                ctx.drawImage(
                    sprites[p.sprite],
                    Math.round(((x % canvas.width) + canvas.width) % canvas.width),
                    Math.round(p.y)
                );
            }
            ctx.globalAlpha = 1;
        };

        const tick = (now) => {
            const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.1);
            last = now;
            elapsed += dt;
            for (const c of clouds) {
                c.x += c.speed * dt;
                if (c.x > canvas.width) c.x = -cloudSprites[c.sprite].width;
            }
            if (elapsed >= nextGustAt) {
                // Advance the schedule whenever the clock passes it, even when
                // the 2-gust cap blocks the spawn — otherwise nextGustAt stalls
                // while gusts are full and every later gust fires back-to-back.
                nextGustAt = elapsed + 4 + Math.random() * 6;
                if (gusts.length < 2) {
                    const pts = makeGustPoints();
                    const gustWidth = pts[pts.length - 1][0]; // paths only ever move right
                    gusts.push({
                        pts,
                        head: 0,
                        tail: 30 + Math.floor(Math.random() * 20),
                        speed: 70 + Math.random() * 40, // points / s
                        x0: Math.floor(Math.random() * Math.max(1, canvas.width - gustWidth)),
                        y0: Math.floor(canvas.height * (0.1 + Math.random() * 0.5)),
                    });
                }
            }
            for (const g of gusts) g.head += g.speed * dt;
            gusts = gusts.filter((g) => g.head - g.tail < g.pts.length);
            for (const p of petals) {
                p.y += p.fall * dt;
                p.baseX += p.drift * dt;
                if (p.y > canvas.height + 4) {
                    Object.assign(p, makePetal(canvas.width, canvas.height, false));
                }
            }
            drawFrame();
            rafId = requestAnimationFrame(tick);
        };

        // The paper sheet starts at the hero's bottom edge and runs to the
        // end of the document, sliding over the sky as the page scrolls. The
        // side boundary columns start one fade-strip higher: their CSS mask
        // fades them in across the same strip where the sky dissolves into
        // paper, so they reach full opacity where the dot grid begins.
        const layoutPaper = () => {
            const docHeight = document.body.offsetHeight;
            const heroBottom = hero.offsetTop + hero.offsetHeight;
            if (paper) {
                paper.style.top = heroBottom + 'px';
                paper.style.height = Math.max(0, docHeight - heroBottom) + 'px';
            }
            if (boundary) {
                const top = heroBottom - PAPER_FADE;
                // the columns dissolve just above the shoreline scene (cave,
                // ground and water live inside #pixel-river)
                const river = document.getElementById('pixel-river');
                const bottom = river
                    ? river.getBoundingClientRect().top + window.scrollY + 8
                    : docHeight;
                boundary.style.top = top + 'px';
                boundary.style.height = Math.max(0, bottom - top) + 'px';
            }
        };

        // Resize the canvas and repaint the sky/paper without reseeding petals
        // or clouds. Used when the hero height settles (e.g. the display font
        // loads) so the scene shifts into place instead of popping to a fresh
        // random layout.
        const relayout = () => {
            const heroBottom = hero.offsetTop + hero.offsetHeight;
            wrapper.style.height = (heroBottom + SKY_EXTRA) + 'px';
            layoutPaper();
            canvas.width = Math.ceil(wrapper.clientWidth / PIXEL);
            canvas.height = Math.ceil(wrapper.clientHeight / PIXEL);
            bandSpace = Math.round((heroBottom - PAPER_FADE) / PIXEL);
            paintSky();
            if (stillMode) drawFrame();
        };

        const start = () => {
            // Sky covers the page top through the hero; the extra sits hidden
            // under the paper sheet.
            const heroBottom = hero.offsetTop + hero.offsetHeight;
            wrapper.style.height = (heroBottom + SKY_EXTRA) + 'px';
            layoutPaper();
            canvas.width = Math.ceil(wrapper.clientWidth / PIXEL);
            canvas.height = Math.ceil(wrapper.clientHeight / PIXEL);
            bandSpace = Math.round((heroBottom - PAPER_FADE) / PIXEL);
            paintSky();
            clouds = Array.from({ length: CLOUD_COUNT }, (_, i) => ({
                sprite: i % CLOUD_GRIDS.length,
                x: Math.random() * canvas.width,
                y: Math.round(canvas.height * (0.06 + i * 0.1)),
                speed: 1.2 + i * 0.8, // art px / s
            }));
            const count = Math.min(80, Math.round((canvas.width * canvas.height) / AREA_PER_PETAL));
            petals = Array.from({ length: count }, () =>
                makePetal(canvas.width, canvas.height, true)
            );
            if (stillMode) {
                drawFrame();
            } else if (rafId === null) {
                rafId = requestAnimationFrame(tick);
            }
        };

        const repaintTheme = () => {
            if (isDark() === wasDark) return; // class changed for another reason
            paintSky();
            if (stillMode) drawFrame();
        };

        // Slight parallax: the sky and the pixel character shift down as the
        // page scrolls, so they leave at (1 - PARALLAX) of scroll speed while
        // the paper sheet and content slide over them at full speed.
        let scrollRaf = null;
        const applyParallax = () => {
            scrollRaf = null;
            const shift = 'translate3d(0, ' + (window.scrollY * PARALLAX) + 'px, 0)';
            wrapper.style.transform = shift;
            if (arena) arena.style.transform = shift;
        };
        const onScroll = () => {
            if (scrollRaf === null) scrollRaf = requestAnimationFrame(applyParallax);
        };

        // Debounced: start() rebuilds the whole scene, and the hero resizes
        // continuously during drag-resizes or async content population.
        let resizeTimer = null;
        const onResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(start, 150);
        };

        // The paper sheet's length depends on the whole document, which grows
        // as other sections load — cheap relayout, no scene rebuild.
        let paperTimer = null;
        const onBodyResize = () => {
            clearTimeout(paperTimer);
            paperTimer = setTimeout(layoutPaper, 100);
        };

        start();
        if (!stillMode) window.addEventListener('scroll', onScroll, { passive: true });
        // Hero height changes when content.js populates it and on viewport
        // resizes, so watch the section itself rather than just the window.
        new ResizeObserver(onResize).observe(hero);
        new ResizeObserver(onBodyResize).observe(document.body);
        new MutationObserver(repaintTheme).observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });
        // The display font (Instrument Serif) loads after DOMContentLoaded and
        // shrinks the hero by up to ~60px. Reposition immediately when it
        // settles instead of waiting for the 150ms-debounced ResizeObserver,
        // so there's no visible jump on cold load.
        if (document.fonts?.ready instanceof Promise) {
            document.fonts.ready.then(relayout);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
