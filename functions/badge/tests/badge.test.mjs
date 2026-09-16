import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderBadgeSvg } from '../src/badge/render-svg.ts';
import { BADGE_METRICS, BADGE_STYLES } from '../src/config/options.ts';
import { formatRegistrationAge, sumDailyValues } from '../src/stats/format.ts';

const calls = [];
const rawCalls = [];
let upstreamStatus = 200;
const dayInMs = 24 * 60 * 60 * 1000;
// stats 二进制响应：两个 u64，六个 u32，之后为其余字段。
const values = [9007199254740993n, 27n, 303, 404, 505, 606, 707, 808];
const statsMetadata = {
    subPageCount: 12,
    pageLimitForSite: 100,
    registeredAt: BigInt(Date.now() - Math.floor(9.5 * dayInMs)),
};
const dailyValues = {
    dailyRequestForSite: [1, 2, 3, 4, 5, 6, 7],
    dailyRequestForPage: [2, 3, 4, 5, 6, 7, 8],
    dailyVisitorForSite: [1, 1, 1, 1, 1, 1, 1],
    dailyVisitorForPage: [0, 1, 0, 1, 0, 1, 0],
};
const performanceHistograms = {
    ttfb: Array(256).fill(0),
    plt: Array(256).fill(0),
};
performanceHistograms.ttfb[20] = 74;
performanceHistograms.ttfb[42] = 1;
performanceHistograms.ttfb[80] = 25;
performanceHistograms.ttfb[254] = 10_000;
performanceHistograms.ttfb[255] = 10_000;
performanceHistograms.plt[100] = 75;
performanceHistograms.plt[200] = 25;

globalThis.fetch = async (input, init) => {
    rawCalls.push({ input, init });
    const request = new Request(input, init);
    calls.push(request);
    if (upstreamStatus !== 200) return new Response(null, { status: upstreamStatus });
    if (new URL(request.url).pathname === '/performance') {
        const buffer = new ArrayBuffer(256 * 4 * 2);
        const view = new DataView(buffer);
        performanceHistograms.ttfb.forEach((value, index) => view.setUint32(index * 4, value, true));
        performanceHistograms.plt.forEach((value, index) => view.setUint32((256 + index) * 4, value, true));
        return new Response(buffer);
    }
    const buffer = new ArrayBuffer(164);
    const view = new DataView(buffer);
    view.setBigUint64(0, values[0], true);
    view.setBigUint64(8, values[1], true);
    values.slice(2).forEach((value, i) => view.setUint32(16 + i * 4, value, true));
    view.setUint16(40, statsMetadata.subPageCount, true);
    view.setUint16(42, statsMetadata.pageLimitForSite, true);
    view.setBigUint64(44, statsMetadata.registeredAt, true);
    Object.values(dailyValues).forEach((daily, arrayIndex) => {
        daily.forEach((value, valueIndex) => {
            view.setUint32(52 + arrayIndex * 28 + valueIndex * 4, value, true);
        });
    });
    return new Response(buffer);
};
const { default: worker } = await import('../dist/index.js');
const ctx = { waitUntil() {}, passThroughOnException() {} };
const targetUrl = 'https://jekit.cn/stats/';
const query = '?url=' + encodeURIComponent(targetUrl);
const request = (path, method = 'GET') => worker.fetch(new Request('https://badge.test' + path, { method }), {}, ctx);
const metrics = Object.entries(BADGE_METRICS);
const statsMetrics = metrics.filter(([, metric]) => metric.source === 'stats');
const styles = Object.entries(BADGE_STYLES);
const scalarStatsValues = {
    pv: values[0],
    ppv: values[1],
    uv: values[2],
    puv: values[3],
    tpv: values[4],
    tppv: values[5],
    tuv: values[6],
    tpuv: values[7],
    pg: statsMetadata.subPageCount,
};

test('四种样式 × 直出统计指标均返回对应值，并保留大整数精度', async () => {
    for (const [styleName, style] of styles) {
        for (const [metricName, metric] of statsMetrics) {
            const response = await request('/' + styleName + '/' + metricName + query);
            assert.equal(response.status, 200);
            assert.equal(response.headers.get('Content-Type'), 'image/svg+xml;charset=utf-8');
            assert.equal(response.headers.get('Cache-Control'), 'public, max-age=3600');
            const svg = await response.text();
            assert.ok(svg.includes('aria-label="' + metric.label + ': ' + scalarStatsValues[metricName] + '"'));
            assert.ok(svg.includes('height="' + style.height + '"'));
        }
    }
    assert.equal(calls.at(-1).headers.get('x-query-domain'), 'https://jekit.cn');
    assert.equal(calls.at(-1).headers.get('Origin'), 'https://badge.jekit.cn');
});

