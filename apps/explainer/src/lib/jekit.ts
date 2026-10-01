// 视频里出现的协议字节、页面哈希和徽章都由仓库里的真实代码现场计算，
// 而不是手写的假数据：协议或徽章渲染一旦变化，重新渲染视频即可保持一致。
//
// 这里刻意只引用纯函数模块（不经过 jekit-core 的入口文件），
// 避免把 fetch、history-events 等浏览器副作用带进 Remotion 的渲染进程。
import { encode } from '../../../../packages/core/src/protocol/encoder';
import { dto } from '../../../../packages/core/src/schema/greet';
import { getHashOfPagePath } from '../../../../packages/core/src/utils/uri';
import {
    visitorStatusOption,
    whereWasIFromOption,
    whichBrowserOption,
    whichOsOption,
} from '../../../../packages/core/src/schema/options';
import { renderBadgeSvg } from '../../../../functions/badge/src/badge/render-svg.ts';
import type { BadgeStyle } from '../../../../functions/badge/src/config/options.ts';

// ---- 示例访问：从 ChatGPT 点进一篇博客 ----

export const SAMPLE_PATH = '/blogs/20260802-2006/';
export const SAMPLE_REFERRER = 'https://chatgpt.com/';
export const SAMPLE_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
export const SAMPLE_TTFB_MS = 118;
export const SAMPLE_PLT_MS = 476;

/** 与 core 中 getPerformanceMetrics 相同的量化规则：10ms 一档，封顶 253 */
function quantize(ms: number): number {
    return Math.max(0, Math.min(253, Math.ceil(ms / 10)));
}

export const samplePathHash = getHashOfPagePath(SAMPLE_PATH);

export const samplePayload = {
    visitorStatus: visitorStatusOption.NewUser_TodayNewSite_TodayNewPage,
    whereWasIFrom: whereWasIFromOption.ChatGPT,
    theHashOfPath: samplePathHash,
    whichBrowser: whichBrowserOption.Chrome,
    whichOS: whichOsOption.Windows,
    ttfb: quantize(SAMPLE_TTFB_MS),
    plt: quantize(SAMPLE_PLT_MS),
} as const;

const buffer = encode(dto, samplePayload);

/** 一次 /greet 请求体的真实字节 */
export const sampleBytes: number[] = Array.from(new Uint8Array(buffer));

export function hex(byte: number): string {
    return byte.toString(16).padStart(2, '0').toUpperCase();
}

export function hex32(value: number): string {
    return `0x${(value >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
}

/** 协议字段的分组信息，按 schema 顺序排列，并带上每个字段占用的字节数 */
export const payloadFields = dto.map((field) => ({
    key: field.key,
    type: field.type.key,
    bytes: field.type.bytes,
}));

export const PAYLOAD_SIZE = sampleBytes.length;

// ---- 徽章：直接调用 functions/badge 的 SVG 渲染器 ----

export function badgeDataUri(label: string, value: string, style: BadgeStyle, valueColor?: string): string {
    const svg = renderBadgeSvg({ label, value }, { style, valueColor });
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const AI_SOURCE_COUNT = [
    whereWasIFromOption.Doubao,
    whereWasIFromOption.Copilot,
    whereWasIFromOption.Claude,
    whereWasIFromOption.ChatGPT,
    whereWasIFromOption.DeepSeek,
    whereWasIFromOption.Perplexity,
    whereWasIFromOption.Grok,
    whereWasIFromOption.Gemini,
    whereWasIFromOption.Kimi,
    whereWasIFromOption.Yuanbao,
    whereWasIFromOption.Wenxin,
    whereWasIFromOption.Qwen,
    whereWasIFromOption.Spark,
].length;

export const SEARCH_ENGINE_COUNT = [
    whereWasIFromOption.Bing,
    whereWasIFromOption.Google,
    whereWasIFromOption.Baidu,
    whereWasIFromOption.Sogou,
    whereWasIFromOption.Search360,
    whereWasIFromOption.Brave,
    whereWasIFromOption.DuckDuckGo,
    whereWasIFromOption.Yandex,
].length;
