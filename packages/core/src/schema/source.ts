import {
    base,
    complex,
    defineSchema,
} from "../protocol/type";

// 请求头定义
export type headers = {
    "x-query-domain": string;
};

// 用户 source 接口的请求 schema 定义
export const dto = defineSchema([
    { key: 'dimension', type: base.u8 },
    { key: 'scope', type: base.u8 },
    { key: 'theHashOfPath', type: base.u32 },
] as const);

// 用户 source 接口的响应 schema 定义
// source 返回不固定长度，所以这里只声明单个元素的类型
export const vto = defineSchema([
    { key: 'dimensionIndex', type: base.u8, },
    { key: 'totalRequest', type: base.u64, },
    { key: 'todayRequest', type: base.u32, },
    { key: 'dailyRequest', type: complex.array(base.u32, 7), }
] as const);