test('近 7 日、页面数和接入天数指标使用 stats 返回值', async () => {
    const expected = {
        pv7: '近7日PV: 28',
        ppv7: '近7日页面PV: 35',
        uv7: '近7日UV: 7',
        puv7: '近7日页面UV: 3',
        pg: '页面数: 12',
        age: '接入天数: 10',
    };

    for (const [styleName] of styles) {
        for (const [metric, text] of Object.entries(expected)) {
            const response = await request('/' + styleName + '/' + metric + query);
            assert.equal(response.status, 200);
            assert.ok((await response.text()).includes('aria-label="' + text + '"'));
        }
    }
});

test('统计派生值处理空接入时间和日期边界', async () => {
    assert.equal(sumDailyValues([1, 2, 3]), '6');
    assert.equal(formatRegistrationAge(1_000n, 1_000), '1');
    assert.equal(formatRegistrationAge(1_000n, 1_000 + dayInMs), '2');
    assert.equal(formatRegistrationAge(0n, 1_000), null);

    const registeredAt = statsMetadata.registeredAt;
    statsMetadata.registeredAt = 0n;
    try {
        const response = await request('/flat/age' + query);
        const svg = await response.text();
        assert.ok(svg.includes('aria-label="接入天数: 无数据"'));
        assert.ok(svg.includes('fill="#9f9f9f"'));
    } finally {
        statsMetadata.registeredAt = registeredAt;
    }
});

test('TTFB 和 PLT 分别计算 P75，并忽略 254、255', async () => {
    for (const [styleName, style] of styles) {
        const ttfbValue = style.fontWeight === 700 ? '420MS' : '420ms';
        const pltValue = style.fontWeight === 700 ? '1S' : '1s';
        const ttfb = await request('/' + styleName + '/ttfb' + query);
        assert.equal(ttfb.status, 200);
        assert.ok((await ttfb.text()).includes('aria-label="TTFB P75: ' + ttfbValue + '"'));

        const plt = await request('/' + styleName + '/plt' + query);
        assert.equal(plt.status, 200);
        assert.ok((await plt.text()).includes('aria-label="PLT P75: ' + pltValue + '"'));
    }
    assert.equal(new URL(calls.at(-1).url).pathname, '/performance');
    assert.equal(calls.at(-1).headers.get('x-query-domain'), 'https://jekit.cn');
    assert.equal(typeof rawCalls.at(-1).input, 'string');
    assert.equal(rawCalls.at(-1).init.body.byteLength, 0);
});

test('性能时间桶包含 0 和 253，无有效样本时显示无数据', async () => {
    performanceHistograms.ttfb.fill(0);
    performanceHistograms.plt.fill(0);
    performanceHistograms.ttfb[253] = 1;
    performanceHistograms.ttfb[254] = 100;
    performanceHistograms.ttfb[255] = 100;
    performanceHistograms.plt[254] = 100;
    performanceHistograms.plt[255] = 100;

    try {
        const ttfb = await request('/flat/ttfb' + query);
        assert.ok((await ttfb.text()).includes('aria-label="TTFB P75: ≥2.53s"'));

        const emptyPlt = await request('/flat/plt' + query);
        const emptySvg = await emptyPlt.text();
        assert.ok(emptySvg.includes('aria-label="PLT P75: 无数据"'));
        assert.ok(emptySvg.includes('fill="#9f9f9f"'));

        performanceHistograms.plt[0] = 1;
        const zeroPlt = await request('/flat/plt' + query);
        assert.ok((await zeroPlt.text()).includes('aria-label="PLT P75: 0ms"'));
    } finally {
        performanceHistograms.ttfb.fill(0);
        performanceHistograms.plt.fill(0);
        performanceHistograms.ttfb[20] = 74;
        performanceHistograms.ttfb[42] = 1;
        performanceHistograms.ttfb[80] = 25;
        performanceHistograms.ttfb[254] = 10_000;
        performanceHistograms.ttfb[255] = 10_000;
        performanceHistograms.plt[100] = 75;
        performanceHistograms.plt[200] = 25;
    }
});

test('无效路由和参数不会访问上游', async () => {
    const count = calls.length;
    for (const [path, status] of [
        ['/?query=https://jekit.cn/stats/', 400],
        ['/flat', 404], ['/flat/totalRequestForSite/extra' + query, 404],
        ['/unknown/totalRequestForSite' + query, 400], ['/flat/unknown' + query, 400],
        ['/toString/totalRequestForSite' + query, 400], ['/flat/__proto__' + query, 400],
        ['/flat/subPageCount' + query, 400], ['/favicon.ico', 404],
    ]) {
        const response = await request(path);
        assert.equal(response.status, status, path);
        assert.equal(response.headers.get('Content-Type'), 'image/svg+xml;charset=utf-8');
        assert.equal(response.headers.get('Cache-Control'), 'no-store');
        assert.match(await response.text(), /^<\?xml[\s\S]*<svg/);
    }
    const post = await request('/' + query, 'POST');
    assert.equal(post.status, 405);
    assert.equal(post.headers.get('Allow'), 'GET, HEAD');
    assert.equal(post.headers.get('Content-Type'), 'image/svg+xml;charset=utf-8');
    assert.ok((await post.text()).includes('仅支持 GET 或 HEAD'));
    assert.equal(calls.length, count);
});

