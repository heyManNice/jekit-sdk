import {
    base,
    defineSchema,
} from "../protocol/type";

// 用户 device 接口的响应 schema 定义
export const vto = defineSchema([
    { key: 'lastSavedTime', type: base.u64 },
    { key: 'lastBackupTime', type: base.u64 },
    { key: 'serverStartTime', type: base.u64 },
    { key: 'totalRequest', type: base.u64 },
    { key: 'whileStartTime', type: base.u64 },
    { key: 'droppedRequests', type: base.u64 },

    { key: 'requestForWhile', type: base.u32 },
    { key: 'cacheHitForWhile', type: base.u32 },
    { key: 'siteInstanceInMem', type: base.u32 },
    { key: 'processMemUsed', type: base.u32 },
    { key: 'httpSessionsRealTime', type: base.u32 },
    { key: 'totalSite', type: base.u32 },
    { key: 'diskUsed', type: base.u32 },

    { key: 'cpuUsed', type: base.u16 },
] as const);
