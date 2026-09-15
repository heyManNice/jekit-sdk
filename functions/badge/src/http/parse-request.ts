import {
    BADGE_DEFAULTS,
    BADGE_METRIC_NAMES,
    BADGE_STYLE_NAMES,
    isBadgeMetric,
    isBadgeStyle,
    type BadgeMetric,
    type BadgeStyle,
} from '../config/options.ts';
import { parseTargetUrl, type StatsTarget } from './parse-target-url.ts';

export type BadgeRequest = {
    style: BadgeStyle;
    metric: BadgeMetric;
    target: StatsTarget;
};

export type RequestParseResult =
    | { ok: true; value: BadgeRequest }
    | { ok: false; status: 400 | 404; message: string };

type PathParseResult =
    | { ok: true; value: Pick<BadgeRequest, 'style' | 'metric'> }
    | { ok: false; status: 400 | 404; message: string };

export function parseBadgeRequest(request: Request): RequestParseResult {
    const url = new URL(request.url);
    const pathResult = parsePath(url.pathname);

    if (!pathResult.ok) {
        return pathResult;
    }

    const targetText = readTargetUrl(url);
    if (!targetText) {
        return invalidRequest('缺少 url 参数');
    }

    const target = parseTargetUrl(targetText);
    if (!isValidOrigin(target.domain)) {
        return invalidRequest('url 不是有效的网址');
    }

    return { ok: true, value: { ...pathResult.value, target } };
}

/**
 * url 必须是唯一查询参数，后面的内容整体属于目标地址。
 * 同时接受整体编码的 URL，方便在 HTML 和 Markdown 中安全使用。
 */
function readTargetUrl(url: URL): string | null {
    const prefix = '?url=';
    if (!url.search.startsWith(prefix)) {
        return null;
    }

    const rawTarget = url.search.slice(prefix.length) + url.hash;
    if (!rawTarget) {
        return null;
    }

    try {
        return decodeURIComponent(rawTarget);
    } catch {
        return rawTarget;
    }
}

function isValidOrigin(domain: string): boolean {
    try {
        const url = new URL(domain);
        return url.origin === domain && (url.protocol === 'http:' || url.protocol === 'https:');
    } catch {
        return false;
    }
}

function parsePath(pathname: string): PathParseResult {
    if (pathname === '/') {
        return {
            ok: true,
            value: {
                style: BADGE_DEFAULTS.style,
                metric: BADGE_DEFAULTS.metric,
            },
        };
    }

    const parts = pathname.replace(/\/$/, '').split('/').slice(1);
    if (parts.length !== 2) {
        return {
            ok: false,
            status: 404,
            message: '路径格式：/样式/指标?url=网址，例如 /flat/pv?url=https://jekit.cn/stats/',
        };
    }

    const [style, metric] = parts;
    if (!isBadgeStyle(style)) {
        return invalidRequest(`不支持的样式：请选择 ${BADGE_STYLE_NAMES.join('、')}`);
    }
    if (!isBadgeMetric(metric)) {
        return invalidRequest(`不支持的指标：请选择 ${BADGE_METRIC_NAMES.join('、')}`);
    }

    return {
        ok: true,
        value: {
            style,
            metric,
        },
    };
}

function invalidRequest(message: string): { ok: false; status: 400; message: string } {
    return { ok: false, status: 400, message };
}
