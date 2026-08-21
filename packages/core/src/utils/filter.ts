
export class BloomFilter {
    private bitArray: Uint8Array;
    private totalBits: number;
    private numHashes: number;

    constructor(props: {
        bytes: number,
        hashes: number
    }) {
        this.bitArray = new Uint8Array(props.bytes);
        this.totalBits = props.bytes << 3;
        this.numHashes = props.hashes;
    }

    private getBloomIndices(hash: number): number[] {
        // 拆分高低 16 位作为相互独立的原始哈希种子
        const hashA = hash & 0xFFFF;
        const hashB = (hash >> 16) & 0xFFFF;

        const indices: number[] = new Array(this.numHashes);

        for (let i = 0; i < this.numHashes; i++) {
            let idx = (hashA + i * hashB) % this.totalBits;
            // 兜底处理 JavaScript 中负数取模的问题
            if (idx < 0) idx += this.totalBits;
            indices[i] = idx;
        }

        return indices;
    }

    // 染色
    public add(hash: number): void {
        const indices = this.getBloomIndices(hash);

        for (let i = 0; i < indices.length; i++) {
            const bitIndex = indices[i];
            const byteIndex = bitIndex >> 3;  // 右移 3 位等价于除以 8，快速定位字节
            const bitOffset = bitIndex & 7;   // 与 7 做位与等价于对 8 取余，拿到字节内偏移
            this.bitArray[byteIndex] |= (1 << bitOffset);
        }
    }

    // 查询
    public check(hash: number): boolean {
        const indices = this.getBloomIndices(hash);

        for (let i = 0; i < indices.length; i++) {
            const bitIndex = indices[i];
            const byteIndex = bitIndex >> 3;
            const bitOffset = bitIndex & 7;

            // 只要有一个 bit 为 0，铁证如山，说明该页面绝对没访问过
            if ((this.bitArray[byteIndex] & (1 << bitOffset)) === 0) {
                return false;
            }
        }
        return true;
    }

    // 导出
    public toUint8Array(): Uint8Array {
        return this.bitArray;
    }

    // 导入
    public fromUint8Array(arr: Uint8Array): void {
        if (arr.length !== this.bitArray.length) {
            throw new Error(`Invalid array length: expected ${this.bitArray.length}, got ${arr.length}`);
        }
        this.bitArray.set(arr);
    }

    // 清空
    public clear(): void {
        this.bitArray.fill(0);
    }
}
