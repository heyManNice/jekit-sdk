// 博客索引数据

export interface BlogEntry {
    title: string;
    description: string;
    keywords: string;
    type: string;
    filename: string;
    date: string;
    cover: string | null;
}

// 由 build 时生成，此处直接 import JSON
import blogIndexes from "./index.json";

export const allEntries = blogIndexes as unknown as BlogEntry[];

// 类型标签颜色映射
export const typeMeta: Record<string, { label: string; color: string }> = {
    post: { label: "产品动态", color: "#06D9D6" },
    show: { label: "行业洞察", color: "#06D9D6" },
    tech: { label: "技术文章", color: "#06D9D6" },
};

// 分类筛选
export const categories = [
    "全部",
    "产品动态",
    "技术文章",
    "使用指南",
    "行业洞察",
];
