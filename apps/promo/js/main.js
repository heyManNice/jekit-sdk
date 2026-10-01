'use strict';
// 播放器：时钟、渲染循环、键盘控制、进度条与录制。

(() => {
    const S = J.score;
    const audio = J.Audio;
    const canvas = document.getElementById('stage');
    const ui = {
        root: document.body,
        start: document.getElementById('start'),
        bar: document.getElementById('bar'),
        fill: document.getElementById('fill'),
        marks: document.getElementById('marks'),
        time: document.getElementById('time'),
        section: document.getElementById('section'),
        hud: document.getElementById('hud'),
        error: document.getElementById('error'),
    };

    const params = new URLSearchParams(location.search);
    const debug = params.has('debug');

    let renderer;
    try {
        renderer = J.GL.create(canvas);
    } catch (e) {
        ui.error.textContent = String(e.message || e);
        ui.error.hidden = false;
        throw e;
    }

    // ---------------------------------------------------------------- 时钟
    // 有声音时以 AudioContext 为准；静音预览（?mute）时用 performance.now()

    const clock = {
        playing: false,
        base: 0,
        offset: Number(params.get('t')) || 0,
        muted: params.has('mute'),
        get time() {
            if (!this.playing) return this.offset;
            return this.muted ? (performance.now() - this.base) / 1000 : audio.time;
        },
        async play(from = this.time) {
            if (from >= S.DURATION - 0.05) from = 0;
            this.offset = from;
            if (this.muted) this.base = performance.now() - from * 1000;
            else await audio.play(from);
            this.playing = true;
            ui.root.classList.add('playing');
        },
        pause() {
            this.offset = this.time;
            this.playing = false;
            if (!this.muted) audio.pause();
            ui.root.classList.remove('playing');
        },
        seek(t) {
            t = Math.max(0, Math.min(S.DURATION, t));
            if (this.playing) this.play(t);
            else this.offset = t;
        },
    };

    // ---------------------------------------------------------------- 尺寸
    // 画布固定 1920×1080 内部分辨率，CSS 按比例缩放并居中

    function fit() {
        const s = Math.min(innerWidth / 1920, innerHeight / 1080);
        canvas.style.width = `${1920 * s}px`;
        canvas.style.height = `${1080 * s}px`;
    }
    addEventListener('resize', fit);
    fit();
    canvas.width = 1920;
    canvas.height = 1080;

    // ---------------------------------------------------------------- 进度条

    S.sections.forEach(s => {
        const m = document.createElement('div');
        m.className = 'mark';
        m.style.left = `${(s.t / S.DURATION) * 100}%`;
        m.title = s.name;
        ui.marks.appendChild(m);
    });

    function seekFromEvent(e) {
        const r = ui.bar.getBoundingClientRect();
        clock.seek(((e.clientX - r.left) / r.width) * S.DURATION);
    }
    let dragging = false;
    ui.bar.addEventListener('pointerdown', e => {
        dragging = true;
        ui.bar.setPointerCapture(e.pointerId);
        seekFromEvent(e);
    });
    ui.bar.addEventListener('pointermove', e => dragging && seekFromEvent(e));
    ui.bar.addEventListener('pointerup', () => (dragging = false));

    // ---------------------------------------------------------------- 控制

    ui.start.addEventListener('click', () => {
        ui.root.classList.add('started');
        clock.play(clock.offset);
    });

    canvas.addEventListener('click', () => {
        if (!ui.root.classList.contains('started')) return;
        clock.playing ? clock.pause() : clock.play();
    });

    const bars = () => S.sections.map(s => s.t);
    addEventListener('keydown', e => {
        if (e.repeat && e.code === 'Space') return;
        const t = clock.time;
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                ui.root.classList.add('started');
                clock.playing ? clock.pause() : clock.play();
                break;
            case 'ArrowRight':
                clock.seek(e.shiftKey ? bars().find(b => b > t + 0.05) ?? S.DURATION : t + 2);
                break;
            case 'ArrowLeft':
                clock.seek(e.shiftKey ? [...bars()].reverse().find(b => b < t - 0.3) ?? 0 : t - 2);
                break;
            case 'Comma':
                clock.seek(t - 1 / 30);
                break;
            case 'Period':
                clock.seek(t + 1 / 30);
                break;
            case 'Home':
                clock.seek(0);
                break;
            case 'KeyH':
                ui.root.classList.toggle('hide-ui');
                break;
            case 'KeyF':
                document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
                break;
            case 'KeyR':
                record();
                break;
            default:
                if (/^Digit[0-6]$/.test(e.code)) {
                    const s = S.sections[Number(e.code.slice(5))];
                    if (s) clock.seek(s.t);
                }
        }
    });

    // ---------------------------------------------------------------- 录制
    // 从 0 秒完整播放一遍，同时录下画布与混音，导出 webm

    let recording = false;
    async function record() {
        if (recording || clock.muted) return;
        recording = true;
        ui.root.classList.add('started', 'recording', 'hide-ui');
        audio.ensure();
        const stream = canvas.captureStream(60);
        audio.recordDest.stream.getAudioTracks().forEach(tr => stream.addTrack(tr));
        const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
            .find(m => MediaRecorder.isTypeSupported(m));
        const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 24_000_000 });
        const chunks = [];
        rec.ondataavailable = e => e.data.size && chunks.push(e.data);
        rec.onstop = () => {
            const url = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'jekit-promo.webm';
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 10_000);
            recording = false;
            ui.root.classList.remove('recording', 'hide-ui');
        };
        await clock.play(0);
        rec.start(250);
        const stopAt = () => {
            if (clock.time >= S.DURATION) {
                rec.stop();
                clock.pause();
            } else requestAnimationFrame(stopAt);
        };
        stopAt();
    }

    // ---------------------------------------------------------------- 渲染循环

    function fmt(t) {
        return `${t.toFixed(2).padStart(5, '0')} / ${S.DURATION.toFixed(0)}`;
    }

    let fpsAcc = 0;
    let fpsN = 0;
    let fpsLast = performance.now();
    let fps = 0;

    function loop() {
        let t = clock.time;
        if (clock.playing && t >= S.DURATION) {
            clock.pause();
            clock.offset = S.DURATION;
            t = S.DURATION;
        }
        const f = J.Film.frame(Math.min(t, S.DURATION - 1e-3));
        renderer.render(f, J.Film.overlay);

        ui.fill.style.width = `${(t / S.DURATION) * 100}%`;
        ui.time.textContent = fmt(t);
        const sec = [...S.sections].reverse().find(s => t >= s.t);
        ui.section.textContent = sec ? sec.name : '';

        const now = performance.now();
        fpsAcc += now - fpsLast;
        fpsLast = now;
        if (++fpsN === 30) {
            fps = 30000 / fpsAcc;
            fpsAcc = 0;
            fpsN = 0;
        }
        if (debug) ui.hud.textContent = `${fps.toFixed(0)} fps · ${f.count} particles · ${renderer.hdr ? 'HDR' : 'LDR'}`;

        requestAnimationFrame(loop);
    }

    // ---------------------------------------------------------------- 启动

    // 供自动化截图使用：渲染指定时刻的一帧
    window.__renderAt = t => {
        const f = J.Film.frame(t);
        renderer.render(f, J.Film.overlay);
        return f.count;
    };

    const img = new Image();
    img.onload = () => {
        J.Film.init(img);
        if (debug) ui.hud.hidden = false;
        if (params.has('t')) ui.root.classList.add('started');
        if (params.has('autoplay')) {
            ui.root.classList.add('started');
            clock.play(clock.offset);
        }
        loop();
    };
    img.onerror = () => {
        J.Film.init(null);
        loop();
    };
    img.src = J.LOGO;
})();
