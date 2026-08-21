import {
    type Schema,
    type SchemaToTsType,
} from './type';

// 检查类型的值范围是否合法
function assertIntegerInRange(typeKey: 'u8' | 'u16' | 'u32', value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
        throw new Error(`[encoder] ${typeKey} expects an integer number`);
    }

    let max = 0;
    switch (typeKey) {
        case 'u8':
            max = 0xFF;
            break;
        case 'u16':
            max = 0xFFFF;
            break;
        case 'u32':
            max = 0xFFFF_FFFF;
            break;
        default:
            throw new Error(`[encoder] unsupported integer type: ${typeKey}`);
    }

    if (value < 0 || value > max) {
        throw new Error(`[encoder] ${typeKey} out of range: ${value}`);
    }

    return value;
}

// 检查u64的范围是否合法
function assertU64(value: unknown): bigint {
    const asBigInt = typeof value === 'bigint'
        ? value
        : (typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value))
            ? BigInt(value)
            : null;

    if (asBigInt === null) {
        throw new Error(`[encoder] u64 expects bigint (or integer number)`);
    }

    const min = 0n;
    const max = (1n << 64n) - 1n;
    if (asBigInt < min || asBigInt > max) {
        throw new Error(`[encoder] u64 out of range: ${asBigInt.toString()}`);
    }

    return asBigInt;
}

// 检查是否为布尔值
function assertBool(value: unknown): boolean {
    if (typeof value !== 'boolean') {
        throw new Error('[encoder] bool expects boolean');
    }
    return value;
}


// 计算根据schema编码后的总字节数
function computeTotalBytes(schema: readonly Schema[]): number {
    let total = 0;
    for (let i = 0; i < schema.length; i++) {
        const field = schema[i];
        const meta: any = field.type;

        if (meta.key === 'array') {
            total += meta.bytes;
            continue;
        }

        total += meta.bytes;
    }
    return total;
}


// 将一个标量值写入DataView，返回写入后的新偏移量
function writeScalar(view: DataView, offset: number, meta: any, value: unknown): number {
    switch (meta.key) {
        case 'bool': {
            const v = assertBool(value);
            view.setUint8(offset, v ? 1 : 0);
            return offset + meta.bytes;
        }
        case 'u8': {
            view.setUint8(offset, assertIntegerInRange('u8', value));
            return offset + meta.bytes;
        }
        case 'u16': {
            view.setUint16(offset, assertIntegerInRange('u16', value), true);
            return offset + meta.bytes;
        }
        case 'u32': {
            view.setUint32(offset, assertIntegerInRange('u32', value), true);
            return offset + meta.bytes;
        }
        case 'u64': {
            view.setBigUint64(offset, assertU64(value), true);
            return offset + meta.bytes;
        }
        default:
            throw new Error(`[encoder] unsupported type key: ${String(meta.key)}`);
    }
}

// 根据schema将数据编码为二进制格式
export function encode<const S extends readonly Schema[]>(schema: S, data: SchemaToTsType<S>): ArrayBuffer {
    const totalBytes = computeTotalBytes(schema);
    const buffer = new ArrayBuffer(totalBytes);
    const view = new DataView(buffer);
    const record = data as unknown as Record<string, unknown>;

    let offset = 0;
    for (let i = 0; i < schema.length; i++) {
        const field = schema[i];
        const meta: any = field.type;
        const value = record[field.key];

        if (meta.key === 'array') {
            const arr = value;
            if (!Array.isArray(arr)) {
                throw new Error(`[encoder] field "${field.key}" expects an array`);
            }

            if (arr.length !== meta.length) {
                throw new Error(`[encoder] field "${field.key}" expects array length ${meta.length}, got ${arr.length}`);
            }

            for (const item of arr) {
                offset = writeScalar(view, offset, meta.item, item);
            }

            continue;
        }

        offset = writeScalar(view, offset, meta, value);
    }

    if (offset !== totalBytes) {
        throw new Error(`[encoder] internal error: offset(${offset}) != totalBytes(${totalBytes})`);
    }

    return buffer;
}
