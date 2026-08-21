import {
    type Schema,
    type SchemaToTsType,
} from './type';

// 从DataView中读取一个标量值，返回读取的值和新的偏移量
function readScalar(view: DataView, offset: number, meta: any): { value: unknown; offset: number } {
    switch (meta.key) {
        case 'bool': {
            const raw = view.getUint8(offset);
            if (raw !== 0 && raw !== 1) {
                throw new Error(`[decoder] bool expects 0/1, got ${raw}`);
            }
            return { value: raw === 1, offset: offset + meta.bytes };
        }
        case 'u8':
            return { value: view.getUint8(offset), offset: offset + meta.bytes };
        case 'u16':
            return { value: view.getUint16(offset, true), offset: offset + meta.bytes };
        case 'u32':
            return { value: view.getUint32(offset, true), offset: offset + meta.bytes };
        case 'u64':
            return { value: view.getBigUint64(offset, true), offset: offset + meta.bytes };
        default:
            throw new Error(`[decoder] unsupported type key: ${String(meta.key)}`);
    }
}

// 根据schema将二进制数据解码为对象
export function decode<const S extends readonly Schema[]>(schema: S, buffer: ArrayBuffer): SchemaToTsType<S> {
    const view = new DataView(buffer);
    const bytes = buffer.byteLength;
    const out: Record<string, unknown> = {};

    let offset = 0;
    for (let i = 0; i < schema.length; i++) {
        const field = schema[i];
        const meta: any = field.type;

        if (meta.key === 'array') {
            const arr: unknown[] = [];
            for (let j = 0; j < meta.length; j++) {
                const read = readScalar(view, offset, meta.item);
                arr.push(read.value);
                offset = read.offset;
            }
            out[field.key] = arr;
            continue;
        }

        const read = readScalar(view, offset, meta);
        out[field.key] = read.value;
        offset = read.offset;
    }

    if (offset !== bytes) {
        throw new Error(`[decoder] buffer has extra bytes: decoded ${offset}, total ${bytes}`);
    }

    return out as SchemaToTsType<S>;
}
