import {
    describe,
    it,
    expect,
} from 'vitest';
import {
    base,
    defineSchema,
    type SchemaToTsType,
} from '@/protocol/type'

import {
    encode,
} from '@/protocol/encoder';

import {
    decode,
} from '@/protocol/decoder';

describe('jekit core protocol 运行时 测试', () => {
    it('vto 结构体 encode/decode roundtrip', () => {
        const schema = defineSchema([
            { key: 'totalRequestForSite', type: base.u64 },
            { key: 'totalRequestForPage', type: base.u64 },
            { key: 'totalVisitorForSite', type: base.u32 },
            { key: 'totalVisitorForPage', type: base.u32 },
            { key: 'todayRequestForSite', type: base.u32 },
            { key: 'todayRequestForPage', type: base.u32 },
            { key: 'todayVisitorForSite', type: base.u32 },
            { key: 'todayVisitorForPage', type: base.u32 },
        ]);

        type Vto = SchemaToTsType<typeof schema>;

        const input: Vto = {
            totalRequestForSite: 123n,
            totalRequestForPage: 456n,
            totalVisitorForSite: 100,
            totalVisitorForPage: 200,
            todayRequestForSite: 11,
            todayRequestForPage: 22,
            todayVisitorForSite: 33,
            todayVisitorForPage: 44,
        };

        const buf = encode(schema, input);
        expect(buf.byteLength).toBe(8 + 8 + 4 * 6);

        const out = decode(schema, buf);
        expect(out).toEqual(input);
    });

    it('encoder 会做范围校验（越界报错）', () => {
        const schema = defineSchema([
            { key: 'a', type: base.u8 },
            { key: 'b', type: base.u16 },
            { key: 'c', type: base.u32 },
            { key: 'd', type: base.u64 },
            { key: 'e', type: base.bool },
        ]);

        expect(() => encode(schema, {
            a: 256,
            b: 1,
            c: 1,
            d: 1n,
            e: true,
        })).toThrow();

        expect(() => encode(schema, {
            a: 1,
            b: 70000,
            c: 1,
            d: 1n,
            e: true,
        })).toThrow();

        expect(() => encode(schema, {
            a: 1,
            b: 1,
            c: -1,
            d: 1n,
            e: true,
        })).toThrow();

        expect(() => encode(schema, {
            a: 1,
            b: 1,
            c: 1,
            d: (1n << 64n),
            e: true,
        })).toThrow();

        expect(() => encode(schema, {
            a: 1,
            b: 1,
            c: 1,
            d: 1n,
            e: 1 as any,
        })).toThrow();
    });

    // 动态数组（未知长度）不再由 schema 描述

    it('decoder bool:只接受 0/1', () => {
        const schema = defineSchema([
            { key: 'flag', type: base.bool },
        ]);

        expect(decode(schema, new Uint8Array([0]).buffer)).toEqual({ flag: false });
        expect(decode(schema, new Uint8Array([1]).buffer)).toEqual({ flag: true });
        expect(() => decode(schema, new Uint8Array([2]).buffer)).toThrow();
    });
});