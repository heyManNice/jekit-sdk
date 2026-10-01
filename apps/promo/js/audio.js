'use strict';
// 配乐：全部由 Web Audio 实时合成。
// 所有音符在开始播放时按总谱一次性排程，画面读取同一个 AudioContext 时钟，
// 因此每一次冲击、心跳、打字声都与画面落在同一毫秒上。
//
// 调性：D 小调。和声走向 Dm → B♭ → Gm → A（负担段），剥离后转为更开阔的 Dm → B♭ → F → C。

J.Audio = (() => {
    const S = J.score;
    const mtof = m => 440 * 2 ** ((m - 69) / 12);

    class Engine {
        constructor() {
            this.ctx = null;
            this.nodes = [];
            this.startAt = 0;
            this.offset = 0;
            this.playing = false;
        }

        ensure() {
            if (this.ctx) return;
            const ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'playback' });
            this.ctx = ctx;

            this.limiter = ctx.createDynamicsCompressor();
            this.limiter.threshold.value = -2;
            this.limiter.knee.value = 0;
            this.limiter.ratio.value = 20;
            this.limiter.attack.value = 0.002;
            this.limiter.release.value = 0.12;

            this.glue = ctx.createDynamicsCompressor();
            this.glue.threshold.value = -16;
            this.glue.knee.value = 10;
            this.glue.ratio.value = 2.5;
            this.glue.attack.value = 0.012;
            this.glue.release.value = 0.22;

            this.master = ctx.createGain();
            this.master.gain.value = 0.9;

            this.master.connect(this.glue).connect(this.limiter).connect(ctx.destination);

            // 录制用出口
            this.recordDest = ctx.createMediaStreamDestination();
            this.limiter.connect(this.recordDest);

            this.reverb = ctx.createConvolver();
            this.reverb.buffer = this.impulse(3.6, 2.6);
            this.reverbIn = ctx.createGain();
            this.reverbIn.gain.value = 1;
            const revOut = ctx.createGain();
            revOut.gain.value = 0.55;
            this.revOut = revOut;
            this.reverbIn.connect(this.reverb).connect(revOut).connect(this.master);

            this.noiseBuf = this.makeNoise(2);
        }

        impulse(seconds, decay) {
            const ctx = this.ctx;
            const len = Math.floor(seconds * ctx.sampleRate);
            const buf = ctx.createBuffer(2, len, ctx.sampleRate);
            for (let c = 0; c < 2; c++) {
                const d = buf.getChannelData(c);
                const r = J.util.rng(91 + c * 7);
                for (let i = 0; i < len; i++) {
                    const k = i / len;
                    // 前 20ms 稀疏早期反射 + 指数衰减的扩散尾
                    const early = i < ctx.sampleRate * 0.02 && r() < 0.01 ? 1.5 : 0;
                    d[i] = (r() * 2 - 1 + early) * (1 - k) ** decay;
                }
            }
            return buf;
        }

        makeNoise(seconds) {
            const ctx = this.ctx;
            const buf = ctx.createBuffer(1, Math.floor(seconds * ctx.sampleRate), ctx.sampleRate);
            const d = buf.getChannelData(0);
            const r = J.util.rng(7);
            for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1;
            return buf;
        }

        // ---------- 播放控制 ----------

        get time() {
            if (!this.ctx || !this.playing) return this.offset;
            return this.ctx.currentTime - this.startAt;
        }

        async play(from) {
            this.ensure();
            await this.ctx.resume();
            this.stopNodes();
            this.offset = from;
            this.startAt = this.ctx.currentTime + 0.08 - from;
            this.playing = true;
            this.schedule(from);
        }

        pause() {
            if (!this.playing) return;
            this.offset = this.time;
            this.playing = false;
            this.stopNodes();
        }

        stopNodes() {
            const now = this.ctx ? this.ctx.currentTime : 0;
            for (const n of this.nodes) {
                try {
                    if (n.gain) {
                        n.gain.cancelScheduledValues(now);
                        n.gain.setTargetAtTime(0, now, 0.015);
                    } else if (n.stop) {
                        n.stop(now + 0.08);
                    }
                } catch (_) {
                    /* 节点可能已经结束 */
                }
            }
            this.nodes = [];
        }

        // ---------- 基础构件 ----------

        // 把总谱时间换算成上下文时间
        at(t) {
            return this.startAt + t;
        }

        // 长音的起点：从中途跳入时，起点可能已经过去，统一挪到"现在"
        startOf(t) {
            return Math.max(this.at(t), this.ctx.currentTime + 0.02);
        }

        track(node) {
            this.nodes.push(node);
            return node;
        }

        out(gainValue, { reverb = 0, pan = 0 } = {}) {
            const ctx = this.ctx;
            const g = ctx.createGain();
            g.gain.value = gainValue;
            let tail = g;
            if (pan) {
                const p = ctx.createStereoPanner();
                p.pan.value = pan;
                g.connect(p);
                tail = p;
            }
            tail.connect(this.master);
            if (reverb > 0) {
                const s = ctx.createGain();
                s.gain.value = reverb;
                tail.connect(s).connect(this.reverbIn);
            }
            return g;
        }

        osc(type, freq, t0, t1) {
            const o = this.ctx.createOscillator();
            o.type = type;
            o.frequency.value = freq;
            o.start(Math.max(this.ctx.currentTime, t0));
            o.stop(t1);
            return this.track(o);
        }

        noise(t0, t1) {
            const n = this.ctx.createBufferSource();
            n.buffer = this.noiseBuf;
            n.loop = true;
            n.loopStart = Math.random();
            n.start(Math.max(this.ctx.currentTime, t0), Math.random() * 1.5);
            n.stop(t1);
            return this.track(n);
        }

        env(t0, peak, a, d) {
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0, t0);
            g.gain.linearRampToValueAtTime(peak, t0 + a);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
            return this.track(g);
        }

        // ---------- 乐器 ----------

        heartbeat(t, strong) {
            const t0 = this.at(t);
            const o = this.osc('sine', 72, t0, t0 + 0.5);
            o.frequency.setValueAtTime(strong ? 74 : 64, t0);
            o.frequency.exponentialRampToValueAtTime(40, t0 + 0.24);
            const g = this.env(t0, strong ? 0.85 : 0.55, 0.006, 0.32);
            o.connect(g).connect(this.out(0.9, { reverb: 0.06 }));
        }

        kick(t, level = 1) {
            const t0 = this.at(t);
            const o = this.osc('sine', 150, t0, t0 + 0.7);
            o.frequency.setValueAtTime(150, t0);
            o.frequency.exponentialRampToValueAtTime(46, t0 + 0.12);
            o.frequency.exponentialRampToValueAtTime(38, t0 + 0.5);
            const g = this.env(t0, 0.95 * level, 0.003, 0.5);
            const sh = this.ctx.createWaveShaper();
            sh.curve = this.softClip(2.2);
            o.connect(sh)
                .connect(g)
                .connect(this.out(0.8, { reverb: 0.04 }));

            const n = this.noise(t0, t0 + 0.04);
            const hp = this.ctx.createBiquadFilter();
            hp.type = 'highpass';
            hp.frequency.value = 2200;
            const ng = this.env(t0, 0.18 * level, 0.001, 0.025);
            n.connect(hp).connect(ng).connect(this.out(0.6));
            this.duck(t0, 0.55 * level);
        }

        clap(t) {
            const t0 = this.at(t);
            const bp = this.ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.frequency.value = 1500;
            bp.Q.value = 0.9;
            const out = this.out(0.5, { reverb: 0.35, pan: 0.05 });
            for (let i = 0; i < 3; i++) {
                const ti = t0 + i * 0.011;
                const n = this.noise(ti, ti + 0.2);
                const g = this.env(ti, i === 2 ? 0.5 : 0.32, 0.001, i === 2 ? 0.16 : 0.012);
                n.connect(g).connect(bp);
            }
            bp.connect(out);
        }

        hat(t, level = 0.12, pan = 0) {
            const t0 = this.at(t);
            const n = this.noise(t0, t0 + 0.08);
            const hp = this.ctx.createBiquadFilter();
            hp.type = 'highpass';
            hp.frequency.value = 7600;
            const g = this.env(t0, level, 0.001, 0.045);
            n.connect(hp).connect(g).connect(this.out(0.6, { pan }));
        }

        tick(t, freq = 2600, level = 0.12, pan = 0) {
            const t0 = this.at(t);
            const o = this.osc('sine', freq, t0, t0 + 0.08);
            const g = this.env(t0, level, 0.001, 0.05);
            o.connect(g).connect(this.out(0.6, { reverb: 0.2, pan }));
        }

        // 按键声：短促的带通噪声 + 一个很轻的木质音头
        key(t, i) {
            const t0 = this.at(t);
            const n = this.noise(t0, t0 + 0.05);
            const bp = this.ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.frequency.value = 3200 + (i % 4) * 380;
            bp.Q.value = 2.2;
            const g = this.env(t0, 0.22, 0.001, 0.03);
            const pan = (((i * 37) % 9) / 9) * 0.5 - 0.25;
            n.connect(bp)
                .connect(g)
                .connect(this.out(0.6, { pan, reverb: 0.06 }));
            const o = this.osc('triangle', 900 + (i % 3) * 60, t0, t0 + 0.04);
            const og = this.env(t0, 0.05, 0.001, 0.02);
            o.connect(og).connect(this.out(0.6, { pan }));
        }

        // 数据碎片吸附：短促的数字"啾"声
        blip(t, i) {
            const t0 = this.at(t);
            const notes = [86, 89, 93, 84, 88, 91, 95, 87, 90, 94, 85, 92, 96, 89];
            const f = mtof(notes[i % notes.length]);
            const o = this.osc('square', f, t0, t0 + 0.16);
            o.frequency.setValueAtTime(f * 1.5, t0);
            o.frequency.exponentialRampToValueAtTime(f, t0 + 0.03);
            const lp = this.ctx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.value = 4200;
            const g = this.env(t0, 0.05 + i * 0.004, 0.002, 0.11);
            const pan = Math.sin(i * 2.3) * 0.6;
            o.connect(lp)
                .connect(g)
                .connect(this.out(0.6, { pan, reverb: 0.15 }));
        }

        // 冲击：次低音下坠 + 噪声爆破 + 长混响
        impact(t, s = 1) {
            const t0 = this.at(t);
            const o = this.osc('sine', 120, t0, t0 + 2.6);
            o.frequency.setValueAtTime(120, t0);
            o.frequency.exponentialRampToValueAtTime(30, t0 + 1.8);
            const g = this.env(t0, 0.95 * s, 0.004, 2.2);
            const sh = this.ctx.createWaveShaper();
            sh.curve = this.softClip(1.6);
            o.connect(sh)
                .connect(g)
                .connect(this.out(0.85, { reverb: 0.15 }));

            const n = this.noise(t0, t0 + 1.8);
            const lp = this.ctx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.setValueAtTime(9000, t0);
            lp.frequency.exponentialRampToValueAtTime(260, t0 + 1.2);
            const ng = this.env(t0, 0.45 * s, 0.002, 1.3);
            n.connect(lp)
                .connect(ng)
                .connect(this.out(0.55, { reverb: 0.9 }));

            // 高频的"玻璃"回响
            for (const [m, lv] of [
                [86, 0.05],
                [93, 0.035],
                [98, 0.025],
            ]) {
                const p = this.osc('sine', mtof(m), t0, t0 + 3.2);
                const pg = this.env(t0, lv * s, 0.002, 2.8);
                p.connect(pg).connect(this.out(0.6, { reverb: 1.2, pan: (m - 92) / 12 }));
            }
            this.duck(t0, 0.85 * s, 0.6);
        }

        // 反向吸入：冲击前的上升噪声
        riser(t0s, t1s, peak = 0.32) {
            const t1 = this.at(t1s);
            const t0 = this.startOf(t0s);
            if (t1 - t0 < 0.08) return;
            const n = this.noise(t0, t1 + 0.02);
            const bp = this.ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.Q.value = 3;
            bp.frequency.setValueAtTime(300, t0);
            bp.frequency.exponentialRampToValueAtTime(7000, t1);
            const g = this.track(this.ctx.createGain());
            g.gain.setValueAtTime(0.0001, t0);
            g.gain.exponentialRampToValueAtTime(peak, t1 - 0.005);
            g.gain.linearRampToValueAtTime(0, t1 + 0.01);
            n.connect(bp)
                .connect(g)
                .connect(this.out(0.7, { reverb: 0.3 }));

            const o = this.osc('sawtooth', 60, t0, t1 + 0.02);
            o.frequency.setValueAtTime(55, t0);
            o.frequency.exponentialRampToValueAtTime(440, t1);
            const lp = this.ctx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.setValueAtTime(200, t0);
            lp.frequency.exponentialRampToValueAtTime(3000, t1);
            const og = this.track(this.ctx.createGain());
            og.gain.setValueAtTime(0.0001, t0);
            og.gain.exponentialRampToValueAtTime(peak * 0.25, t1 - 0.005);
            og.gain.linearRampToValueAtTime(0, t1 + 0.01);
            o.connect(lp).connect(og).connect(this.out(0.6));
        }

        // 铺底和弦：多支轻微失谐的锯齿波，经由低通滤波
        pad(t0s, t1s, notes, { level = 0.07, cutoff = [400, 900], detune = 9, attack = 0.6, release = 0.8, reverb = 0.5 } = {}) {
            const t1 = this.at(t1s);
            if (t1 < this.ctx.currentTime + 0.05) return;
            const t0 = this.startOf(t0s);
            attack = Math.min(attack, Math.max(0.01, t1 - t0 - 0.01));
            const lp = this.ctx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.Q.value = 0.7;
            lp.frequency.setValueAtTime(cutoff[0], t0);
            lp.frequency.linearRampToValueAtTime(cutoff[1], t1);
            const g = this.track(this.ctx.createGain());
            g.gain.setValueAtTime(0, t0);
            g.gain.linearRampToValueAtTime(level, t0 + attack);
            g.gain.setValueAtTime(level, t1);
            g.gain.linearRampToValueAtTime(0, t1 + release);
            lp.connect(g).connect(this.out(1, { reverb }));
            notes.forEach((m, i) => {
                for (const d of [-detune, detune]) {
                    const o = this.osc('sawtooth', mtof(m), t0, t1 + release + 0.05);
                    o.detune.value = d + (i - 1) * 1.5;
                    o.connect(lp);
                }
            });
        }

        // 次低音长音（可选音高滑动）
        sub(t0s, t1s, m, level = 0.32, glideTo = null) {
            const t1 = this.at(t1s);
            if (t1 < this.ctx.currentTime + 0.2) return;
            const t0 = this.startOf(t0s);
            const o = this.osc('sine', mtof(m), t0, t1 + 0.3);
            if (glideTo !== null) {
                o.frequency.setValueAtTime(mtof(m), t0);
                o.frequency.exponentialRampToValueAtTime(mtof(glideTo), t1);
            }
            const g = this.track(this.ctx.createGain());
            g.gain.setValueAtTime(0, t0);
            g.gain.linearRampToValueAtTime(level, t0 + 0.08);
            g.gain.setValueAtTime(level, t1 - 0.05);
            g.gain.linearRampToValueAtTime(0, t1 + 0.12);
            o.connect(g).connect(this.out(1));
            this.sidechain(g, t0s, t1s, level);
        }

        // 拨弦琶音音符
        pluck(t, m, level = 0.08, pan = 0) {
            const t0 = this.at(t);
            const lp = this.ctx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.Q.value = 3;
            lp.frequency.setValueAtTime(5200, t0);
            lp.frequency.exponentialRampToValueAtTime(700, t0 + 0.22);
            const g = this.env(t0, level, 0.003, 0.32);
            lp.connect(g).connect(this.out(0.8, { reverb: 0.4, pan }));
            for (const d of [-6, 6]) {
                const o = this.osc('sawtooth', mtof(m), t0, t0 + 0.45);
                o.detune.value = d;
                o.connect(lp);
            }
        }

        // 钟声：正弦 + 非整数倍泛音
        bell(t, m, level = 0.1, pan = 0) {
            const t0 = this.at(t);
            const f = mtof(m);
            for (const [r, a, d] of [
                [1, 1, 2.6],
                [2.76, 0.4, 1.1],
                [5.4, 0.18, 0.5],
                [2, 0.25, 1.8],
            ]) {
                const o = this.osc('sine', f * r, t0, t0 + d + 0.1);
                const g = this.env(t0, level * a, 0.002, d);
                o.connect(g).connect(this.out(0.8, { reverb: 0.7, pan }));
            }
        }

        // 负担段的"脏"噪声层
        grit(t0s, t1s) {
            const t1 = this.at(t1s);
            if (t1 < this.ctx.currentTime + 0.1) return;
            const t0 = this.startOf(t0s);
            const n = this.noise(t0, t1 + 0.05);
            const bp = this.ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.Q.value = 1.2;
            bp.frequency.setValueAtTime(600, t0);
            bp.frequency.exponentialRampToValueAtTime(3800, t1);
            const sh = this.ctx.createWaveShaper();
            sh.curve = this.bitCrush(10);
            const g = this.track(this.ctx.createGain());
            g.gain.setValueAtTime(0.0001, t0);
            g.gain.exponentialRampToValueAtTime(0.11, t1 - 0.02);
            g.gain.linearRampToValueAtTime(0, t1);
            n.connect(bp)
                .connect(sh)
                .connect(g)
                .connect(this.out(0.7, { reverb: 0.2 }));

            // 不和谐的拍频：两支相差半音的方波
            for (const m of [62, 63]) {
                const o = this.osc('square', mtof(m), t0, t1 + 0.05);
                const lp = this.ctx.createBiquadFilter();
                lp.type = 'lowpass';
                lp.frequency.setValueAtTime(300, t0);
                lp.frequency.exponentialRampToValueAtTime(2400, t1);
                const og = this.track(this.ctx.createGain());
                og.gain.setValueAtTime(0.0001, t0);
                og.gain.exponentialRampToValueAtTime(0.022, t1 - 0.02);
                og.gain.linearRampToValueAtTime(0, t1);
                o.connect(lp)
                    .connect(og)
                    .connect(this.out(0.7, { pan: m === 62 ? -0.4 : 0.4 }));
            }
        }

        softClip(k) {
            const n = 1024;
            const c = new Float32Array(n);
            for (let i = 0; i < n; i++) {
                const x = (i / (n - 1)) * 2 - 1;
                c[i] = Math.tanh(k * x) / Math.tanh(k);
            }
            return c;
        }

        bitCrush(levels) {
            const n = 1024;
            const c = new Float32Array(n);
            for (let i = 0; i < n; i++) {
                const x = (i / (n - 1)) * 2 - 1;
                c[i] = Math.round(x * levels) / levels;
            }
            return c;
        }

        // 侧链压缩：记录鼓点时间，铺底与次低音在鼓点处被压低，制造"呼吸"的律动
        duck(t0, depth, release = 0.28) {
            this.duckEvents.push([t0, depth, release]);
        }

        sidechain(gainNode, t0s, t1s, level) {
            this.sidechains.push([gainNode, this.at(t0s), this.at(t1s), level]);
        }

        applySidechain() {
            for (const [g, a, b, level] of this.sidechains) {
                for (const [t, depth, rel] of this.duckEvents) {
                    if (t < a + 0.1 || t > b - 0.05 || t < this.ctx.currentTime) continue;
                    g.gain.setValueAtTime(level, t - 0.004);
                    g.gain.linearRampToValueAtTime(level * (1 - depth), t + 0.01);
                    g.gain.setTargetAtTime(level, t + 0.02, rel / 3);
                }
            }
        }

        // ---------- 总谱排程 ----------

        schedule(from) {
            this.duckEvents = [];
            this.sidechains = [];
            const skip = t => t < from - 0.02;

            // —— 序 + 负担：心跳 ——
            S.heart.forEach((t, i) => {
                if (t >= 10) return;
                if (!skip(t)) this.heartbeat(t, true);
                if (!skip(t + S.DUB) && t + S.DUB < 10) this.heartbeat(t + S.DUB, false);
                if (i > 6 && !skip(t)) this.hat(t + 0.25, 0.05);
            });

            // 铺底：D 小调阴暗的长音，随负担加重滤波逐渐打开
            this.pad(0, 4, [50, 57, 62], { level: 0.05, cutoff: [180, 420], attack: 2.5, release: 0.4 });
            this.pad(4, 6, [50, 57, 62, 65], { level: 0.06, cutoff: [400, 700], attack: 0.3, release: 0.2 });
            this.pad(6, 8, [46, 53, 58, 62], { level: 0.065, cutoff: [700, 1100], attack: 0.15, release: 0.2 });
            this.pad(8, 9, [43, 50, 55, 58], { level: 0.07, cutoff: [1100, 1700], attack: 0.1, release: 0.1 });
            this.pad(9, 9.98, [45, 52, 57, 61, 63], { level: 0.075, cutoff: [1700, 3200], attack: 0.08, release: 0.02, detune: 18 });
            this.sub(0.9, 9.98, 26, 0.18, 26);
            this.grit(5.5, 9.98);

            S.words.forEach((w, i) => {
                if (!skip(w.t)) this.blip(w.t, i);
            });

            // —— 静默：真正的空白。混响尾音在切点被掐断，只在第二行字出现时落下一声极轻的钟 ——
            const rv = this.revOut.gain;
            rv.cancelScheduledValues(0);
            rv.setValueAtTime(0.55, this.ctx.currentTime);
            if (from < S.silence.second) {
                rv.setValueAtTime(0.55, this.at(S.silence.cut - 0.02));
                rv.linearRampToValueAtTime(0, this.at(S.silence.cut + 0.01));
                rv.setValueAtTime(0, this.at(S.silence.second - 0.01));
                rv.linearRampToValueAtTime(0.55, this.at(S.silence.second));
            }
            if (!skip(S.silence.second)) this.bell(S.silence.second, 74, 0.06);

            // 吸入，砸向剥离段的第一拍
            if (!skip(11.5)) this.riser(Math.max(11.5, from), 12.0, 0.4);

            // —— 剥离 ——
            S.impacts.forEach(m => {
                if (!skip(m.t)) this.impact(m.t, m.s);
            });
            S.sheds.forEach((t, i) => {
                if (!skip(t) && i > 0) this.kick(t, 0.75);
                if (!skip(t)) this.tick(t + 0.25, 2400 + i * 300, 0.06, i % 2 ? 0.4 : -0.4);
            });
            if (!skip(13.75)) this.riser(Math.max(13.0, from), 14.0, 0.3);

            // 10 字节落位：十个音构成的上行音阶
            const run = [62, 64, 65, 67, 69, 70, 72, 74, 76, 77];
            run.forEach((m, i) => {
                const t = 14.0 + 0.15 + i * 0.05;
                if (!skip(t)) this.pluck(t, m + 12, 0.045, (i / 9) * 1.2 - 0.6);
            });

            this.pad(14, 16, [50, 57, 62, 65, 69], { level: 0.07, cutoff: [600, 1400], attack: 0.05, release: 0.3, reverb: 0.8 });
            this.pad(16, 18, [46, 53, 58, 62, 65], { level: 0.07, cutoff: [800, 1500], attack: 0.1, release: 0.3, reverb: 0.8 });
            this.sub(14, 16, 26, 0.3);
            this.sub(16, 18, 22, 0.3);

            S.flashStrip.forEach(([t], i) => {
                if (!skip(t)) this.tick(t, 3000 + i * 200, 0.08, i % 2 ? 0.3 : -0.3);
            });

            // —— 汇聚：节奏进入 ——
            const prog = [
                [18, [50, 57, 62, 65], 26],
                [20, [46, 53, 58, 62], 22],
                [22, [41, 53, 57, 60], 29],
                [24, [48, 55, 60, 64], 24],
            ];
            prog.forEach(([t, notes, bass]) => {
                if (t >= 24) return;
                this.pad(t, t + 2, notes, { level: 0.06, cutoff: [900, 2200], attack: 0.04, release: 0.12, reverb: 0.6 });
                this.sub(t, t + 2, bass, 0.32);
            });

            S.kicks.forEach(t => {
                if (!skip(t) && t >= 18) this.kick(t, t >= 24 ? 0.8 : 1);
            });
            S.claps.forEach(t => {
                if (!skip(t)) this.clap(t);
            });
            for (let i = 0; i < 24; i++) {
                const t = 18 + i * 0.25;
                if (!skip(t) && i % 2 === 1) this.hat(t, 0.1, i % 4 === 1 ? -0.3 : 0.3);
            }

            // 十六分音符琶音
            const arps = [
                [62, 65, 69, 74, 69, 65],
                [58, 62, 65, 70, 65, 62],
                [60, 65, 69, 72, 69, 65],
            ];
            for (let i = 0; i < 24; i++) {
                const t = 18 + i * 0.25;
                if (skip(t)) continue;
                const chord = arps[Math.min(2, Math.floor(i / 8))];
                const m = chord[i % chord.length] + 12;
                this.pluck(t, m, 0.05 + (i / 24) * 0.02, Math.sin(i * 1.1) * 0.5);
            }

            S.channels.forEach(([t, , ai], i) => {
                if (!skip(t)) this.tick(t, ai ? 3600 : 2800, 0.07, i % 2 ? 0.35 : -0.35);
            });

            if (!skip(23.5)) this.riser(Math.max(23.0, from), 24.0, 0.18);

            // —— 简单：节奏收窄，只留低音、按键与少量鼓 ——
            this.pad(24, 28, [48, 55, 60, 64, 67], { level: 0.045, cutoff: [700, 1400], attack: 0.2, release: 0.3, reverb: 0.9 });
            this.sub(24, 28, 24, 0.22);
            S.typing.forEach((t, i) => {
                if (!skip(t)) this.key(t, i);
            });
            S.phrases.forEach(([t], i) => {
                if (!skip(t)) this.bell(t, [81, 84, 86, 88][i], 0.06, [-0.3, 0.3, -0.15, 0.15][i]);
            });
            if (!skip(27.0)) this.riser(Math.max(27.0, from), 28.0, 0.35);

            // —— 落版 ——
            this.pad(28, 33, [50, 57, 62, 65, 69, 74], {
                level: 0.075,
                cutoff: [2400, 500],
                attack: 0.02,
                release: 2.5,
                reverb: 1.0,
                detune: 7,
            });
            this.sub(28, 31, 26, 0.3);
            [
                [28.0, 74],
                [28.12, 81],
                [28.24, 86],
            ].forEach(([t, m], i) => {
                if (!skip(t)) this.bell(t, m, 0.08, [-0.4, 0.4, 0][i]);
            });
            if (!skip(32)) this.heartbeat(32, true);
            if (!skip(32 + S.DUB)) this.heartbeat(32 + S.DUB, false);

            this.applySidechain();
        }
    }

    return new Engine();
})();