test('不带参数访问根路径时永久重定向到 Badge 文档', async () => {
    const count = calls.length;
    const response = await request('/');
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('Location'), 'https://jekit.cn/docs/more/badge/');
    assert.equal(await response.text(), '');
    assert.equal(calls.length, count);
});

test('只接受 url 参数和指标简写', async () => {
    const response = await request('/flat/pv?url=https%3A%2F%2Fjekit.cn%2Fstats%2F');
    assert.equal(response.status, 200);
    assert.equal(calls.at(-1).headers.get('x-query-domain'), 'https://jekit.cn');
    const count = calls.length;
    for (const path of ['/flat/pv?query=https://jekit.cn/stats/', '/flat/pv?url=', '/flat/pv?url=not a url', '/flat/toString?url=https://jekit.cn/stats/', '/flat/totalRequestForSite?url=https://jekit.cn/stats/', '/__proto__/pv?url=https://jekit.cn/stats/']) {
        assert.equal((await request(path)).status, 400);
    }
    for (const style of ['f', 'fs', 'p', 'ftb']) {
        assert.equal((await request('/' + style + '/pv?url=https://jekit.cn/stats/')).status, 400);
    }
    assert.equal(calls.length, count);
});

test('URL 解析与统计面板一致', async () => {
    const page = 'jekit.cn/stats/?id=1&doc=2%23/route?aid=3';
    await request('/flat/ppv?url=' + page);
    const shorthandCall = calls.at(-1);
    const shorthandBody = Buffer.from(await shorthandCall.clone().arrayBuffer());
    assert.equal(shorthandCall.headers.get('x-query-domain'), 'https://jekit.cn');

    const complete = 'https://jekit.cn/stats/?id=1&doc=2#/route?aid=3';
    await request('/flat/ppv?url=' + encodeURIComponent(complete));
    const encodedBody = Buffer.from(await calls.at(-1).clone().arrayBuffer());
    assert.deepEqual(shorthandBody, encodedBody);

    await request('/flat/ppv?url=https://jekit.cn/stats/');
    const pathnameOnlyBody = Buffer.from(await calls.at(-1).clone().arrayBuffer());
    assert.notDeepEqual(shorthandBody, pathnameOnlyBody);
});

test('根路径默认值、末尾斜杠和 HEAD', async () => {
    assert.equal(await (await request('/' + query)).text(), await (await request('/flat/pv/' + query)).text());
    const response = await request('/plastic/puv' + query, 'HEAD');
    assert.equal(response.status, 200);
    assert.equal(await response.text(), '');
    assert.equal(response.headers.get('Content-Type'), 'image/svg+xml;charset=utf-8');
});

test('上游错误返回不缓存的 SVG 502', async () => {
    upstreamStatus = 503;
    const originalConsoleError = console.error;
    console.error = () => {};
    try {
        const response = await request('/' + query);
        assert.equal(response.status, 502);
        assert.equal(response.headers.get('Content-Type'), 'image/svg+xml;charset=utf-8');
        assert.equal(response.headers.get('Cache-Control'), 'no-store');
        const svg = await response.text();
        assert.ok(svg.includes('aria-label="Jekit: 统计服务暂时不可用"'));
        assert.ok(svg.includes('fill="#e05d44"'));
    } finally {
        upstreamStatus = 200;
        console.error = originalConsoleError;
    }
});

test('HEAD 错误响应保留 SVG 响应头且不返回正文', async () => {
    const response = await request('/flat/pv', 'HEAD');
    assert.equal(response.status, 400);
    assert.equal(response.headers.get('Content-Type'), 'image/svg+xml;charset=utf-8');
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(await response.text(), '');
});

test('SVG 转义与样式特征', () => {
    const escaped = renderBadgeSvg(
        { label: '中文 <PV> & "UV"', value: '123' },
        { valueColor: '#4c1" onload="bad' },
    );
    assert.ok(escaped.includes('&lt;PV&gt; &amp; &quot;UV&quot;'));
    assert.ok(!escaped.includes(' onload="bad'));
    assert.ok(renderBadgeSvg({ label: '中文 Pv', value: '123' }, { style: 'for-the-badge' }).includes('中文 PV'));
    assert.ok(!renderBadgeSvg({ label: 'PV', value: '123' }, { style: 'flat-square' }).includes('linearGradient'));
    assert.ok(renderBadgeSvg({ label: 'PV', value: '123' }, { style: 'plastic' }).includes('stop-opacity=".7"'));
    assert.ok(renderBadgeSvg({ label: 'PV', value: '123' }).includes('rx="3"'));
});
