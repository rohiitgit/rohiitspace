(function () {
    // ─── The volleyball rally ─────────────────────────────────────────────────
    // A second, self-contained scroll story (independent of the cliff story in
    // pixel-character.js). Two original pixel athletes: a server (#9, back to
    // the viewer) on the about→experience line, a spiker (#10, facing the
    // viewer) on the experience→projects line. As the page scrolls: a ball
    // arcs in from the left → the server catches and serves it → it travels
    // down the experience timeline → the spiker leaps and spikes it at the
    // camera → scroll locks while the ball zooms up to fill the screen, then
    // releases and the page continues.
    //
    // Narrative motion is a pure function of scrollY (reversible); only the
    // final screen-fill is a one-shot time-based lock. Ball spin is time-based.

    let S = 3;                          // canvas-px per base-pixel (2 mobile / 3 desktop)

    // ─── Palette ──────────────────────────────────────────────────────────────
    const C = {
        sk: '#e0a878', skD: '#c48858', eye: '#101418',
        hbk: '#161616', hbkL: '#2c2c2c',                   // black hair
        hor: '#e8721e', horL: '#ff9d47',                   // orange hair
        sh: '#1a2236', shL: '#28324e', sock: '#e8ebef', shoe: '#12161f',
        // both players wear the same dark navy team kit; only the number differs
        j9: '#1e2740', j9L: '#33436b', j9N: '#eef2fa',     // server (#9)
        j10: '#1e2740', j10L: '#33436b', j10N: '#eef2fa',  // spiker (#10)
        // paneled volleyball: white + red + green vertical segments
        bw: '#f4f4f0', bwS: '#d7d9dc', br: '#c9403a', bg: '#3aa657', bl: '#1c1f24',
        fl: '#ffffff',                                      // finale flash
    };

    // ─── Pixel helpers ──────────────────────────────────────────────────────
    function r(k, bx, by, bw, bh) { return [k, bx, by, bw, bh]; }
    function clamp01(t) { return t < 0 ? 0 : (t > 1 ? 1 : t); }
    function smooth(t) { t = clamp01(t); return t * t * (3 - 2 * t); }
    function lerp(a, b, t) { return a + (b - a) * t; }

    function draw(g, rects, cx, cy) {
        for (const [k, bx, by, bw, bh] of rects) {
            g.fillStyle = C[k];
            g.fillRect(cx + bx * S, cy + by * S, bw * S, bh * S);
        }
    }
    // ─── Pixel digit font (3×5), for jersey numbers ──────────────────────────
    const DIGITS = {
        0: [[0, 0, 3, 1], [0, 4, 3, 1], [0, 1, 1, 3], [2, 1, 1, 3]],
        1: [[1, 0, 1, 5], [0, 1, 1, 1], [0, 4, 3, 1]],
        9: [[0, 0, 3, 1], [0, 1, 1, 2], [2, 1, 1, 4], [0, 2, 3, 1], [0, 4, 3, 1]],
    };
    function digit(g, n, cx, cy, col) {
        g.fillStyle = C[col];
        for (const [x, y, w, h] of DIGITS[n]) g.fillRect(cx + x * S, cy + y * S, w * S, h * S);
    }

    // ─── Server sprite (jersey 9), authored facing AWAY (back to viewer) ─────
    // 12 wide × 18 tall base grid; feet at y18.
    // smooth black hair over the back of the head (server faces away).
    // origin-relative to the head block at the given headTop y.
    const blackHair = (hy) => [
        r('hbk', 4, hy, 4, 3),                        // covers the crown
        r('hbkL', 4, hy, 4, 1),                       // sheen
        r('hbk', 3, hy, 1, 3), r('hbk', 8, hy, 1, 3), // sides
        r('hbk', 4, hy + 3, 4, 1),                    // falls to the nape
    ];
    const SERVER_STAND = [
        r('sk', 4, 0, 4, 3),                          // back of head
        ...blackHair(0),
        r('sk', 4, 3, 4, 1),                          // neck
        r('j9', 3, 4, 6, 7), r('j9L', 3, 4, 1, 7), r('j9L', 8, 4, 1, 7), // jersey
        r('sk', 2, 5, 2, 5), r('sk', 8, 5, 2, 5),     // arms at sides
        r('sh', 3, 11, 6, 3), r('shL', 3, 11, 6, 1),  // shorts
        r('sk', 3, 14, 2, 2), r('sk', 7, 14, 2, 2),   // thighs
        r('sock', 3, 16, 2, 1), r('sock', 7, 16, 2, 1),
        r('shoe', 3, 17, 3, 1), r('shoe', 6, 17, 3, 1),
    ];
    const SERVER_CROUCH = [
        r('sk', 4, 2, 4, 3),
        ...blackHair(2),
        r('sk', 4, 5, 4, 1),
        r('j9', 3, 6, 6, 6), r('j9L', 3, 6, 1, 6), r('j9L', 8, 6, 1, 6),
        // both arms raised forward, cupped to receive
        r('sk', 2, 3, 2, 3), r('sk', 8, 3, 2, 3),
        r('sk', 2, 3, 8, 1),
        r('sh', 3, 12, 6, 3), r('shL', 3, 12, 6, 1),
        r('sk', 3, 15, 2, 2), r('sk', 7, 15, 2, 2),   // bent legs
        r('shoe', 2, 17, 3, 1), r('shoe', 7, 17, 3, 1),
    ];
    // Jump + BOTH arms raised high to serve overhead with two hands.
    const SERVER_SERVE = [
        r('sk', 4, 1, 4, 3),
        ...blackHair(1),
        r('sk', 4, 4, 4, 1),
        r('j9', 3, 5, 6, 6), r('j9L', 3, 5, 1, 6), r('j9L', 8, 5, 1, 6),
        r('sk', 2, -4, 2, 10),                        // left arm raised high
        r('sk', 8, -4, 2, 10),                        // right arm raised high
        r('sk', 2, -4, 8, 1),                         // hands meet overhead
        r('sh', 3, 11, 6, 3), r('shL', 3, 11, 6, 1),
        r('sk', 3, 14, 2, 3), r('sk', 7, 14, 2, 3),   // legs tucked
        r('shoe', 3, 17, 3, 1), r('shoe', 6, 17, 3, 1),
    ];

    // ─── Spiker sprite (jersey 10), authored facing the VIEWER (front) ───────
    // Orange hair over the crown with a small centre fringe and sideburns
    // framing the face. Head top is at hy; eyes sit at hy+1 (x4 and x7).
    const orangeHair = (hy) => [
        r('hor', 4, hy, 4, 1), r('horL', 5, hy, 2, 1),   // crown + highlight
        r('hor', 5, hy + 1, 2, 1),                       // centre fringe (between the eyes)
        r('hor', 3, hy, 1, 2), r('hor', 8, hy, 1, 2),    // sideburns down the sides
    ];
    const SPIKER_STAND = [
        r('sk', 4, 0, 4, 3),
        ...orangeHair(0),
        r('eye', 4, 1, 1, 1), r('eye', 7, 1, 1, 1),   // eyes
        r('sk', 4, 3, 4, 1),
        r('j10', 3, 4, 6, 7), r('j10L', 3, 4, 1, 7), r('j10L', 8, 4, 1, 7),
        r('sk', 2, 5, 2, 5), r('sk', 8, 5, 2, 5),
        r('sh', 3, 11, 6, 3), r('shL', 3, 11, 6, 1),
        r('sk', 3, 14, 2, 2), r('sk', 7, 14, 2, 2),
        r('sock', 3, 16, 2, 1), r('sock', 7, 16, 2, 1),
        r('shoe', 3, 17, 3, 1), r('shoe', 6, 17, 3, 1),
    ];
    const SPIKER_CROUCH = [
        r('sk', 4, 2, 4, 3),
        ...orangeHair(2),
        r('eye', 4, 3, 1, 1), r('eye', 7, 3, 1, 1),
        r('sk', 4, 5, 4, 1),
        r('j10', 3, 6, 6, 6), r('j10L', 3, 6, 1, 6), r('j10L', 8, 6, 1, 6),
        r('sk', 1, 8, 2, 3), r('sk', 9, 8, 2, 3),     // arms swung back/low
        r('sh', 3, 12, 6, 3), r('shL', 3, 12, 6, 1),
        r('sk', 2, 15, 2, 2), r('sk', 8, 15, 2, 2),   // deep knee bend, knees out
        r('shoe', 1, 17, 3, 1), r('shoe', 8, 17, 3, 1),
    ];
    // Extreme high jump, hitting arm raised (spike); legs extended down + tucked.
    const SPIKER_SPIKE = [
        r('sk', 4, 3, 4, 3),
        ...orangeHair(3),
        r('eye', 4, 4, 1, 1), r('eye', 7, 4, 1, 1),
        r('sk', 4, 6, 4, 1),
        r('j10', 3, 7, 6, 6), r('j10L', 3, 7, 1, 6), r('j10L', 8, 7, 1, 6),
        r('sk', 2, 8, 2, 4),                          // off arm
        r('sk', 8, -3, 2, 11),                        // hitting arm raised high
        r('sh', 3, 13, 6, 2), r('shL', 3, 13, 6, 1),
        r('sk', 4, 15, 2, 3), r('sk', 6, 15, 2, 3),   // legs extended down, tucked
        r('shoe', 4, 18, 2, 1), r('shoe', 6, 18, 2, 1),
    ];

    // ─── Volleyball panels: which color leads each spin frame (middle white) ──
    const BALL_PANELS = [
        ['br', 'bg'],   // red left, green right
        ['bg', 'br'],   // swapped
        ['br', 'bg'],
    ];

    // ─── Sprite draw wrappers ─────────────────────────────────────────────────
    function drawServer(g, cx, cy, state) {
        let rects = SERVER_STAND, numY = 6;
        if (state === 'crouch') { rects = SERVER_CROUCH; numY = 8; }
        else if (state === 'serve') { rects = SERVER_SERVE; numY = 7; }
        draw(g, rects, cx, cy);
        digit(g, 9, cx + 5 * S, cy + numY * S, 'j9N');   // number on the back
    }
    function drawSpiker(g, cx, cy, state) {
        let rects = SPIKER_STAND, numY = 6;
        if (state === 'crouch') { rects = SPIKER_CROUCH; numY = 8; }
        else if (state === 'spike') { rects = SPIKER_SPIKE; numY = 9; }
        draw(g, rects, cx, cy);
        // number 10 on the chest (two digits)
        digit(g, 1, cx + 3 * S, cy + numY * S, 'j10N');
        digit(g, 0, cx + 6 * S, cy + numY * S, 'j10N');
    }
    // Rally ball — same detailed geometry as the finale ball, just small.
    function drawBall(g, cx, cy, mult, spin) {
        drawBigBall(g, cx, cy, 4 * S * mult, spin);
    }

    // Big paneled ball for the finale zoom — white/red/green vertical panels
    // with a dark outline, drawn as geometry with smooth (antialiased) edges.
    function drawBigBall(g, cx, cy, radius, spin) {
        const [lc, rc] = BALL_PANELS[spin % 3];
        g.save();
        g.beginPath();
        g.arc(cx, cy, radius, 0, Math.PI * 2);
        g.clip();                                    // confine panels to the disc
        g.fillStyle = C.bw;
        g.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
        // curved vertical panels: left color, white center, right color
        g.fillStyle = C[lc];
        g.beginPath();
        g.ellipse(cx - radius * 0.55, cy, radius * 0.5, radius, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = C[rc];
        g.beginPath();
        g.ellipse(cx + radius * 0.55, cy, radius * 0.5, radius, 0, 0, Math.PI * 2);
        g.fill();
        // soft shading on the lower-right for volume
        g.fillStyle = 'rgba(0,0,0,0.10)';
        g.beginPath();
        g.arc(cx + radius * 0.35, cy + radius * 0.35, radius * 0.7, 0, Math.PI * 2);
        g.fill();
        // panel seams — stroked while STILL clipped to the disc so they can't
        // spill past the ball's edge
        g.strokeStyle = C.bl;
        g.lineWidth = Math.max(2, radius * 0.05);
        for (const dir of [-1, 1]) {
            g.beginPath();
            g.ellipse(cx + dir * radius * 0.28, cy, radius * 0.28, radius, 0, -Math.PI / 2, Math.PI / 2, dir < 0);
            g.stroke();
        }
        g.restore();                                 // end clip
        // outer outline traces the circle exactly, so it's safe unclipped
        g.beginPath();
        g.arc(cx, cy, radius, 0, Math.PI * 2);
        g.stroke();
    }

    // ─── State ────────────────────────────────────────────────────────────────
    let overlay, octx;
    let docH = 0, maxScroll = 1, darkNow = null;
    let flowT = 0;
    let reduced = false;
    const A = { serverY: 0, spikerY: 0, expTop: 0, expBot: 0 };

    const isDark = () => document.documentElement.classList.contains('dark');

    // The separator band is 40px tall with lines at its top and bottom edges —
    // players stand on the UPPER line. Find the separator right after a section.
    function sepLineDocY(section, sy) {
        let el = section.nextElementSibling;
        while (el && !el.classList.contains('section-separator')) el = el.nextElementSibling;
        if (!el) return section.getBoundingClientRect().bottom + sy;
        return el.getBoundingClientRect().top + sy;   // ::before (top line)
    }

    // ─── Anchors (document-Y; sections animate height so read live) ──────────
    function computeAnchors() {
        const sy = window.scrollY;
        const about = document.getElementById('about');
        const exp = document.getElementById('experience');
        if (!about || !exp) return;
        A.serverY = sepLineDocY(about, sy);   // about→experience line
        A.spikerY = sepLineDocY(exp, sy);     // experience→projects line
        const er = exp.getBoundingClientRect();
        A.expTop = er.top + sy;
        A.expBot = er.bottom + sy;
        // the timeline's actual fillable span (first item top → last item
        // bottom), in doc-Y — the ball descends across exactly this so the fill
        // tracks it 1:1 with no dead zone before the first item
        const items = document.querySelectorAll('.timeline-item');
        if (items.length) {
            A.railTop = items[0].getBoundingClientRect().top + sy;
            A.railBot = items[items.length - 1].getBoundingClientRect().bottom + sy;
        } else {
            A.railTop = A.expTop;
            A.railBot = A.expBot;
        }
    }

    // Drive the timeline bars from the ball's document-Y — the ball is the
    // single source of truth. The whole rail is treated as ONE continuous span
    // (first item's top → last item's bottom), so the fill tracks the ball's
    // descent 1:1 with no per-item dead zones or catch-up jumps.
    function fillBarsToBall(ballDocY) {
        const sy = window.scrollY;
        const items = [...document.querySelectorAll('.timeline-item')];
        if (!items.length) return;
        for (const item of items) {
            const bar = item.querySelector('.timeline-item-progress');
            if (!bar) continue;
            const r = item.getBoundingClientRect();
            const top = r.top + sy, h = r.height || 1;
            // fraction of THIS item the ball has passed (each item's bar fills as
            // the ball's continuous descent crosses that item's own span)
            const pct = clamp01((ballDocY - top) / h) * 100;
            bar.style.height = pct + '%';
        }
    }

    function railXNow() {
        // per-frame: viewport-X of the fill line's CENTER, so the ball (drawn
        // centered on this x) sits with the line through its middle. Measure
        // the actual `.timeline-item-progress` bar rather than assuming its
        // offset — in layout it renders at the item's left edge, 2px wide, so
        // its centre is item.left + 1.
        const bar = document.querySelector('.timeline-item-progress');
        if (bar) {
            const r = bar.getBoundingClientRect();
            return r.left + r.width / 2;
        }
        const tl = document.querySelector('.timeline-item') ||
                   document.querySelector('.timeline-container') ||
                   document.getElementById('experience');
        if (!tl) return window.innerWidth * 0.2;
        return tl.getBoundingClientRect().left + 1;
    }

    // The finale occupies a long scroll range (see FIN below) so the ball's
    // zoom-toward-viewer is spread over a lot of scrolling — the story visibly
    // slows to a crawl there and the content behind barely moves per wheel
    // tick, without hijacking the scroll engine. Fully reversible: the ball's
    // scale is a pure function of scrollY.

    // ─── Per-frame render (positions in overlay/viewport CSS px) ─────────────
    function renderStory() {
        const g = octx;
        const vw = overlay.width, vh = overlay.height;
        g.clearRect(0, 0, vw, vh);

        const s = window.scrollY;
        const spin = Math.floor(flowT * 6);

        // ── scroll-driven rally ──
        const serverFeetV = A.serverY - s;
        const spikerFeetV = A.spikerY - s;
        // stand on the full-width separator lines, out in the left margin so
        // the players are clear of the centered content column
        const contentLeft = Math.max(0, vw / 2 - 512);    // max-w-4xl left edge
        const serverX = Math.max(12 * S, contentLeft - 20 * S);
        const spikerX = Math.max(12 * S, contentLeft - 20 * S);
        A.serverX0 = serverX; A.spikerX0 = spikerX;
        const serverTop = serverFeetV - 18 * S;            // sprite top-left y
        const spikerTop = spikerFeetV - 18 * S;
        const serverHand = { x: serverX + 9 * S, y: serverTop - 4 * S };

        // phase thresholds derived from anchors
        const P0 = A.serverY - vh * 0.85;   // ball enters
        const P1 = A.serverY - vh * 0.55;   // into hands
        const P2 = A.serverY - vh * 0.45;   // toss done
        const P3 = A.serverY - vh * 0.35;   // serve
        const P4 = A.spikerY - vh * 0.55;   // travel end / spike start
        const P5 = A.spikerY - vh * 0.42;   // spike contact
        // FINALE: ball zooms toward the viewer as a pure function of scroll,
        // then clears once it has filled the screen (a short range so it
        // doesn't linger over the sections below). Fully reversible.
        const FIN = vh * 0.9;
        const P6 = P5 + FIN;                // ball has filled the screen

        let ballX = null, ballY = null;
        let serverState = 'stand', spikerState = 'stand';

        // Timeline bars follow the ball (single source of truth): before the
        // ball reaches the rail → empty; while travelling → up to the ball;
        // once spiked/past → full. Runs every frame so state is consistent
        // whether scrolling down or back up.
        if (s < P3) fillBarsToBall(-Infinity);          // ball not on the rail yet
        else if (s >= P4) fillBarsToBall(Infinity);     // ball has passed → bars full
        // (during TRAVEL, P3..P4, the bar is filled to the live ballY below)

        if (s < P0) {
            // pre-story: players wait
        } else if (s < P1) {
            // ENTER — ball arcs in from the left toward the server's hands
            const t = smooth((s - P0) / (P1 - P0));
            const x0 = -8 * S, y0 = serverHand.y - vh * 0.15;
            ballX = lerp(x0, serverHand.x, t);
            ballY = lerp(y0, serverHand.y, t) - vh * 0.18 * 4 * t * (1 - t);
        } else if (s < P2) {
            // TOSS — ball settles into cupped hands; server crouches
            const t = smooth((s - P1) / (P2 - P1));
            serverState = 'crouch';
            ballX = serverHand.x;
            ballY = lerp(serverHand.y, serverHand.y + 2 * S, t);
        } else if (s < P3) {
            // SERVE — server jumps, one arm up; ball launches up toward the rail
            const t = smooth((s - P2) / (P3 - P2));
            const jump = Math.sin(t * Math.PI) * vh * 0.06;   // reversible jump
            drawServer(g, serverX, serverTop - jump, 'serve');
            const rx = railXNow();
            ballX = lerp(serverHand.x, rx, t);
            // land the ball at the rail TOP (where TRAVEL begins) so the serve
            // flows straight into the descent with no snap
            ballY = lerp(serverHand.y - jump - 6 * S, A.railTop - s, t) - vh * 0.1 * 4 * t * (1 - t);
            drawBall(g, ballX, ballY, 1, spin);
            drawSpiker(g, spikerX, spikerTop, 'stand');
            return;
        } else if (s < P4) {
            // TRAVEL — ball descends across the timeline's fillable span
            // (railTop → railBot) so the ball and the bar it drives move in
            // lockstep, 1:1, with no pre-first-item dead zone.
            const t = smooth((s - P3) / (P4 - P3));
            ballX = railXNow();
            const ballDocY = lerp(A.railTop, A.railBot, t);
            ballY = ballDocY - s;
            fillBarsToBall(ballDocY);                  // fill tracks the ball exactly
        } else if (s < P5) {
            // SPIKE — spiker leaps; the ball travels DIRECTLY from where TRAVEL
            // left it (bottom of the fill bar, at the rail x) to the spike
            // contact point, so there's no sideways-then-up dogleg. Both ends
            // match their neighbours exactly (railBot→FINALE's spikeX/spikeY).
            const t = smooth((s - P4) / (P5 - P4));
            const jump = smooth(clamp01((t - 0.35) / 0.65)) * vh * 0.14; // higher than normal
            spikerState = t < 0.35 ? 'crouch' : 'spike';
            drawSpiker(g, spikerX, spikerTop - jump, spikerState);
            const from = { x: railXNow(), y: A.railBot - s };          // TRAVEL end
            const to = { x: spikerX + 8 * S, y: spikerTop - vh * 0.14 - 3 * S }; // FINALE start
            ballX = lerp(from.x, to.x, t);
            ballY = lerp(from.y, to.y, t);
            drawBall(g, ballX, ballY, 1, spin);
            drawServer(g, serverX, serverTop, 'stand');
            return;
        } else if (s < P6) {
            // FINALE — ball accelerates toward the viewer, scaling up to fill
            // the screen. Scroll-driven and reversible; background is damped.
            const z = clamp01((s - P5) / (P6 - P5));
            const e = z * z;                              // ease-in: accelerates at the camera
            // Ball is spiked UP toward the top of the screen, then falls toward
            // the viewer (growing) — so it feels like it went up and is now
            // coming down onto you. cy rises to near the top early, then the
            // scale-up does the "falling at the camera".
            const spikeX = spikerX + 8 * S, spikeY = spikerTop - vh * 0.14 - 3 * S;
            const up = smooth(clamp01(z / 0.25));         // reaches the top quickly
            const cx = lerp(spikeX, vw / 2 + (0.5 - e) * 40 * S, up); // slight swing
            const cy = lerp(spikeY, vh * 0.14, up);       // spiked toward the TOP
            // fade-out begins when the ball's diameter covers about HALF the
            // screen height (radius ≈ vh/4), then runs to the end: it keeps
            // zooming into its white center while opacity drops to 0, so it
            // dissolves naturally (camera passing through it), not a snap.
            const baseR = lerp(4 * S, Math.max(vw, vh) * 0.85, e);
            const fade = smooth(clamp01((baseR - vh * 0.25) / (vh * 0.35)));
            const radius = baseR * (1 + fade * 1.6);
            // players stay near their spots but drift away for depth (parallax),
            // clamped so they don't chase the scroll off-screen
            const spikerNowTop = Math.max(-vh * 0.3, spikerTop - vh * 0.14);
            const serverNowTop = Math.max(-vh * 0.3, serverTop);
            const drift = e * vh * 0.12;
            g.globalAlpha = clamp01(1 - e * 1.4);          // fade players as ball takes over
            drawServer(g, serverX, serverNowTop + drift, 'serve');
            drawSpiker(g, spikerX, spikerNowTop + drift, 'spike');
            g.globalAlpha = 1 - fade;                      // dissolve the ball at the end
            drawBigBall(g, cx, cy, radius, spin);
            g.globalAlpha = 1;
            return;
        } else {
            // past the finale — story done, overlay clear
            return;
        }

        // default draw: both players standing + ball (if any)
        drawServer(g, serverX, serverTop, serverState);
        drawSpiker(g, spikerX, spikerTop, spikerState);
        if (ballX !== null) drawBall(g, ballX, ballY, 1, spin);
    }

    // ─── Static tableau for reduced motion ────────────────────────────────────
    function drawStill() {
        const g = octx, s = window.scrollY;
        g.clearRect(0, 0, overlay.width, overlay.height);
        const serverX = overlay.width * 0.44;
        drawServer(g, serverX, (A.serverY - s) - 18 * S, 'crouch');
        drawSpiker(g, serverX, (A.spikerY - s) - 18 * S, 'stand');
        drawBall(g, serverX + 9 * S, (A.serverY - s) - 22 * S, 1, 0);
    }

    // ─── Setup / loop / init ──────────────────────────────────────────────────
    function setupOverlay() {
        S = window.innerWidth < 640 ? 2 : 3;
        overlay.width = window.innerWidth;
        overlay.height = window.innerHeight;
        // left on: pixel sprites use fillRect (unaffected), and the finale ball
        // wants smooth antialiased curves
        octx.imageSmoothingEnabled = true;
    }
    function refreshDoc() {
        docH = document.body.offsetHeight;
        maxScroll = Math.max(1, docH - window.innerHeight);
        computeAnchors();
    }

    function start() {
        overlay = document.createElement('canvas');
        overlay.className = 'pixel-overlay-vb';
        overlay.setAttribute('aria-hidden', 'true');
        document.body.appendChild(overlay);
        octx = overlay.getContext('2d');
        reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function tryInit(attempts) {
            const about = document.getElementById('about');
            const w = about ? about.getBoundingClientRect().width : 0;
            if (w === 0 && attempts < 60) {
                requestAnimationFrame(() => tryInit(attempts + 1));
                return;
            }
            darkNow = isDark();
            setupOverlay();
            refreshDoc();

            if (reduced) {
                const still = () => { computeAnchors(); drawStill(); };
                window.addEventListener('scroll', still, { passive: true });
                window.addEventListener('resize', () => { setupOverlay(); computeAnchors(); still(); });
                still();
                return;
            }

            if (window.ResizeObserver) {
                new ResizeObserver(refreshDoc).observe(document.body);
            }
            window.addEventListener('resize', () => { setupOverlay(); refreshDoc(); });
            if (document.fonts?.ready instanceof Promise) {
                document.fonts.ready.then(refreshDoc);
            }

            let lastTime = 0;
            function loop(ts) {
                if (!lastTime) lastTime = ts;
                const dt = Math.min(ts - lastTime, 48);
                lastTime = ts;
                flowT += dt / 1000;
                if (isDark() !== darkNow) darkNow = isDark();
                renderStory();
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
