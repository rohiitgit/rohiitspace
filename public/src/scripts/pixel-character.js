(function () {
    // ─── Config ───────────────────────────────────────────────────────────────
    const S = 3;             // scale: 3 canvas-px per base-pixel
    const CANVAS_H = 200;    // canvas height (px)
    const SPR_W = 32;        // sprite bounding box width (base-px, includes sword)
    const SCALED_W = SPR_W * S;   // 96

    // ─── Palette ──────────────────────────────────────────────────────────────
    const C = {
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
    };

    // ─── Pixel helpers ────────────────────────────────────────────────────────
    function r(k, bx, by, bw, bh) { return [k, bx, by, bw, bh]; }

    // ─── Sprite parts (base pixels, facing RIGHT) ─────────────────────────────
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

    // ─── State ────────────────────────────────────────────────────────────────
    const WALK_SPEED  = 1.4;
    const WALK_MS     = 110;
    const IDLE_MS     = 320;
    const GRAVITY     = 0.42;
    const JUMP_VEL    = -6;

    let CANVAS_W = 0;
    let groundY  = 0;
    let leftBound = 0;

    let char = {
        x: 40, y: 0,
        velX: WALK_SPEED, velY: 0,
        state: 'walk',
        facing: 'right',
        frame: 0, frameTimer: 0,
        jumpCD: rnd(4000, 7000),
        pauseTimer: 0,
    };

    function rnd(a, b) { return a + Math.random() * (b - a); }

    // ─── Rendering ────────────────────────────────────────────────────────────
    let ctx;

    function draw(rects, cx, cy) {
        for (const [k, bx, by, bw, bh] of rects) {
            ctx.fillStyle = C[k];
            ctx.fillRect(cx + bx * S, cy + by * S, bw * S, bh * S);
        }
    }

    function drawChar(cx, cy, frame, state, facing) {
        ctx.save();
        if (facing === 'left') {
            ctx.translate(cx + SCALED_W, 0);
            ctx.scale(-1, 1);
            cx = 0;
        }
        draw(CAPE, cx, cy);
        draw(LEFT_ARM, cx, cy);
        draw(BODY, cx, cy);
        draw(NECK, cx, cy);
        draw(HAIR, cx, cy);
        draw(FACE, cx, cy);
        draw(RIGHT_ARM, cx, cy);
        draw(SWORD, cx, cy);
        if (state === 'jump') {
            draw(LEGS_WALK[frame % 2], cx, cy);
        } else if (state === 'walk') {
            draw(LEGS_WALK[frame % 2], cx, cy);
        } else {
            draw(legsStand(frame), cx, cy);
        }
        ctx.restore();
    }

    function render() {
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        drawChar(Math.round(char.x), Math.round(char.y), char.frame, char.state, char.facing);
    }

    // ─── Update ───────────────────────────────────────────────────────────────
    function update(dt) {
        if (char.pauseTimer > 0) {
            char.pauseTimer -= dt;
            char.state = 'idle';
            char.frameTimer += dt;
            if (char.frameTimer >= IDLE_MS) { char.frame++; char.frameTimer = 0; }
            if (char.pauseTimer <= 0) {
                char.velX = char.facing === 'right' ? WALK_SPEED : -WALK_SPEED;
                char.state = 'walk';
            }
            return;
        }

        const onGround = char.y >= groundY;
        if (!onGround) {
            char.velY += GRAVITY;
            char.y += char.velY;
            if (char.y >= groundY) {
                char.y = groundY;
                char.velY = 0;
                char.state = 'walk';
                if (Math.random() < 0.3) { char.pauseTimer = rnd(600, 1600); char.velX = 0; }
            }
        } else {
            char.y = groundY;
            if (char.state !== 'jump') {
                char.jumpCD -= dt;
                if (char.jumpCD <= 0) {
                    char.velY = JUMP_VEL;
                    char.state = 'jump';
                    char.jumpCD = rnd(4500, 9000);
                }
            }
        }

        char.x += char.velX;
        const maxX = CANVAS_W - SCALED_W;
        if (char.x <= leftBound) {
            char.x = leftBound; char.velX = WALK_SPEED; char.facing = 'right';
            if (onGround && Math.random() < 0.35) { char.pauseTimer = rnd(500, 1800); char.velX = 0; }
        } else if (char.x >= maxX) {
            char.x = maxX; char.velX = -WALK_SPEED; char.facing = 'left';
            if (onGround && Math.random() < 0.35) { char.pauseTimer = rnd(500, 1800); char.velX = 0; }
        }
        if (char.velX > 0.1) char.facing = 'right';
        else if (char.velX < -0.1) char.facing = 'left';

        const fms = char.state === 'walk' ? WALK_MS : IDLE_MS;
        char.frameTimer += dt;
        if (char.frameTimer >= fms) { char.frame++; char.frameTimer = 0; }
    }

    // ─── Canvas setup ─────────────────────────────────────────────────────────
    function extraLeftPx(arena) {
        const arenaRect = arena.getBoundingClientRect();
        const emojiEl = document.querySelector('#hero h1 .hero-word:last-child');
        if (!emojiEl) return 0;
        const emojiRect = emojiEl.getBoundingClientRect();
        return Math.max(0, arenaRect.left - emojiRect.left);
    }

    function setup(canvas, arena) {
        const arenaW = arena.getBoundingClientRect().width || arena.offsetWidth || 280;
        const extra  = extraLeftPx(arena);
        CANVAS_W  = Math.max(arenaW + extra, SCALED_W + 20);
        leftBound = 0;  // canvas left edge sits at emoji position
        canvas.width          = CANVAS_W;
        canvas.height         = CANVAS_H;
        canvas.style.position = 'absolute';
        canvas.style.right    = '0';
        canvas.style.top      = '0';
        canvas.style.pointerEvents = 'none';
        ctx.imageSmoothingEnabled = false;
        groundY = 10;  // near the top — aligns character with the hero heading
        char.x  = Math.min(char.x, CANVAS_W - SCALED_W);
        char.y  = groundY;
    }

    // ─── Entry point ─────────────────────────────────────────────────────────
    function start() {
        const arena  = document.getElementById('pixel-hero-arena');
        const canvas = document.getElementById('pixel-hero-canvas');
        if (!arena || !canvas) return;

        ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Poll via rAF until arena has layout (handles both immediate and deferred cases)
        function tryInit(attempts) {
            const w = arena.getBoundingClientRect().width;
            if (w === 0 && attempts < 60) {
                requestAnimationFrame(() => tryInit(attempts + 1));
                return;
            }
            setup(canvas, arena);

            if (prefersReducedMotion) {
                char.state = 'idle';
                render();
                return;
            }

            // ResizeObserver for responsive canvas
            if (window.ResizeObserver) {
                const ro = new ResizeObserver(() => {
                    const newArenaW = arena.getBoundingClientRect().width;
                    if (newArenaW > 0) {
                        const extra   = extraLeftPx(arena);
                        const newTotalW = newArenaW + extra;
                        if (Math.abs(newTotalW - CANVAS_W) > 2) {
                            CANVAS_W = newTotalW;
                            canvas.width = CANVAS_W;
                            char.x = Math.min(char.x, CANVAS_W - SCALED_W);
                        }
                    }
                });
                ro.observe(arena);
            }

            let lastTime = 0;
            function loop(ts) {
                if (!lastTime) lastTime = ts;
                const dt = Math.min(ts - lastTime, 48);
                lastTime = ts;
                update(dt);
                render();
                requestAnimationFrame(loop);
            }
            requestAnimationFrame(loop);
        }

        requestAnimationFrame(() => tryInit(0));
    }

    // Trigger on load (guaranteed layout) or immediately if already complete
    if (document.readyState === 'complete') {
        start();
    } else {
        window.addEventListener('load', start);
    }
})();
