import {
    BLOG_TYPE_META,
    parseBlogEntries,
    type BlogEntry,
} from "@/content/model";

export type { BlogEntry } from "@/content/model";

// 由 build 时生成，此处直接 import JSON
import blogIndexes from "./index.json";

export const allEntries: BlogEntry[] = parseBlogEntries(blogIndexes);

// 类型标签颜色映射
export const typeMeta = BLOG_TYPE_META;

// 分类筛选
export const categories = [
    "全部",
    ...new Set(Object.values(typeMeta).map((meta) => meta.label)),
];
