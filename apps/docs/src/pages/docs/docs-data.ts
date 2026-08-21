// 文档索引数据

export interface DocsEntry {
    title: string;
    subPath: string;
    date: string;
}

// 由 build 时生成，此处直接 import JSON
import docsIndexes from "./index.json";

export const allDocs = docsIndexes as unknown as DocsEntry[];
