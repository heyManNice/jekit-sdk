export type StatsTarget = {
    domain: string;
    path: string;
};

/**
 * 解析规则暂时与统计面板保持一致：
 * 未填写协议时默认使用 HTTPS，页面路径保留查询参数与 hash。
 */
export function parseTargetUrl(text: string): StatsTarget {
    try {
        const url = new URL(text.startsWith('http') ? text : `https://${text}`);
        return {
            domain: url.origin,
            path: `${url.pathname}${url.search}${url.hash}`,
        };
    } catch {
        return { domain: text, path: '/' };
    }
}
