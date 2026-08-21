import {
    base,
    defineSchema,
} from "../protocol/type";

// 用户 greet 接口的请求 schema 定义
export const dto = defineSchema([
    { key: 'visitorStatus', type: base.u8 },
    { key: 'whereWasIFrom', type: base.u8 },
    { key: 'theHashOfPath', type: base.u32 },
    { key: 'whichBrowser', type: base.u8 },
    { key: 'whichOS', type: base.u8 },
    { key: 'ttfb', type: base.u8 },
    { key: 'plt', type: base.u8 },
] as const);

// 用户 greet 接口的响应 schema 定义
export const vto = defineSchema([
    { key: 'totalRequestForSite', type: base.u64 },
    { key: 'totalRequestForPage', type: base.u64 },

    { key: 'totalVisitorForSite', type: base.u32 },
    { key: 'totalVisitorForPage', type: base.u32 },

    { key: 'todayRequestForSite', type: base.u32 },
    { key: 'todayRequestForPage', type: base.u32 },

    { key: 'todayVisitorForSite', type: base.u32 },
    { key: 'todayVisitorForPage', type: base.u32 },
] as const);
