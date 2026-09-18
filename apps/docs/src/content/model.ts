export const BLOG_TYPE_META = {
    post: { label: "产品动态", color: "#06D9D6" },
    show: { label: "行业洞察", color: "#06D9D6" },
    tech: { label: "技术文章", color: "#06D9D6" },
} as const;

export type BlogType = keyof typeof BLOG_TYPE_META;

export interface BlogEntry {
    title: string;
    description: string;
    keywords: string;
    type: BlogType;
    filename: string;
    date: string;
    publishedDate: string;
    modifiedDate: string;
    cover: string | null;
}

export interface DocsEntry {
    title: string;
    seoTitle: string;
    description: string;
    subPath: string;
    date: string;
    modifiedDate: string;
}

export interface SidebarItem {
    label: string;
    href: string;
}

export interface SidebarSection {
    title: string;
    items: SidebarItem[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function readString(record: Record<string, unknown>, key: string): string {
    const value = record[key];
    if (typeof value !== "string") throw new Error(`内容索引字段 ${key} 必须是字符串`);
    return value;
}

export function isBlogType(value: string): value is BlogType {
    return Object.hasOwn(BLOG_TYPE_META, value);
}

export function parseBlogEntries(value: unknown): BlogEntry[] {
    if (!Array.isArray(value)) throw new Error("博客索引必须是数组");

    return value.map((item) => {
        if (!isRecord(item)) throw new Error("博客索引条目必须是对象");
        const type = readString(item, "type");
        if (!isBlogType(type)) throw new Error(`未知博客类型：${type}`);
        const cover = item.cover;
        if (cover !== null && typeof cover !== "string") {
            throw new Error("博客索引字段 cover 必须是字符串或 null");
        }
        return {
            title: readString(item, "title"),
            description: readString(item, "description"),
            keywords: readString(item, "keywords"),
            type,
            filename: readString(item, "filename"),
            date: readString(item, "date"),
            publishedDate: readString(item, "publishedDate"),
            modifiedDate: readString(item, "modifiedDate"),
            cover,
        };
    });
}

export function parseDocsEntries(value: unknown): DocsEntry[] {
    if (!Array.isArray(value)) throw new Error("文档索引必须是数组");

    return value.map((item) => {
        if (!isRecord(item)) throw new Error("文档索引条目必须是对象");
        return {
            title: readString(item, "title"),
            seoTitle: readString(item, "seoTitle"),
            description: readString(item, "description"),
            subPath: readString(item, "subPath"),
            date: readString(item, "date"),
            modifiedDate: readString(item, "modifiedDate"),
        };
    });
}
