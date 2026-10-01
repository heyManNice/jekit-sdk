'use strict';
// 分镜：给定时间 t，计算这一帧的全部粒子、文字与后期参数。
// 不保存任何帧间状态 —— 同一个 t 永远得到同一帧。
//
// 坐标约定：世界坐标以屏幕中心为原点、y 轴向下、单位为像素（1920×1080 画布）。

J.Film = (() => {
    const U = J.util;
    const S = J.score;
    const { lerp, prog, smooth, ease, rng, gauss, hash, pulse, mix3 } = U;

    const W = 1920;
    const H = 1080;
    const HW = W / 2;
    const HH = H / 2;

    const SANS = '"PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei UI", "Microsoft YaHei", "Noto Sans SC", system-ui, sans-serif';
    const MONO = '"JetBrains Mono", "Cascadia Code", "SF Mono", Consolas, "Microsoft YaHei", monospace';

    // 线性空间、可超过 1（交给泛光）
    const C = {
        cyan: [0.22, 1.0, 0.95],
        ice: [0.8, 1.15, 1.2],
        hot: [1.6, 1.75, 1.75],
        warm: [1.35, 0.36, 0.07],
        ember: [0.85, 0.14, 0.03],
        purple: [0.72, 0.3, 1.4],
        grey: [0.3, 0.3, 0.33],
        halo: [0.02, 0.075, 0.08],
    };
    const TXT = {
        white: '#f2fdff',
        cyan: '#6ff5ee',
        dim: 'rgba(214, 238, 242, 0.58)',
        warm: '#ffa56a',
        warmSoft: '#ffcaa0',
        purple: '#d6b4ff',
    };

    const BYTE_GAP = 114;
    const BYTE_Y = 40;
    const LOGO_Y = -95;
    const LOGO_W = 620;

    // 来源支流的纵向位置（与 score.channels 顺序一致）
    const TRIB_Y = [-300, -205, -110, -15, 80, 175, 260, 340];

    let batch = null;
    let overlay = null;
    let ctx = null;
    let logoImg = null;
    let logoH = 0;
    let T = 0;
    const cam = { x: 0, y: 0, z: 1, sx: 0, sy: 0 };

    // ---------------------------------------------------------------- 种子

    const R = rng(2026);

    const dust = Array.from({ length: 1500 }, () => ({
        x: (R() * 2 - 1) * 1150,
        y: (R() * 2 - 1) * 650,
        z: 0.35 + R() * 1.3,
        vx: (R() - 0.5) * 16,
        vy: (R() - 0.5) * 10 - 4,
        ph: R() * 6.283,
        tw: 0.4 + R() * 2.2,
    }));

    const burden = [];
    S.words.forEach((_, i) => {
        for (let k = 0; k < 70; k++) {
            burden.push({
                w: i,
                th: R() * 6.283,
                r: 20 + Math.abs(gauss(R)) * 60,
                om: (R() < 0.5 ? -1 : 1) * (0.4 + R() * 1.3),
                s: 2.2 + R() * 4.4,
                d: 0.32 + R() * 0.4,
                sp: (R() * 2 - 1) * 0.45,
                ph: R() * 100,
                vx: 0.5 + R() * 1.0,
                vy: gauss(R),
                ember: R(),
            });
        }
    });

    const sparks = Array.from({ length: 460 }, () => ({
        a: R() * 6.283,
        v: 260 + R() ** 2 * 1800,
        s: 1.6 + R() * 3.6,
        k: 1.8 + R() * 2.8,
        mix: R(),
    }));

    const river = Array.from({ length: 11000 }, (_, i) => ({
        u: R(),
        v: 0.75 + R() * 0.5,
        g: gauss(R),
        j: i % 8,
        s: 1.4 + R() * 2.7,
        a: 0.25 + R() * 0.75,
        ph: R() * 6.283,
    }));

    let logoPts = [];

    // ---------------------------------------------------------------- 时间函数

    // 负担段使用的"可冻结时间"：静默期间画面停住，11.5 起随吸入声重新流动
    const freeze = t => (t < 10 ? t : t < 11.5 ? 10 : t - 1.5);

    const layerOf = i => (i < 4 ? 0 : i < 8 ? 1 : i < 11 ? 2 : 3);

    function burdenAmt(tb) {
        let s = 0;
        for (const w of S.words) s += prog(tb, w.t, 0.4);
        return s / S.words.length;
    }

    // 穿越边界时，尘埃整体高速左移以表现前进
    const dustRate = t => 900 * smooth(11.4, 12.0, t) * (1 - smooth(13.7, 14.6, t));
    const dustX = U.warp(dustRate, 0, 36);

    // 河流的流速：汇入瞬间最快，随后放缓
    const riverT = U.warp(t => 0.3 + 1.7 * Math.exp(-Math.max(0, t - 18) * 1.3), 17, 26);

    const sinuousY = (x, t) => 70 * Math.sin(x * 0.004 + t * 0.9 + 0.3) + 38 * Math.sin(x * 0.0093 - t * 1.25);
    const trendY = x => 165 - ((x + 1250) / 2500) * 390 + 30 * Math.sin(x * 0.012 + 0.5) + 16 * Math.sin(x * 0.034 + 1.3);
    const trendMix = t => ease.inOutCubic(prog(t, 19.8, 1.5));

    function hero(t) {
        const x = -230 + (t - 18) * 150;
        return [x, lerp(sinuousY(x, t), trendY(x), trendMix(t))];
    }

    // ---------------------------------------------------------------- 绘制基础

    function toScreen(x, y) {
        return [(x - cam.x) * cam.z + cam.sx + HW, (y - cam.y) * cam.z + cam.sy + HH];
    }

    // 以世界坐标绘制粒子
    function P(x, y, s, a, c, shape = 0) {
        batch.push((x - cam.x) * cam.z + cam.sx, (y - cam.y) * cam.z + cam.sy, s * cam.z, a, c, shape);
    }

    class Batch {
        constructor(max) {
            this.max = max;
            this.buf = new Float32Array(max * 8);
            this.n = 0;
        }
        reset() {
            this.n = 0;
        }
        push(x, y, s, a, c, shape) {
            if (this.n >= this.max || a <= 0.002 || s <= 0.1) return;
            const h = s * 0.5;
            if (x < -HW - h || x > HW + h || y < -HH - h || y > HH + h) return;
            const o = this.n * 8;
            const b = this.buf;
            b[o] = x;
            b[o + 1] = y;
            b[o + 2] = s;
            b[o + 3] = a;
            b[o + 4] = c[0];
            b[o + 5] = c[1];
            b[o + 6] = c[2];
            b[o + 7] = shape;
            this.n++;
        }
    }

    // ---------------------------------------------------------------- 文字

    const widthCache = new Map();
    function charWidth(font, ch) {
        const key = font + '\u0000' + ch;
        let w = widthCache.get(key);
        if (w === undefined) {
            ctx.font = font;
            w = ctx.measureText(ch).width;
            widthCache.set(key, w);
        }
        return w;
    }

    function measure(str, o) {
        const font = `${o.weight || 400} ${o.size || 40}px ${o.font || SANS}`;
        const chars = Array.from(str);
        const ws = chars.map(ch => charWidth(font, ch));
        const total = ws.reduce((a, b) => a + b, 0) + (o.spacing || 0) * Math.max(0, chars.length - 1);
        return { font, chars, ws, total };
    }

    // 逐字出现/消散：每个字带模糊、位移与透明度
    // 坐标为屏幕中心原点；o.screen 为 true 时表示已是屏幕坐标（左上原点）
    function drawText(str, x, y, o) {
        const m = measure(str, o);
        const sp = o.spacing || 0;
        const align = o.align || 'center';
        let cx = (o.screen ? x : x + HW) - (align === 'center' ? m.total / 2 : align === 'right' ? m.total : 0);
        const cy = o.screen ? y : y + HH;
        const t0 = o.t0 ?? 0;
        const stagger = o.stagger ?? 0.035;
        const dur = o.dur ?? 0.55;
        const out = o.out ?? null;
        const outDur = o.outDur ?? 0.35;
        const rise = o.rise ?? 18;
        const blurIn = o.blur ?? 12;
        const alpha = o.alpha ?? 1;

        ctx.font = m.font;
        ctx.fillStyle = o.color || TXT.white;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';

        for (let i = 0; i < m.chars.length; i++) {
            const start = o.at ? o.at(i) : t0 + i * stagger;
            const k = ease.outCubic(prog(T, start, dur));
            const q = out === null ? 0 : ease.inCubic(prog(T, out + i * stagger * 0.4, outDur));
            const a = k * (1 - q) * alpha;
            if (a > 0.003) {
                const blur = (1 - k) * blurIn + q * 14;
                ctx.filter = blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : 'none';
                ctx.globalAlpha = a;
                ctx.fillText(m.chars[i], cx + q * (i - m.chars.length / 2) * 6, cy + (1 - k) * rise - q * 10);
            }
            cx += m.ws[i] + sp;
        }
        ctx.filter = 'none';
        ctx.globalAlpha = 1;
        return m.total;
    }

    // ---------------------------------------------------------------- 镜头与后期

    function setCamera(t) {
        let x = 0;
        let y = 0;
        let z = 1;
        if (t < 4) z = lerp(0.9, 1.0, ease.inOutSine(prog(t, 0, 4)));
        else if (t < 10) z = lerp(1.0, 1.16, ease.inOutSine(prog(t, 4, 6)));
        else if (t < 12) z = 1.16;
        else if (t < 14) z = lerp(1.16, 1.0, ease.outExpo(prog(t, 12, 0.7)));
        else if (t < 18) z = lerp(1.0, 1.06, ease.inOutSine(prog(t, 14, 4)));
        else if (t < 24) {
            const k = ease.outQuart(prog(t, 18, 1.7));
            const h = hero(t);
            z = lerp(2.4, 1.0, k);
            x = lerp(h[0], 0, k);
            y = lerp(h[1], 0, k);
        } else if (t < 28) z = lerp(1.0, 1.08, ease.inOutSine(prog(t, 24, 4)));
        else z = lerp(1.05, 1.0, ease.outCubic(prog(t, 28, 3)));

        let sh = 0;
        for (const m of S.impacts) {
            const d = t - m.t;
            if (d >= 0 && d < 1.5) sh += m.shake * 34 * Math.exp(-d * 6.5);
        }
        if (t < 10) sh += burdenAmt(t) ** 2 * 5;

        cam.x = x;
        cam.y = y;
        cam.z = z;
        cam.sx = sh * (Math.sin(t * 71.3) * 0.6 + Math.sin(t * 113.7) * 0.4);
        cam.sy = sh * (Math.cos(t * 89.1) * 0.6 + Math.sin(t * 57.3) * 0.4);
    }

    function makePost(t) {
        const tb = freeze(t);
        const b = t < 12 ? burdenAmt(tb) : 0;

        let flash = 0;
        let hit = 0;
        let glitch = 0;
        for (const m of S.impacts) {
            const d = t - m.t;
            if (d < 0 || d > 3) continue;
            flash += m.flash * Math.exp(-d * 9);
            hit += m.s * Math.exp(-d * 5);
            if (d < 0.1) glitch += m.s * 0.5;
        }

        const silent = t >= 10 && t < 12;
        const regain = silent ? prog(t, 11.5, 0.5) : 1;

        let exposure = 1.0 + pulse(t, S.kicks, 9) * 0.06;
        let sat = 1.0;
        if (silent) {
            exposure = lerp(0.4, 0.75, ease.inCubic(regain));
            sat = lerp(0.0, 0.5, regain);
        } else if (t < 10) {
            sat = 1 + b * 0.15;
            const burst = hash(Math.floor(t * 14)) > 0.72 ? 1 : 0.1;
            glitch += b ** 3 * 0.75 * burst;
        }

        let amb = 0.12;
        let tint = [0.04, 0.16, 0.18];
        if (t < 12) {
            amb = 0.1 + b * 0.3;
            tint = mix3([0.04, 0.16, 0.18], [0.36, 0.1, 0.02], b);
        } else if (t < 18) amb = 0.16;
        else if (t < 24) amb = 0.2;
        else if (t < 28) amb = 0.09;
        else amb = 0.15;

        const mem = new Float32Array(16);
        // 光膜每拍扫过光点一次：高速横穿，同一时刻只有一层可见
        S.sheds.forEach((st, i) => {
            const x = (st - t) * 2600;
            const d = t - st;
            const op = prog(t, st - 0.34, 0.1) * (1 - prog(t, st + 0.12, 0.22));
            mem[i * 4] = x;
            mem[i * 4 + 1] = d > 0 ? Math.exp(-d * 6) : 0;
            mem[i * 4 + 2] = op;
            mem[i * 4 + 3] = x > -20 ? Math.exp(-((x / 220) ** 2)) * 0.9 : 0;
        });

        return {
            exposure,
            bloom: 0.85,
            threshold: 0.55,
            flash,
            sat,
            ca: 0.04 + b * b * 0.5 + hit * 0.45,
            glitch,
            vig: 0.85,
            grain: 0.042,
            fade: prog(t, 0, 0.9) * (1 - prog(t, 33.7, 1.2)),
            textAlpha: 1,
            textGlow: 0.16,
            amb,
            tint,
            mem,
            orb: [cam.sx, cam.sy],
            bgTime: freeze(t),
        };
    }

    // ---------------------------------------------------------------- 各层

    function drawDust(t) {
        const td = freeze(t);
        const b = t < 12 ? burdenAmt(td) : 0;
        let amt;
        if (t < 4) amt = 0.5 * prog(t, 0.4, 2.2);
        else if (t < 12) amt = 0.55;
        else if (t < 14.2) amt = 0.9;
        else if (t < 18) amt = 0.45;
        else if (t < 24) amt = 0.28;
        else if (t < 28) amt = 0.35;
        else amt = 0.42 * prog(t, 28.5, 1.6);

        const implode = t > 27.3 && t < 28 ? ease.inExpo(prog(t, 27.35, 0.6)) : 0;
        const rate = dustRate(t) / 900;
        const col = t < 12 ? mix3(C.ice, C.warm, b * 0.85) : C.ice;
        const offX = dustX(t);

        for (const p of dust) {
            const x = U.mod(p.x + p.vx * td + offX * p.z + 1150, 2300) - 1150;
            const y = U.mod(p.y + p.vy * td + 650, 1300) - 650;
            const zf = 1 + (cam.z - 1) * p.z * 0.7;
            let sx = (x - cam.x * p.z * 0.4) * zf + cam.sx * p.z;
            let sy = (y - cam.y * p.z * 0.4) * zf + cam.sy * p.z;
            if (implode > 0) {
                sx = lerp(sx, 0, implode);
                sy = lerp(sy, 0, implode);
            }
            const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(td * p.tw + p.ph));
            const a = amt * tw * 0.22 * p.z * (1 + implode * 3);
            const s = 1.4 + p.z * 1.8;
            batch.push(sx, sy, s, a, col, 0);
            if (rate > 0.08) {
                for (let k = 1; k <= 4; k++) batch.push(sx + k * 16 * p.z * rate, sy, s, a * (1 - k / 5), col, 0);
            }
        }
    }

    function drawOrb(t) {
        const tb = t < 12 ? freeze(t) : t;
        const hp = pulse(tb, S.heartAll, 9);
        const vis = prog(t, 0.35, 1.6);
        const b = t < 12 ? burdenAmt(tb) : 0;

        let core = 1 + hp * 1.2;
        let size = 22 * (1 + hp * 0.3);
        if (t < 12) core *= 1 - b * 0.55;
        else {
            const n = S.sheds.filter(s => t >= s).length;
            core = 1.2 + n * 0.45;
        }
        if (t > 13.5) {
            const k = ease.inCubic(prog(t, 13.5, 0.5));
            size = lerp(size, 9, k);
            core *= 1 + k * 4;
        }

        const tint = t < 12 ? mix3(C.ice, [1.3, 0.8, 0.6], b * 0.5) : C.ice;
        P(0, 0, size * 2.4, vis * core, tint, 0);
        P(0, 0, size, vis * core * 1.4, C.hot, 0);
        P(0, 0, 640, vis * (0.45 + hp * 0.6) * (t > 13.5 ? 1.6 : 1), C.halo, 3);

        if (t < 10) {
            for (const h of S.heart) {
                const d = t - h;
                if (d > 0 && d < 1.4) P(0, 0, 60 + d * 520, vis * 0.32 * Math.exp(-d * 2.6) * (1 - b * 0.6), C.cyan, 2);
            }
        }
    }

    function wordPos(i, tb) {
        const w = S.words[i];
        const ring = i % 3;
        const rx = 300 + ring * 72;
        const ry = 175 + ring * 46;
        const a = w.a + (tb - 4) * 0.07 * (ring === 1 ? -1 : 1);
        const k = ease.outCubic(prog(tb, w.t, 0.42));
        const ox = Math.cos(a) * rx;
        const oy = -Math.sin(a) * ry;
        const sx = Math.cos(w.a + 0.5) * 1350;
        const sy = -Math.sin(w.a + 0.5) * 950;
        return [lerp(sx, ox, k), lerp(sy, oy, k), k];
    }

    function drawBurden(t) {
        const tb = freeze(t);
        const b = burdenAmt(tb);
        const jit = b * b * 9;

        for (const p of burden) {
            const w = S.words[p.w];
            if (tb < w.t) continue;
            const d = t - S.sheds[layerOf(p.w)];
            if (d > 1.6) continue;

            const k = ease.outCubic(prog(tb, w.t + 0.04, p.d));
            const ang = p.th + p.om * (tb - w.t);
            const tx = Math.cos(ang) * p.r + Math.sin(tb * 37 + p.ph) * jit;
            const ty = Math.sin(ang) * p.r * 0.88 + Math.cos(tb * 31 + p.ph * 1.3) * jit;
            const sa = w.a + 0.5 + p.sp;
            let x = lerp(Math.cos(sa) * 1300, tx, k);
            let y = lerp(-Math.sin(sa) * 900, ty, k);
            let a = 0.5 * prog(tb, w.t, 0.12);
            let c = p.ember > 0.6 ? C.ember : C.warm;
            if (d > 0) {
                x -= 900 * d + 420 * (1 - Math.exp(-d * 5)) * p.vx;
                y += p.vy * 240 * (1 - Math.exp(-d * 3));
                a *= Math.exp(-d * 2.6);
                c = mix3(c, C.grey, prog(d, 0, 0.5));
            }
            P(x, y, p.s, a, c, 0);
        }

        for (let i = 0; i < S.words.length; i++) drawWord(i, t, tb);
    }

    function drawWord(i, t, tb) {
        const w = S.words[i];
        if (tb < w.t) return;
        const d = t - S.sheds[layerOf(i)];
        if (d > 1.0) return;

        let [x, y, k] = wordPos(i, tb);
        let a = prog(tb, w.t, 0.18);
        let blur = (1 - k) * 8;
        if (d > 0) {
            x -= 900 * d + 300 * (1 - Math.exp(-d * 5));
            y += (i % 2 ? 1 : -1) * 70 * (1 - Math.exp(-d * 3));
            a *= Math.exp(-d * 3.4);
            blur += d * 16;
        }
        P(x, y, 9, a * 1.1, C.warm, 0);

        const [sx, sy] = toScreen(x, y);
        const [ox, oy] = toScreen(0, 0);
        const dx = sx - ox;
        const dy = sy - oy;
        const len = Math.hypot(dx, dy) || 1;

        ctx.globalAlpha = a * 0.16 * k;
        ctx.strokeStyle = TXT.warm;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ox + (dx / len) * 46, oy + (dy / len) * 46);
        ctx.lineTo(sx - (dx / len) * 10, sy - (dy / len) * 10);
        ctx.stroke();

        const side = x > 30 ? 1 : x < -30 ? -1 : 0;
        const lx = side === 0 ? sx : sx + side * 16;
        ctx.textAlign = side === 1 ? 'left' : side === -1 ? 'right' : 'center';
        ctx.textBaseline = 'middle';
        ctx.filter = blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : 'none';
        const s = cam.z;

        ctx.globalAlpha = a * 0.62;
        ctx.fillStyle = TXT.warm;
        ctx.font = `600 ${Math.round(14 * s)}px ${SANS}`;
        ctx.fillText(w.k.toUpperCase(), lx, sy - 13 * s);

        ctx.globalAlpha = a;
        ctx.fillStyle = TXT.warmSoft;
        ctx.font = `500 ${Math.round(20 * s)}px ${MONO}`;
        ctx.fillText(w.v, lx, sy + 10 * s);

        ctx.filter = 'none';
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
    }

    function drawSparks(t) {
        const bursts = [
            { t: 12.0, n: 320, warm: true },
            { t: 14.0, n: 460, warm: false },
        ];
        for (const B of bursts) {
            const d = t - B.t;
            if (d < 0 || d > 2.6) continue;
            for (let i = 0; i < B.n; i++) {
                const p = sparks[i];
                const r = (p.v * (1 - Math.exp(-d * p.k))) / p.k;
                const a = Math.exp(-d * 2.2) * 0.9;
                const c = B.warm ? (p.mix > 0.45 ? C.warm : C.ice) : p.mix > 0.7 ? C.hot : C.cyan;
                P(Math.cos(p.a) * r * 1.25, Math.sin(p.a) * r * 0.8, p.s * (1 - d * 0.25), a, c, 0);
            }
        }
    }

    const byteBeats = S.kicks.concat(S.claps).filter(x => x >= 14 && x < 18).sort((a, b) => a - b);

    function drawBytes(t) {
        const c = ease.inCubic(prog(t, 17.55, 0.4));
        const bp = pulse(t, byteBeats, 7);
        const textOut = prog(t, 17.45, 0.15);

        ctx.font = `700 34px ${MONO}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#e9feff';

        for (let i = 0; i < 10; i++) {
            const slotX = (i - 4.5) * BYTE_GAP;
            const kx = ease.outExpo(prog(t, 14.0 + i * 0.025, 0.6));
            const pop = ease.outBack(prog(t, 14.12 + i * 0.05, 0.32));
            const al = prog(t, 14.0 + i * 0.025, 0.08);
            let x = lerp(0, slotX, kx);
            let y = lerp(0, BYTE_Y, kx) + Math.sin(t * 2.2 + i * 0.7) * 4 * kx;
            x = lerp(x, 0, c);
            y = lerp(y, 0, c);
            const size = 150 * (0.35 + 0.65 * pop) * (1 + bp * 0.05) * (1 - c * 0.9);
            P(x, y, size, al * (0.8 + bp * 0.6), [0.16, 0.85, 0.82], 1);

            const ta = al * U.clamp(pop) * (1 - textOut);
            if (ta > 0.01) {
                const [sx, sy] = toScreen(x, y);
                ctx.globalAlpha = ta;
                ctx.font = `700 ${Math.round(34 * cam.z)}px ${MONO}`;
                ctx.fillText(S.bytes[i].toString(16).padStart(2, '0').toUpperCase(), sx, sy + 1);
            }
        }
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';

        if (c > 0) P(0, 0, 34 * c, c * 3, C.hot, 0);
    }

    function drawRiver(t) {
        const appear = prog(t, 17.92, 0.3);
        const col = ease.inExpo(prog(t, 23.78, 0.27));
        const gone = prog(t, 24.02, 0.1);
        if (gone >= 1) return;

        const m = trendMix(t);
        const trib = ease.inOutCubic(prog(t, 21.85, 0.7));
        const sigma = lerp(46, 6, m);
        const RT = riverT(t);
        const on = S.channels.map(([ct]) => prog(t, ct - 0.04, 0.1));
        const fl = S.channels.map(([ct]) => (t > ct ? Math.exp(-(t - ct) * 5) : 0));
        const tcol = S.channels.map(([, , ai]) => (ai ? C.purple : C.cyan));

        for (const p of river) {
            let x = U.mod(p.u + RT * 0.11 * p.v, 1) * 2500 - 1250;
            let y = lerp(sinuousY(x, t), trendY(x), m) + p.g * sigma * (1 + 0.4 * Math.sin(x * 0.003 + t));
            // 越靠近河心越亮，形成一条有体积的光带
            let a = p.a * appear * (0.6 + 1.6 * Math.exp(-p.g * p.g * 0.9));
            let c = mix3(C.cyan, C.ice, 0.3 + 0.3 * Math.sin(p.ph + t * 3));

            if (trib > 0) {
                const mf = 1 - smooth(-640, 40, x);
                const wgt = trib * mf;
                y = lerp(y, TRIB_Y[p.j] + p.g * 5, wgt);
                c = mix3(c, tcol[p.j], wgt);
                a *= lerp(1, 0.12 + 0.88 * on[p.j] + fl[p.j] * 1.5, wgt);
                if (x < -700) a *= 1 - trib;
                else if (x < -620) a *= lerp(1, smooth(-700, -620, x), trib);
            }
            if (col > 0) {
                x = lerp(x, 0, col);
                y = lerp(y, 0, col);
            }
            P(x, y, p.s, a * (1 - gone), c, 0);
        }

        // 河心的柔光：沿曲线铺一串宽光晕；分叉成支流的部分随之熄灭
        if (col < 1) {
            for (let i = 0; i <= 120; i++) {
                const x = -1250 + (i / 120) * 2500;
                const keep = 1 - trib * (1 - smooth(-260, 120, x));
                if (keep < 0.01) continue;
                const y = lerp(sinuousY(x, t), trendY(x), m);
                P(lerp(x, 0, col), lerp(y, 0, col), 130, 0.05 * keep * appear * (1 - gone) * (1 - col), C.cyan, 0);
            }
        }

        if (t < 20.2) {
            const [hx, hy] = hero(t);
            P(hx, hy, 16, 2.2 * (1 - prog(t, 19.6, 0.6)), C.hot, 0);
            P(hx, hy, 58, 0.6 * (1 - prog(t, 19.2, 0.8)), C.cyan, 2);
        }

        // 支流标签
        S.channels.forEach(([ct, name, ai], j) => {
            const [sx, sy] = toScreen(-735, TRIB_Y[j]);
            drawText(name, sx, sy, {
                screen: true,
                align: 'right',
                t0: ct,
                dur: 0.14,
                stagger: 0.015,
                out: 23.72,
                outDur: 0.12,
                size: 26,
                weight: ai ? 600 : 400,
                spacing: 2,
                rise: 6,
                color: ai ? TXT.purple : TXT.cyan,
            });
        });
    }

    function drawCode(t) {
        const out = prog(t, 27.45, 0.5);
        const glow = prog(t, 24.0, 0.3) * (1 - out);
        P(0, 0, 1000, glow * (0.5 + pulse(t, S.kicks, 6) * 0.7), [0.012, 0.055, 0.055], 3);

        const n = S.typing.filter(x => t >= x).length;
        const o = { size: 74, weight: 500, font: MONO };
        const full = measure(S.code, o);
        const x0 = HW - full.total / 2;
        const y0 = HH;

        ctx.font = full.font;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.filter = out > 0.02 ? `blur(${(out * 14).toFixed(1)}px)` : 'none';
        ctx.globalAlpha = 1 - out;

        let cx = x0;
        for (let i = 0; i < n; i++) {
            ctx.fillStyle = i < 3 ? TXT.cyan : TXT.white;
            ctx.fillText(full.chars[i], cx + out * (i - 8) * 14, y0);
            cx += full.ws[i];
        }

        const typingDone = t >= S.typing[S.typing.length - 1] + 0.05;
        const blinkOn = !typingDone || U.mod(t * 2, 1) < 0.6;
        if (t >= 24.0 && blinkOn) {
            ctx.fillStyle = TXT.cyan;
            ctx.fillRect(cx + 6, y0 - 40, 36, 80);
        }
        ctx.filter = 'none';
        ctx.globalAlpha = 1;

        // 关键词逐拍累积成一行
        const po = { size: 34, weight: 300, spacing: 8 };
        const gap = 84;
        const parts = S.phrases.map(([, w]) => measure(w, po).total);
        const widthOf = n => parts.slice(0, n).reduce((a, b) => a + b, 0) + gap * Math.max(0, n - 1);
        // 每出现一个新词，整行平滑地重新居中
        let center = widthOf(1);
        S.phrases.forEach(([pt], i) => {
            if (i > 0) center = lerp(center, widthOf(i + 1), ease.outCubic(prog(t, pt, 0.3)));
        });
        let px = -center / 2;
        S.phrases.forEach(([pt, w], i) => {
            drawText(w, px, 150, { ...po, align: 'left', t0: pt, stagger: 0.03, dur: 0.35, out: 27.45, outDur: 0.4, color: TXT.white, rise: 10 });
            if (i > 0) {
                const dx = px - gap / 2;
                drawText('·', dx, 150, { size: 34, t0: pt, dur: 0.2, out: 27.45, color: TXT.cyan, rise: 0 });
            }
            px += parts[i] + gap;
        });
    }

    function drawLogo(t) {
        const hp = pulse(t, [32, 32 + S.DUB], 7);
        const settle = prog(t, 29.3, 1.0);
        const shown = prog(t, 27.95, 0.08);

        for (const p of logoPts) {
            const k = prog(t, 28.0 + p.delay, p.dur);
            const e = ease.outExpo(k);
            const burst = Math.sin(Math.PI * Math.min(1, k * 1.15)) * (1 - k);
            const x = p.x * e + p.dx * p.br * burst;
            const y = (p.y + LOGO_Y) * e + p.dy * p.br * burst;
            const tw = 0.7 + 0.3 * Math.sin(t * 5 + p.ph);
            const a = shown * lerp(1.1, 0.16 * tw, settle) * (1 + hp * 1.5);
            P(x, y, p.s, a, p.c, 0);
        }

        const img = ease.outCubic(prog(t, 29.05, 0.8));
        P(0, LOGO_Y, 1500, img * (0.4 + hp * 0.8), C.halo, 3);

        if (logoImg && img > 0) {
            const w = LOGO_W * cam.z * (1 + hp * 0.012);
            const h = logoH * cam.z * (1 + hp * 0.012);
            const [sx, sy] = toScreen(0, LOGO_Y);
            ctx.globalAlpha = img;
            ctx.filter = img < 0.98 ? `blur(${((1 - img) * 10).toFixed(1)}px)` : 'none';
            ctx.drawImage(logoImg, sx - w / 2, sy - h / 2, w, h);
            ctx.filter = 'none';
            ctx.globalAlpha = 1;
        }

        for (const h0 of [32]) {
            const d = t - h0;
            if (d > 0 && d < 1.6) P(0, LOGO_Y, 200 + d * 900, 0.32 * Math.exp(-d * 2.2), C.cyan, 2);
        }
    }

    function drawCaptions(t) {
        const cap = (str, y, t0, out, o = {}) => drawText(str, 0, y, { t0, out, ...o });

        // 序 / 负担
        if (t < 10) {
            cap('每一次访问', 210, 1.3, 3.4, { size: 46, weight: 300, spacing: 18, stagger: 0.07, dur: 0.8 });
            cap('都在被记住', 420, 6.3, null, { size: 46, weight: 300, spacing: 18, stagger: 0.07, dur: 0.8 });
        }

        // 静默：两段出现，冻结画面上唯一的焦点
        if (t >= 10 && t < 12) {
            const line = '如果，只记住你来过呢？';
            cap(line, 420, 0, 11.7, {
                size: 52,
                weight: 400,
                spacing: 10,
                at: i => (i < 3 ? 10.25 + i * 0.05 : S.silence.second + (i - 3) * 0.045),
                dur: 0.45,
                outDur: 0.25,
            });
        }

        // 10 字节
        if (t > 14 && t < 18) {
            cap('一次访问，只上传', -335, 14.25, 17.45, { size: 30, weight: 300, spacing: 14, color: TXT.dim, outDur: 0.25 });

            const big = { size: 190, weight: 800, spacing: 2 };
            const small = { size: 84, weight: 300, spacing: 8 };
            const wb = measure('10', big).total;
            const ws = measure('字节', small).total;
            const gap = 30;
            const left = -(wb + gap + ws) / 2;
            drawText('10', left, -165, { ...big, align: 'left', t0: 14.28, stagger: 0.05, dur: 0.4, out: 17.45, outDur: 0.25, rise: 40, blur: 20 });
            drawText('字节', left + wb + gap, -150, { ...small, align: 'left', t0: 14.42, stagger: 0.06, dur: 0.45, out: 17.45, outDur: 0.25 });

            cap('POST /greet  ·  一次真实的请求体', 168, 14.85, 17.45, { size: 19, font: MONO, spacing: 2, color: 'rgba(160, 230, 235, 0.5)', stagger: 0.012, outDur: 0.2 });

            S.flashStrip.forEach(([ft, w]) => {
                const rest = w.slice(1);
                const o = { size: 46, spacing: 6, dur: 0.12, stagger: 0.015, out: ft + 0.42, outDur: 0.08, rise: 8, blur: 8 };
                const w0 = measure('无', { ...o, weight: 700 }).total;
                const w1 = measure(rest, { ...o, weight: 400 }).total;
                const l = -(w0 + 6 + w1) / 2;
                drawText('无', l, 262, { ...o, weight: 700, align: 'left', t0: ft, color: TXT.cyan });
                drawText(rest, l + w0 + 6, 262, { ...o, weight: 400, align: 'left', t0: ft + 0.02 });
            });
        }

        // 汇聚
        if (t > 18 && t < 24) {
            cap('你依然看得清', -360, 18.45, 19.85, { size: 52, weight: 300, spacing: 16, stagger: 0.05 });
            S.metrics.forEach(([mt, w]) => cap(w, -360, mt, mt + 0.42, { size: 82, weight: 700, spacing: 12, dur: 0.14, stagger: 0.02, outDur: 0.08, rise: 10, blur: 10 }));
            cap('连 AI 带来的访客', -430, 22.0, 23.72, { size: 38, weight: 300, spacing: 12, stagger: 0.03, outDur: 0.15 });
        }

        // 落版
        if (t > 29) {
            cap('见客，不识客。', 122, 29.55, null, { size: 66, weight: 600, spacing: 26, stagger: 0.07, dur: 0.6, blur: 16 });
            cap('Count visits. Not people.', 194, 30.3, null, { size: 24, weight: 300, spacing: 8, color: TXT.dim, stagger: 0.015, dur: 0.5 });
            cap('jekit.cn', 300, 31.0, null, { size: 30, font: MONO, weight: 500, spacing: 6, color: TXT.cyan, stagger: 0.04, dur: 0.5 });
        }
    }

    // ---------------------------------------------------------------- 入口

    function sampleLogo(img) {
        const w = LOGO_W;
        const h = Math.round((img.height * w) / img.width);
        logoH = h;
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const x = c.getContext('2d', { willReadFrequently: true });
        x.drawImage(img, 0, 0, w, h);
        const d = x.getImageData(0, 0, w, h).data;
        const pts = [];
        const r = rng(77);
        for (let yy = 0; yy < h; yy += 2) {
            for (let xx = 0; xx < w; xx += 2) {
                const i = (yy * w + xx) * 4;
                if (d[i + 3] < 150) continue;
                const lin = v => (v / 255) ** 2.2;
                const ang = r() * Math.PI * 2;
                pts.push({
                    x: xx - w / 2,
                    y: yy - h / 2,
                    c: [lin(d[i]) * 1.6 + 0.05, lin(d[i + 1]) * 1.6 + 0.1, lin(d[i + 2]) * 1.6 + 0.1],
                    dx: Math.cos(ang),
                    dy: Math.sin(ang) * 0.7,
                    br: 220 + r() ** 1.5 * 900,
                    delay: r() * 0.3,
                    dur: 0.9 + r() * 0.6,
                    s: 2.2 + r() * 2.2,
                    ph: r() * 6.283,
                    o: r(),
                });
            }
        }
        pts.sort((a, b) => a.o - b.o);
        logoPts = pts.slice(0, 9000);
    }

    function init(logo) {
        logoImg = logo;
        if (logo) sampleLogo(logo);
        batch = new Batch(48000);
        overlay = document.createElement('canvas');
        overlay.width = W;
        overlay.height = H;
        ctx = overlay.getContext('2d');
    }

    function frame(t) {
        T = t;
        batch.reset();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, W, H);

        setCamera(t);
        const post = makePost(t);

        drawDust(t);
        if (t < 14.05) drawOrb(t);
        if (t > 4 && t < 15) drawBurden(t);
        drawSparks(t);
        if (t > 13.95 && t < 18.05) drawBytes(t);
        if (t > 17.9 && t < 24.2) drawRiver(t);
        if (t > 23.9 && t < 28.1) drawCode(t);
        if (t > 27.9) drawLogo(t);
        drawCaptions(t);

        return { t, inst: batch.buf, count: batch.n, post };
    }

    return {
        init,
        frame,
        get overlay() {
            return overlay;
        },
    };
})();
