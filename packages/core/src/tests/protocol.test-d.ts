import {
    describe,
    it,
    expectTypeOf
} from 'vitest';
import {
    base,
    complex,
    defineSchema,
    type SchemaToTsType
} from '@/protocol/type'

describe("jekit core protocol 类型 测试", () => {

    it("SchemaToTsType 固定数组类型推导测试", () => {

        const schema = defineSchema([
            {
                key: 'key1',
                type: base.u64,
            },
            {
                key: 'key2',
                type: complex.array(base.u16, 3),
            },
        ]);

        type ActualType = SchemaToTsType<typeof schema>;
        type ExpectedType = {
            key1: bigint;
            key2: [
                number,
                number,
                number,
            ];
        };

        expectTypeOf<ActualType>().toEqualTypeOf<ExpectedType>();
    });
});