import {
    base,
    defineSchema,
} from "../protocol/type";

// 请求头定义
export type headers = {
    "x-query-domain": string;
};

// 用户 history 接口的请求 schema 定义
export const dto = defineSchema([
    { key: 'range', type: base.u8 },
    { key: 'metric', type: base.u8 },
    { key: 'theHashOfPath', type: base.u32 },
    { key: 'dimensionValue', type: base.u8 },
] as const);

// 用户 history 接口的响应 schema 定义
// history 返回不固定长度，所以这里只声明单个元素的类型
export const vto = defineSchema([
    { key: 'date', type: base.u64, },
    { key: 'value', type: base.u64, }
] as const);
