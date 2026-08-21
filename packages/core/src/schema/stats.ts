import {
    base,
    complex,
    defineSchema,
} from "../protocol/type";

// 请求头定义
export type headers = {
    "x-query-domain": string;
};

// 用户 stats 接口的请求 schema 定义
export const dto = defineSchema([
    { key: 'theHashOfPath', type: base.u32 },
] as const);

// 用户 stats 接口的响应 schema 定义
export const vto = defineSchema([
    { key: 'totalRequestForSite', type: base.u64 },
    { key: 'totalRequestForPage', type: base.u64 },

    { key: 'totalVisitorForSite', type: base.u32 },
    { key: 'totalVisitorForPage', type: base.u32 },

    { key: 'todayRequestForSite', type: base.u32 },
    { key: 'todayRequestForPage', type: base.u32 },

    { key: 'todayVisitorForSite', type: base.u32 },
    { key: 'todayVisitorForPage', type: base.u32 },

    { key: 'subPageCount', type: base.u16 },

    { key: 'pageLimitForSite', type: base.u16 },

    { key: 'registeredAt', type: base.u64 },

    { key: 'dailyRequestForSite', type: complex.array(base.u32, 7) },
    { key: 'dailyRequestForPage', type: complex.array(base.u32, 7) },

    { key: 'dailyVisitorForSite', type: complex.array(base.u32, 7) },
    { key: 'dailyVisitorForPage', type: complex.array(base.u32, 7) },
] as const);
