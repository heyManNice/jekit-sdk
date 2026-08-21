// 类型的元信息
type TypeMeta = {
    key: string;// 类型的名称
    bytes: number;// 该类型的字节数
    length: number;// 数据的个数
};

// 基本类型
export const base = {
    bool: {
        key: 'bool',
        bytes: 1,
        length: 1,
    },
    u8: {
        key: 'u8',
        bytes: 1,
        length: 1,
    },
    u16: {
        key: 'u16',
        bytes: 2,
        length: 1,
    },
    u32: {
        key: 'u32',
        bytes: 4,
        length: 1,
    },
    u64: {
        key: 'u64',
        bytes: 8,
        length: 1,
    },
} as const satisfies Record<string, TypeMeta>;

// 数组类型的元信息
type ArrayTypeMeta<TItem extends TypeMeta = TypeMeta, TLen extends number = number> = {
    key: 'array';
    bytes: number;
    length: TLen;
    item: TItem;
};

type AnyTypeMeta = TypeMeta | ArrayTypeMeta;

type BuildTuple<TItem, TLen extends number, Acc extends TItem[] = []> =
    Acc['length'] extends TLen
    ? Acc
    : BuildTuple<TItem, TLen, [...Acc, TItem]>;

// 固定长度数组类型
export type FixedLengthArray<TItem, TLen extends number> =
    number extends TLen ? TItem[] : BuildTuple<TItem, TLen>;

// 数组类型
function array<TItem extends TypeMeta, TLen extends number>(type: TItem, length: TLen) {
    return {
        key: `array` as const,
        bytes: length * type.bytes,
        length,
        item: type,
    } as const satisfies ArrayTypeMeta<TItem, TLen>;
};

// 导出组合类型
export const complex = {
    array,
};

// schema的类型用于声明
export type Schema = {
    key: string;
    type: AnyTypeMeta;
};

// 定义schema的函数
export function defineSchema<const T extends readonly Schema[]>(schema: T): T {
    return schema;
}

// 把schema推导为ts类型
type TypeMetaToTsType<T extends AnyTypeMeta> =
    T extends { key: 'bool' } ? boolean :
    T extends { key: 'u8' | 'u16' | 'u32' } ? number :
    T extends { key: 'u64' } ? bigint :
    T extends ArrayTypeMeta<infer TItem, infer TLen> ? FixedLengthArray<TypeMetaToTsType<TItem>, TLen> :
    never;

export type SchemaToTsType<T extends readonly { key: string, type: AnyTypeMeta }[]> = {
    [K in T[number]as K['key']]: TypeMetaToTsType<K['type']>;
};
