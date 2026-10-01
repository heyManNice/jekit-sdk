'use strict';
// WebGL2 渲染管线
//   1. 背景着色器：极暗的流动噪声场 + 剥离段的"光膜"
//   2. 粒子：实例化四边形，加法混合写入 HDR 缓冲
//   3. 泛光：阈值提取 → 6 级降采样 → 逐级上采样合成（dual filter）
//   4. 合成：色散、故障切片、ACES 色调映射、饱和度、暗角、胶片颗粒
// 文字由 Canvas2D 绘制后作为纹理叠加在色调映射之后，保证锐利；同时少量注入泛光，带出辉光。

J.GL = (() => {
    const W = 1920;
    const H = 1080;

    const VS_FULL = `#version 300 es
    out vec2 vUv;
    void main() {
        vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
        vUv = p;
        gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
    }`;

    const COMMON = `
    float hash12(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
    }
    float vnoise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x),
                   mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
    }
    float fbm(vec2 p) {
        float s = 0.0, a = 0.5;
        for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
        return s;
    }`;

    const FS_BG = `#version 300 es
    precision highp float;
    in vec2 vUv;
    out vec4 o;
    uniform vec2 uRes;
    uniform float uTime;
    uniform float uAmb;
    uniform vec3 uTint;
    uniform vec4 uMem[4];   // x(屏幕像素，中心为原点), 闪光, 不透明度, 鼓包
    uniform vec2 uOrb;
    ${COMMON}
    void main() {
        vec2 px = vec2(vUv.x - 0.5, 0.5 - vUv.y) * uRes;
        vec2 q = px / uRes.y;
        float t = uTime;

        // 两层域扭曲的噪声，形成缓慢流动的"雾"
        vec2 w = vec2(fbm(q * 1.6 + vec2(t * 0.02, 0.0)), fbm(q * 1.6 + vec2(5.2, t * 0.025)));
        float n = fbm(q * 2.6 + w * 1.8 + vec2(-t * 0.03, t * 0.015));
        vec3 col = uTint * pow(n, 3.2) * uAmb * 1.6;
        col *= smoothstep(1.25, 0.05, length(q * vec2(0.8, 1.0)));

        for (int i = 0; i < 4; i++) {
            vec4 m = uMem[i];
            if (m.z < 0.002) continue;
            float dy = px.y - uOrb.y;
            float bulge = m.w * exp(-dy * dy / (2.0 * 160.0 * 160.0)) * 120.0;
            float x = px.x - m.x - bulge + sin(px.y * 0.018 + t * 4.0 + float(i)) * 2.5;
            float d = abs(x);
            float core = exp(-d * d / 4.5);
            float near = exp(-d / 16.0);
            float far = exp(-d / 160.0);
            float vfade = smoothstep(620.0, 120.0, abs(dy)) ;
            float shimmer = 0.75 + 0.25 * vnoise(vec2(px.y * 0.03, t * 6.0 + float(i) * 7.0));
            vec3 mc = vec3(0.35, 1.0, 0.95);
            col += mc * (core * 1.6 + near * 0.16 + far * 0.012) * vfade * shimmer * m.z * (1.0 + m.y * 2.5);
        }
        o = vec4(col, 1.0);
    }`;

    const VS_PARTICLE = `#version 300 es
    layout(location = 0) in vec2 aCorner;
    layout(location = 1) in vec4 aA;   // x, y, size, alpha
    layout(location = 2) in vec4 aB;   // r, g, b, shape
    uniform vec2 uRes;
    out vec2 vC;
    out vec3 vCol;
    flat out int vShape;
    void main() {
        vC = aCorner;
        vCol = aB.rgb * aA.w;
        vShape = int(aB.w + 0.5);
        vec2 p = aA.xy + aCorner * aA.z * 0.5;
        gl_Position = vec4(p.x / (uRes.x * 0.5), -p.y / (uRes.y * 0.5), 0.0, 1.0);
    }`;

    const FS_PARTICLE = `#version 300 es
    precision highp float;
    in vec2 vC;
    in vec3 vCol;
    flat in int vShape;
    out vec4 o;
    void main() {
        float r2 = dot(vC, vC);
        float a = 0.0;
        if (vShape == 0) {
            // 柔和的高斯光点
            a = exp(-r2 * 7.0) * step(r2, 1.0);
        } else if (vShape == 1) {
            // 字节方块：半透明填充 + 亮边 + 外发光，方块占四边形的 64%
            vec2 q = abs(vC);
            float d = max(q.x, q.y);
            float rr = length(max(q - 0.56, 0.0)) + min(max(q.x, q.y) - 0.56, 0.0);
            float sd = rr - 0.08;
            float fill = 1.0 - smoothstep(-0.01, 0.01, sd);
            float edge = exp(-pow(sd / 0.018, 2.0));
            float glow = exp(-max(sd, 0.0) * 10.0) * 0.4;
            a = fill * 0.07 + edge * 0.9 + glow * 0.55;
            a *= step(d, 1.0);
        } else if (vShape == 2) {
            // 圆环
            float r = sqrt(r2);
            a = exp(-pow((r - 0.86) / 0.045, 2.0)) * step(r, 1.0);
        } else {
            // 宽光晕：1/(1+kr²)，在边缘归零
            const float k = 0.035;
            a = (k / (r2 + k) - k / (1.0 + k)) / (1.0 - k / (1.0 + k));
            a = max(a, 0.0);
        }
        o = vec4(vCol * a, 1.0);
    }`;

    const FS_PREFILTER = `#version 300 es
    precision highp float;
    in vec2 vUv;
    out vec4 o;
    uniform sampler2D uScene;
    uniform sampler2D uText;
    uniform vec2 uTexel;
    uniform float uThreshold;
    uniform float uTextGlow;
    void main() {
        vec3 c = texture(uScene, vUv).rgb * 0.25;
        c += texture(uScene, vUv + uTexel * vec2(-1, -1)).rgb * 0.1875;
        c += texture(uScene, vUv + uTexel * vec2( 1, -1)).rgb * 0.1875;
        c += texture(uScene, vUv + uTexel * vec2(-1,  1)).rgb * 0.1875;
        c += texture(uScene, vUv + uTexel * vec2( 1,  1)).rgb * 0.1875;
        float b = max(c.r, max(c.g, c.b));
        const float knee = 0.5;
        float soft = clamp(b - uThreshold + knee, 0.0, 2.0 * knee);
        soft = soft * soft / (4.0 * knee + 1e-5);
        float k = max(soft, b - uThreshold) / max(b, 1e-5);
        vec4 tx = texture(uText, vUv);
        o = vec4(c * k + tx.rgb * uTextGlow, 1.0);
    }`;

    const FS_DOWN = `#version 300 es
    precision highp float;
    in vec2 vUv;
    out vec4 o;
    uniform sampler2D uTex;
    uniform vec2 uTexel;
    void main() {
        vec2 h = uTexel;
        vec3 c = texture(uTex, vUv).rgb * 4.0;
        c += texture(uTex, vUv - h).rgb;
        c += texture(uTex, vUv + h).rgb;
        c += texture(uTex, vUv + vec2(h.x, -h.y)).rgb;
        c += texture(uTex, vUv - vec2(h.x, -h.y)).rgb;
        o = vec4(c / 8.0, 1.0);
    }`;

    const FS_UP = `#version 300 es
    precision highp float;
    in vec2 vUv;
    out vec4 o;
    uniform sampler2D uTex;
    uniform sampler2D uBase;
    uniform vec2 uTexel;
    uniform float uSpread;
    void main() {
        vec2 h = uTexel * uSpread;
        vec3 c = texture(uTex, vUv + vec2(-h.x * 2.0, 0.0)).rgb;
        c += texture(uTex, vUv + vec2(-h.x, h.y)).rgb * 2.0;
        c += texture(uTex, vUv + vec2(0.0, h.y * 2.0)).rgb;
        c += texture(uTex, vUv + vec2(h.x, h.y)).rgb * 2.0;
        c += texture(uTex, vUv + vec2(h.x * 2.0, 0.0)).rgb;
        c += texture(uTex, vUv + vec2(h.x, -h.y)).rgb * 2.0;
        c += texture(uTex, vUv + vec2(0.0, -h.y * 2.0)).rgb;
        c += texture(uTex, vUv + vec2(-h.x, -h.y)).rgb * 2.0;
        o = vec4(texture(uBase, vUv).rgb + c / 12.0, 1.0);
    }`;

    const FS_COMPOSITE = `#version 300 es
    precision highp float;
    in vec2 vUv;
    out vec4 o;
    uniform sampler2D uScene;
    uniform sampler2D uBloom;
    uniform sampler2D uText;
    uniform vec2 uRes;
    uniform float uTime;
    uniform float uExposure;
    uniform float uBloomAmt;
    uniform float uFlash;
    uniform float uSat;
    uniform float uCA;
    uniform float uGlitch;
    uniform float uVig;
    uniform float uGrain;
    uniform float uFade;
    uniform float uTextAlpha;
    ${COMMON}
    vec3 aces(vec3 x) {
        return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
    }
    void main() {
        vec2 uv = vUv;

        // 故障切片：随机行水平错位
        if (uGlitch > 0.001) {
            float tf = floor(uTime * 30.0);
            float row = floor(uv.y * 54.0);
            float h = hash12(vec2(row, tf));
            if (h > 1.0 - uGlitch * 0.4) {
                uv.x += (hash12(vec2(row * 1.7, tf + 3.0)) - 0.5) * 0.08 * uGlitch;
            }
            float band = step(0.985 - uGlitch * 0.05, hash12(vec2(floor(uv.y * 9.0), tf * 0.37)));
            uv.x += band * 0.012 * uGlitch;
        }

        vec2 d = uv - 0.5;
        vec2 off = d * (0.0015 + uCA * 0.012) * (0.4 + length(d) * 1.6);

        vec3 col;
        col.r = texture(uScene, uv - off).r;
        col.g = texture(uScene, uv).g;
        col.b = texture(uScene, uv + off).b;

        vec3 bl;
        bl.r = texture(uBloom, uv - off * 1.5).r;
        bl.g = texture(uBloom, uv).g;
        bl.b = texture(uBloom, uv + off * 1.5).b;

        col += bl * uBloomAmt;
        col *= uExposure;
        col += vec3(0.75, 1.0, 1.0) * uFlash;
        col = aces(col);

        float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
        col = mix(vec3(l), col, uSat);

        // 暗角
        float v = smoothstep(1.05, 0.2, length(d * vec2(1.0, 0.9)) * 1.25);
        col *= mix(1.0, v, uVig);

        col = pow(col, vec3(1.0 / 2.2));

        // 文字在感知空间叠加（纹理为预乘 alpha）。
        // 细字对色散很敏感，这里只保留冲击时刻的那部分色散，平时保持字色准确。
        vec2 offT = d * uCA * 0.008;
        vec4 tg = texture(uText, uv);
        float tr = texture(uText, uv - offT).r;
        float tb = texture(uText, uv + offT).b;
        vec3 txt = vec3(tr, tg.g, tb);
        float ta = tg.a * uTextAlpha;
        col = col * (1.0 - ta) + txt * uTextAlpha;

        // 胶片颗粒（感知空间中加入）
        float g = hash12(uv * uRes + fract(uTime * 7.13) * 1000.0) - 0.5;
        col += g * uGrain;

        col *= uFade;
        o = vec4(col, 1.0);
    }`;

    function create(canvas) {
        const gl = canvas.getContext('webgl2', {
            antialias: false,
            alpha: false,
            depth: false,
            stencil: false,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance',
        });
        if (!gl) throw new Error('当前浏览器不支持 WebGL2');

        const hdr = !!gl.getExtension('EXT_color_buffer_float') || !!gl.getExtension('EXT_color_buffer_half_float');

        function shader(type, src) {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                throw new Error(gl.getShaderInfoLog(s) + '\n' + src.split('\n').map((l, i) => `${i + 1}: ${l}`).join('\n'));
            }
            return s;
        }

        function program(vs, fs) {
            const p = gl.createProgram();
            gl.attachShader(p, shader(gl.VERTEX_SHADER, vs));
            gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fs));
            gl.linkProgram(p);
            if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
            const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
            const u = {};
            for (let i = 0; i < n; i++) {
                const info = gl.getActiveUniform(p, i);
                const name = info.name.replace(/\[0\]$/, '');
                u[name] = gl.getUniformLocation(p, info.name);
            }
            return { p, u };
        }

        function target(w, h, useHdr = hdr) {
            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(
                gl.TEXTURE_2D, 0,
                useHdr ? gl.RGBA16F : gl.RGBA8,
                w, h, 0, gl.RGBA,
                useHdr ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE,
                null,
            );
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            const fb = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
            if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
                if (useHdr) return target(w, h, false);
                throw new Error('无法创建帧缓冲');
            }
            return { tex, fb, w, h };
        }

        const progs = {
            bg: program(VS_FULL, FS_BG),
            particle: program(VS_PARTICLE, FS_PARTICLE),
            prefilter: program(VS_FULL, FS_PREFILTER),
            down: program(VS_FULL, FS_DOWN),
            up: program(VS_FULL, FS_UP),
            composite: program(VS_FULL, FS_COMPOSITE),
        };

        const scene = target(W, H);
        const LEVELS = 6;
        const down = [];
        const up = [];
        for (let i = 0; i < LEVELS; i++) {
            const w = Math.max(1, W >> (i + 1));
            const h = Math.max(1, H >> (i + 1));
            down.push(target(w, h));
            up.push(target(w, h));
        }

        const emptyVao = gl.createVertexArray();

        // 粒子实例化
        const MAX = 48000;
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        const corner = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, corner);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        const instBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, instBuf);
        gl.bufferData(gl.ARRAY_BUFFER, MAX * 32, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 0);
        gl.vertexAttribDivisor(1, 1);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 32, 16);
        gl.vertexAttribDivisor(2, 1);
        gl.bindVertexArray(null);

        // 文字纹理
        const textTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, textTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));

        function bindTex(unit, tex, loc) {
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.uniform1i(loc, unit);
        }

        function fullscreen(prog, dst) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, dst ? dst.fb : null);
            gl.viewport(0, 0, dst ? dst.w : canvas.width, dst ? dst.h : canvas.height);
            gl.useProgram(prog.p);
            gl.bindVertexArray(emptyVao);
        }

        function render(frame, overlay) {
            const P = frame.post;

            // 文字纹理上传
            gl.bindTexture(gl.TEXTURE_2D, textTex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, overlay);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

            // 1. 背景
            gl.disable(gl.BLEND);
            fullscreen(progs.bg, scene);
            const u = progs.bg.u;
            gl.uniform2f(u.uRes, W, H);
            gl.uniform1f(u.uTime, P.bgTime);
            gl.uniform1f(u.uAmb, P.amb);
            gl.uniform3fv(u.uTint, P.tint);
            gl.uniform4fv(u.uMem, P.mem);
            gl.uniform2fv(u.uOrb, P.orb);
            gl.drawArrays(gl.TRIANGLES, 0, 3);

            // 2. 粒子
            if (frame.count > 0) {
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.useProgram(progs.particle.p);
                gl.uniform2f(progs.particle.u.uRes, W, H);
                gl.bindVertexArray(vao);
                gl.bindBuffer(gl.ARRAY_BUFFER, instBuf);
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, frame.inst, 0, frame.count * 8);
                gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, frame.count);
                gl.disable(gl.BLEND);
            }

            // 3. 泛光
            fullscreen(progs.prefilter, down[0]);
            bindTex(0, scene.tex, progs.prefilter.u.uScene);
            bindTex(1, textTex, progs.prefilter.u.uText);
            gl.uniform2f(progs.prefilter.u.uTexel, 1 / W, 1 / H);
            gl.uniform1f(progs.prefilter.u.uThreshold, P.threshold);
            gl.uniform1f(progs.prefilter.u.uTextGlow, P.textGlow);
            gl.drawArrays(gl.TRIANGLES, 0, 3);

            for (let i = 1; i < LEVELS; i++) {
                fullscreen(progs.down, down[i]);
                bindTex(0, down[i - 1].tex, progs.down.u.uTex);
                gl.uniform2f(progs.down.u.uTexel, 0.5 / down[i - 1].w, 0.5 / down[i - 1].h);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
            }

            for (let i = LEVELS - 2; i >= 0; i--) {
                const src = i === LEVELS - 2 ? down[LEVELS - 1] : up[i + 1];
                fullscreen(progs.up, up[i]);
                bindTex(0, src.tex, progs.up.u.uTex);
                bindTex(1, down[i].tex, progs.up.u.uBase);
                gl.uniform2f(progs.up.u.uTexel, 0.5 / src.w, 0.5 / src.h);
                gl.uniform1f(progs.up.u.uSpread, 1.0);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
            }

            // 4. 合成
            fullscreen(progs.composite, null);
            const c = progs.composite.u;
            bindTex(0, scene.tex, c.uScene);
            bindTex(1, up[0].tex, c.uBloom);
            bindTex(2, textTex, c.uText);
            gl.uniform2f(c.uRes, canvas.width, canvas.height);
            gl.uniform1f(c.uTime, frame.t);
            gl.uniform1f(c.uExposure, P.exposure);
            gl.uniform1f(c.uBloomAmt, P.bloom);
            gl.uniform1f(c.uFlash, P.flash);
            gl.uniform1f(c.uSat, P.sat);
            gl.uniform1f(c.uCA, P.ca);
            gl.uniform1f(c.uGlitch, P.glitch);
            gl.uniform1f(c.uVig, P.vig);
            gl.uniform1f(c.uGrain, P.grain);
            gl.uniform1f(c.uFade, P.fade);
            gl.uniform1f(c.uTextAlpha, P.textAlpha);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        return { render, hdr, MAX };
    }

    return { create, W, H };
})();
