'use strict';
// 全片共用的纯函数工具。画面中的一切都由时间 t 计算得出，不在帧与帧之间累积状态，
// 所以任何时刻都可以直接跳转，掉帧也不会让音画错位。
window.J = window.J || {};

J.util = (() => {
    const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
    const lerp = (a, b, k) => a + (b - a) * k;
    const prog = (t, t0, d) => clamp((t - t0) / d);
    const smooth = (e0, e1, x) => {
        const k = clamp((x - e0) / (e1 - e0));
        return k * k * (3 - 2 * k);
    };
    const mod = (a, m) => ((a % m) + m) % m;
    const mix3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
    const scale3 = (a, s) => [a[0] * s, a[1] * s, a[2] * s];

    const ease = {
        linear: k => k,
        inCubic: k => k * k * k,
        outCubic: k => 1 - (1 - k) ** 3,
        inOutCubic: k => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2),
        outQuart: k => 1 - (1 - k) ** 4,
        inOutQuart: k => (k < 0.5 ? 8 * k ** 4 : 1 - (-2 * k + 2) ** 4 / 2),
        inExpo: k => (k <= 0 ? 0 : 2 ** (10 * k - 10)),
        outExpo: k => (k >= 1 ? 1 : 1 - 2 ** (-10 * k)),
        inOutSine: k => -(Math.cos(Math.PI * k) - 1) / 2,
        outBack: k => {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * (k - 1) ** 3 + c1 * (k - 1) ** 2;
        },
    };

    function rng(seed) {
        let a = seed >>> 0;
        return () => {
            a = (a + 0x6d2b79f5) >>> 0;
            let t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function gauss(r) {
        let u = 0;
        while (u === 0) u = r();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * r());
    }

    function hash(n) {
        const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
        return x - Math.floor(x);
    }

    // 关键帧轨道：keys = [[t, value, easeName?], ...]，缓动取自目标关键帧
    function track(keys) {
        return t => {
            if (t <= keys[0][0]) return keys[0][1];
            for (let i = 1; i < keys.length; i++) {
                const [t1, v1, e] = keys[i];
                if (t <= t1) {
                    const [t0, v0] = keys[i - 1];
                    const k = ease[e || 'inOutCubic']((t - t0) / (t1 - t0));
                    return lerp(v0, v1, k);
                }
            }
            return keys[keys.length - 1][1];
        };
    }

    // 时间扭曲：返回 rate(t) 从 t0 起的积分，用于"变速但不跳变"的流动
    function warp(rate, t0, t1, step = 1 / 240) {
        const n = Math.ceil((t1 - t0) / step) + 1;
        const tab = new Float64Array(n);
        for (let i = 1; i < n; i++) {
            const a = t0 + (i - 1) * step;
            tab[i] = tab[i - 1] + (rate(a) + rate(a + step)) * 0.5 * step;
        }
        return t => {
            if (t <= t0) return (t - t0) * rate(t0);
            const f = (t - t0) / step;
            const i = Math.floor(f);
            if (i >= n - 1) return tab[n - 1] + (t - (t0 + (n - 1) * step)) * rate(t1);
            return lerp(tab[i], tab[i + 1], f - i);
        };
    }

    // sRGB 十六进制 → 线性空间 RGB（着色器里统一在线性空间混色）
    function color(hex, mul = 1) {
        const v = parseInt(hex.slice(1), 16);
        const lin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
        return [lin(((v >> 16) & 255) / 255) * mul, lin(((v >> 8) & 255) / 255) * mul, lin((v & 255) / 255) * mul];
    }

    // 已发生事件的指数衰减之和：让画面跟着鼓点、心跳"呼吸"
    function pulse(t, times, decay) {
        let s = 0;
        const horizon = 6 / decay;
        for (let i = times.length - 1; i >= 0; i--) {
            const d = t - times[i];
            if (d < 0) continue;
            if (d > horizon) break;
            s += Math.exp(-d * decay);
        }
        return s;
    }

    return { clamp, lerp, prog, smooth, mod, mix3, scale3, ease, rng, gauss, hash, track, warp, color, pulse };
})();
