'use strict';
// 总谱：画面与声音共用的唯一时间表。120 BPM，一拍 0.5s，一小节 2s。
// 心跳、鼓点、冲击、文字切换都从这里取时间，保证音画在同一时刻发生。

J.score = (() => {
    const DURATION = 35;

    const sections = [
        { t: 0, name: '序' },
        { t: 4, name: '负担' },
        { t: 10, name: '静默' },
        { t: 12, name: '剥离' },
        { t: 18, name: '汇聚' },
        { t: 24, name: '简单' },
        { t: 28, name: '落版' },
    ];

    // 心跳：开场平稳，负担段逐渐加速
    const heart = [0.9, 1.9, 2.9, 3.9, 4.8, 5.6, 6.3, 6.95, 7.5, 8.0, 8.45, 8.85, 9.2, 9.5, 9.76];
    const DUB = 0.16;
    const heartAll = heart
        .flatMap(t => [t, t + DUB])
        .filter(t => t < 10)
        .concat([32, 32 + DUB])
        .sort((a, b) => a - b);

    // 负担段：被采集的数据碎片。a 为出现方向（弧度，y 轴向上）
    const words = [
        { t: 4.4, k: 'URL', v: '/blog/how-to?uid=88123', a: 0.35 },
        { t: 4.95, k: 'Cookie', v: '_ga=GA1.2.1736452…', a: 2.75 },
        { t: 5.5, k: 'IP', v: '203.0.113.42', a: -2.0 },
        { t: 6.05, k: 'User-Agent', v: 'Mozilla/5.0 (Windows NT 10.0; …', a: -0.75 },
        { t: 6.6, k: 'Referrer', v: 'google.com/search?q=…', a: 1.55 },
        { t: 7.1, k: '设备指纹', v: 'a91f·03c2·77de', a: 3.55 },
        { t: 7.55, k: '访客 ID', v: 'u_7f3e41aa', a: -1.35 },
        { t: 7.95, k: '停留时长', v: '128 s', a: 0.9 },
        { t: 8.3, k: '点击坐标', v: '(812, 344)', a: 2.25 },
        { t: 8.62, k: '滚动深度', v: '76%', a: -2.6 },
        { t: 8.9, k: '屏幕', v: '1920 × 1080', a: 0.05 },
        { t: 9.15, k: '时区', v: 'UTC+8', a: 3.0 },
        { t: 9.38, k: '语言', v: 'zh-CN', a: -0.4 },
        { t: 9.58, k: '电量', v: '64%', a: 1.95 },
    ];

    const impacts = [
        { t: 12.0, s: 1.0, flash: 0.5, shake: 1.0 },
        { t: 14.0, s: 1.15, flash: 0.65, shake: 0.85 },
        { t: 18.0, s: 0.6, flash: 0.22, shake: 0.35 },
        { t: 28.0, s: 0.9, flash: 0.32, shake: 0.5 },
        { t: 29.0, s: 0.45, flash: 0.2, shake: 0.12 },
    ];

    // 穿过边界：每拍剥落一层
    const sheds = [12.0, 12.5, 13.0, 13.5];

    const kicks = [14.0, 14.75, 16.0, 16.75];
    for (let i = 0; i < 12; i++) kicks.push(18 + i * 0.5);
    kicks.push(24.0, 25.0, 26.0, 27.0, 27.5);

    const claps = [15.0, 17.0];
    for (let i = 0; i < 6; i++) claps.push(18.5 + i);

    // 静默段：文字分两次出现，第二次落下一声极轻的钟
    const silence = { cut: 10.0, first: 10.25, second: 10.85, riser: 11.5 };

    const flashStrip = [
        [15.5, '无 Cookie'],
        [16.0, '无访客 ID'],
        [16.5, '无设备指纹'],
        [17.0, '无 URL'],
    ];

    const metrics = [
        [20.0, '访问量'],
        [20.5, '访客数'],
        [21.0, '来源渠道'],
        [21.5, '网站性能'],
    ];

    // 第三项为 1 表示 AI 渠道
    const channels = [
        [22.0, 'Google', 0],
        [22.25, 'ChatGPT', 1],
        [22.5, '百度', 0],
        [22.75, 'DeepSeek', 1],
        [23.0, 'Bing', 0],
        [23.25, 'Kimi', 1],
        [23.5, '豆包', 1],
        [23.75, 'Claude', 1],
    ];

    // 一次真实的 /greet 请求体：按 packages/core 的 schema 编码
    // 访客状态 1 · 来源 ChatGPT(9) · 页面哈希 fnv1a32("/blogs/20260802-2006/") · Chrome(2) · Windows(2) · TTFB 118ms→12 · PLT 476ms→48
    const bytes = [0x01, 0x09, 0x60, 0x8d, 0x87, 0x1c, 0x02, 0x02, 0x0c, 0x30];

    const code = 'npm i jekit-react';
    const typing = Array.from(code, (_, i) => 24.08 + i * 0.05);

    const phrases = [
        [24.0, '一条命令'],
        [25.0, '无需注册'],
        [26.0, '完全免费'],
        [27.0, '开源透明'],
    ];

    return {
        DURATION, sections, heart, DUB, heartAll, words, impacts, sheds, kicks, claps,
        silence, flashStrip, metrics, channels, bytes, code, typing, phrases,
    };
})();
