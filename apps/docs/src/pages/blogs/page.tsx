import { usePageTitle } from "@/hooks/use-page-title";
import { useState, useMemo } from "react";
import { allEntries, typeMeta } from "./blog-data";

import BlogHeader from "./views/BlogHeader";
import BlogSearch from "./views/BlogSearch";
import BlogCategories from "./views/BlogCategories";
import BlogList from "./views/BlogList";
import BlogSidebar from "./views/BlogSidebar";

export default function Blogs() {
    usePageTitle("博客 - 查看 Jekit 的相关文章");

    const [activeCategory, setActiveCategory] = useState("全部");
    const [searchQuery, setSearchQuery] = useState("");

    // 按关键词和分类过滤
    const filteredEntries = useMemo(() => {
        let result = allEntries;

        // 分类过滤
        if (activeCategory !== "全部") {
            result = result.filter((entry) => {
                const meta = typeMeta[entry.type];
                return meta?.label === activeCategory;
            });
        }

        // 搜索过滤
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (entry) =>
                    entry.title.toLowerCase().includes(query) ||
                    entry.description.toLowerCase().includes(query) ||
                    entry.keywords.toLowerCase().includes(query)
            );
        }

        return result;
    }, [activeCategory, searchQuery]);

    // 提取所有关键词用于标签云
    const allKeywords = useMemo(() => {
        const keywordSet = new Set<string>();
        allEntries.forEach((entry) => {
            entry.keywords.split(/[、，,]/).forEach((kw) => {
                const trimmed = kw.trim();
                if (trimmed) keywordSet.add(trimmed);
            });
        });
        return Array.from(keywordSet);
    }, []);

    return (
        <>
            {/* ========== 主体双栏 ========== */}
            <div className="flex gap-8 mt-8 px-4 lg:px-6 max-md:flex-col max-md:gap-0">
                {/* ========== 左侧栏 ========== */}
                <div className="flex-1 min-w-0">
                    <div className="hidden sm:block">
                        <BlogHeader />
                    </div>
                    <BlogSearch value={searchQuery} onChange={setSearchQuery} />
                    <BlogCategories active={activeCategory} onChange={setActiveCategory} />
                    <BlogList entries={filteredEntries} />
                </div>

                {/* ========== 右侧边栏 ========== */}
                <div className="hidden lg:block w-72 shrink-0">
                    <BlogSidebar
                        entries={allEntries}
                        keywords={allKeywords}
                        onTagClick={setSearchQuery}
                    />
                </div>
            </div>
        </>
    );
}