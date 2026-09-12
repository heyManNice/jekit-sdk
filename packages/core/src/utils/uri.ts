import { fnv1a32 } from "./hash";

// 内置的查询参数白名单
// 只有出现在这里的查询键才会被计入页面标识，其余查询参数一律忽略
// 只收录“内容定位型”参数，避开噪声参数（追踪、来源、分页、排序、搜索词）产生海量子页面
// 这份清单是页面身份的全局定义，上报端与查询端共用；变更会让历史数据口径不一致，需谨慎
const PAGE_QUERY_KEYS = [
    'id',
    'tid',
    'aid',
    'pid',
    'nid',
    'cid',
    'post',
    'article',
    'doc',
    'item',
    'topic',
];

// 判断是否为路由型 hash：剥掉 # 和可选的 ! 之后包含 /
// 形如 #/route、#!/route、#route/1 视为路径，纯锚点（#section）忽略
function isRouteHash(hash: string): boolean {
    if (!hash) return false;
    return hash.replace(/^#!?/, '').includes('/');
}

// 按内置白名单抽取查询参数，并规范化参数顺序（消除书写顺序的影响）
// 返回形如 ?a=1&b=2 的字符串，没有命中任何键时返回空字符串
function pickQuery(search: string): string {
    if (!search) return '';

    const params = new URLSearchParams(search);
    const kept = new URLSearchParams();

    for (const key of PAGE_QUERY_KEYS) {
        params.getAll(key).forEach(value => kept.append(key, value));
    }
    kept.sort();

    const query = kept.toString();
    return query ? `?${query}` : '';
}

// 把 URI 拆成 path / search / hash 三段
function splitUri(uri: string) {
    const hashIndex = uri.indexOf('#');
    const beforeHash = hashIndex === -1 ? uri : uri.slice(0, hashIndex);
    const hash = hashIndex === -1 ? '' : uri.slice(hashIndex);

    const queryIndex = beforeHash.indexOf('?');
    const path = queryIndex === -1 ? beforeHash : beforeHash.slice(0, queryIndex);
    const search = queryIndex === -1 ? '' : beforeHash.slice(queryIndex);

    return { path, search, hash };
}

// 计算页面标识所依据的 URI
// - 查询参数：只保留内置白名单内的键，其余一律不登记
// - hash：仅路由型计入，纯锚点忽略；路由内的查询参数同样按白名单过滤
export function normalizePageUri(uri: string): string {
    const { path, search, hash } = splitUri(uri);

    let result = `${path}${pickQuery(search)}`;

    if (isRouteHash(hash)) {
        const hashBody = hash.slice(1);
        const queryIndex = hashBody.indexOf('?');

        if (queryIndex === -1) {
            result += `#${hashBody}`;
        } else {
            const route = hashBody.slice(0, queryIndex);
            result += `#${route}${pickQuery(hashBody.slice(queryIndex))}`;
        }
    }

    return result;
}

// 计算指定路径的页面标识哈希
// 上报与查询必须共用此函数，否则两端的哈希会对不上
export function getHashOfPagePath(path: string): number {
    return fnv1a32(normalizePageUri(path));
}