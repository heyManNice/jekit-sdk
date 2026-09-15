import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderBadgeSvg } from '../src/badge/render-svg.ts';
import { BADGE_METRICS, BADGE_STYLES } from '../src/config/options.ts';

const calls = [];
let upstreamStatus = 200;
// stats 二进制响应：两个 u64，六个 u32，之后为其余字段。
const values = [9007199254740993n, 27n, 303, 404, 505, 606, 707, 808];
globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    calls.push(request);
    if (upstreamStatus !== 200) return new Response(null, { status: upstreamStatus });
    const buffer = new ArrayBuffer(164);
    const view = new DataView(buffer);
    view.setBigUint64(0, values[0], true);
    view.setBigUint64(8, values[1], true);
    values.slice(2).forEach((value, i) => view.setUint32(16 + i * 4, value, true));
    return new Response(buffer);
};
const { default: worker } = await import('../dist/index.js');
const ctx = { waitUntil() {}, passThroughOnException() {} };
const targetUrl = 'https://jekit.cn/stats/';
const query = '?url=' + encodeURIComponent(targetUrl);
const request = (path, method = 'GET') => worker.fetch(new Request('https://badge.test' + path, { method }), {}, ctx);
const metrics = Object.entries(BADGE_METRICS);
const styles = Object.entries(BADGE_STYLES);

test('四种样式 × 八个指标均返回对应统计值，并保留大整数精度', async () => {
    for (const [styleName, style] of styles) {
        for (const [i, [metricName, metric]] of metrics.entries()) {
            const response = await request('/' + styleName + '/' + metricName + query);
            assert.equal(response.status, 200);
            assert.equal(response.headers.get('Content-Type'), 'image/svg+xml;charset=utf-8');
            assert.equal(response.headers.get('Cache-Control'), 'public, max-age=3600');
            const svg = await response.text();
            assert.ok(svg.includes('aria-label="' + metric.label + ': ' + values[i] + '"'));
            assert.ok(svg.includes('height="' + style.height + '"'));
        }
    }
    assert.equal(calls.at(-1).headers.get('x-query-domain'), 'https://jekit.cn');
    assert.equal(calls.at(-1).headers.get('Origin'), 'https://badge.jekit.cn');
});

test('无效路由和参数不会访问上游', async () => {
    const count = calls.length;
    for (const [path, status] of [
        ['/', 400], ['/?query=https://jekit.cn/stats/', 400],
        ['/flat', 404], ['/flat/totalRequestForSite/extra' + query, 404],
        ['/unknown/totalRequestForSite' + query, 400], ['/flat/unknown' + query, 400],
        ['/toString/totalRequestForSite' + query, 400], ['/flat/__proto__' + query, 400],
        ['/flat/subPageCount' + query, 400], ['/favicon.ico', 404],
    ]) assert.equal((await request(path)).status, status, path);
    const post = await request('/' + query, 'POST');
    assert.equal(post.status, 405);
    assert.equal(post.headers.get('Allow'), 'GET, HEAD');
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

test('上游错误返回不缓存的 502', async () => {
    upstreamStatus = 503;
    const originalConsoleError = console.error;
    console.error = () => {};
    try {
        const response = await request('/' + query);
        assert.equal(response.status, 502);
        assert.equal(response.headers.get('Cache-Control'), 'no-store');
        assert.equal(await response.text(), '统计服务暂时不可用');
    } finally {
        upstreamStatus = 200;
        console.error = originalConsoleError;
    }
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
