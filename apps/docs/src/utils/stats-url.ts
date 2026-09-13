// 统计面板的查询地址工具

// 从用户输入或地址栏中提取站点域名与页面路径
// path 必须保留查询参数与 hash，否则带 query / hash 的页面无法被查询
export function parseStatsUrl(text: string): { domain: string; path: string } {
    try {
        const url = new URL(text.startsWith("http") ? text : `https://${text}`);
        return { domain: url.origin, path: `${url.pathname}${url.search}${url.hash}` };
    } catch {
        return { domain: text, path: "/" };
    }
}

// 把域名与路径拼回可展示、可分享的地址
export function formatStatsUrl(domain: string, path: string): string {
    return `${domain}${path}`;
}

// 跳转参数的约定：「?query=」之后的内容整体视为目标地址，刻意不做键值解析
// 这样目标地址里的 & 与 # 都不需要转义，可以直接手写链接
// 也正因为不做键值解析，query 必须是这个页面唯一的查询参数
const QUERY_PREFIX = "?query=";

// 从当前地址中取出要查询的目标地址，没有则返回 null
export function readStatsQuery(search: string, hash: string): string | null {
    if (!search.startsWith(QUERY_PREFIX)) return null;

    // 目标地址自带的 # 会被浏览器解析成当前页的 hash，这里拼回去
    const target = search.slice(QUERY_PREFIX.length) + hash;
    return target || null;
}

// 拼出可分享的地址：query 之后直接跟原始地址，不做编码
export function buildStatsQueryUrl(pathname: string, target: string): string {
    return `${pathname}${QUERY_PREFIX}${target}`;
}
