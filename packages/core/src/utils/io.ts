import {
    decode,
} from "../protocol/decoder";
import {
    encode,
} from "../protocol/encoder";
import { domain } from "../protocol/env";
import {
    type Schema,
    type SchemaToTsType,
} from "../protocol/type";

// 按照schema定义将对象编码为ArrayBuffer
export function defineBuffer<const S extends readonly Schema[]>(
    schema: S,
    data: SchemaToTsType<S>
): ArrayBuffer {
    return encode(schema, data);
}

// 发送请求并根据schema解码响应
export async function fetchResponse<const S extends readonly Schema[]>(
    schema: S,
    props: {
        target: string;
        headers: Record<string, string>;
        buffer: ArrayBuffer;
    }
): Promise<SchemaToTsType<S>> {
    const res = await fetch(domain + props.target, {
        method: 'POST',
        headers: props.headers,
        body: props.buffer,
        referrerPolicy: "no-referrer",
    });
    if (!res.ok) {
        throw new Error(`[io] fetch ${props.target} failed: HTTP ${res.status}`);
    }
    const resBuf = await res.arrayBuffer();
    return decode(schema, resBuf);
}

// 当schema为单个类型，而返回不定长数据时
export async function fetchArrayResponse<const S extends readonly Schema[]>(
    schema: S,
    props: {
        target: string;
        headers: Record<string, string>;
        buffer: ArrayBuffer;
    }
): Promise<SchemaToTsType<S>[]> {
    const res = await fetch(domain + props.target, {
        method: 'POST',
        headers: props.headers,
        body: props.buffer,
        referrerPolicy: "no-referrer",
    });
    if (!res.ok) {
        throw new Error(`[io] fetch ${props.target} failed: HTTP ${res.status}`);
    }
    const resBuf = await res.arrayBuffer();
    const itemSize = schema.reduce((sum, item) => sum + item.type.bytes, 0);
    // 尾部不完整数据警告
    if (resBuf.byteLength % itemSize !== 0) {
        console.warn(`[io] response body (${resBuf.byteLength} bytes) is not a multiple of item size (${itemSize} bytes), trailing data will be ignored`);
    }
    const items: SchemaToTsType<S>[] = [];
    for (let offset = 0; offset + itemSize <= resBuf.byteLength; offset += itemSize) {
        const slice = resBuf.slice(offset, offset + itemSize);
        items.push(decode(schema, slice));
    }
    return items;
}
