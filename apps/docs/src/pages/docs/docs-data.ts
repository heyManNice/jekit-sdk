import { parseDocsEntries, type DocsEntry } from "@/content/model";

export type { DocsEntry } from "@/content/model";

// 由 build 时生成，此处直接 import JSON
import docsIndexes from "./index.json";

export const allDocs: DocsEntry[] = parseDocsEntries(docsIndexes);
