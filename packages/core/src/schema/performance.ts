import {
    base,
    complex,
    defineSchema,
} from "../protocol/type";

// 请求头定义
export type headers = {
    "x-query-domain": string;
};

// 用户 performance 接口的响应 schema 定义
export const vto = defineSchema([
    { key: 'ttfbHist', type: complex.array(base.u32, 256) },
    { key: 'pltHist', type: complex.array(base.u32, 256) },
] as const);
