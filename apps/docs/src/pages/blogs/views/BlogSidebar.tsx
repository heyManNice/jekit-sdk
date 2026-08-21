import {
    BookOpen,
    Tags,
    TrendingUp,
} from "lucide-react";
import { Link } from "react-router";
import type { BlogEntry } from "../blog-data";
import { typeMeta } from "../blog-data";
import { GlowCard } from "@/components/glow-card";

interface BlogSidebarProps {
    entries: BlogEntry[];
    keywords: string[];
    onTagClick: (keyword: string) => void;
}

// 博客右侧边栏
export default function BlogSidebar({ entries, keywords, onTagClick }: BlogSidebarProps) {
    // 按日期排序，取最新文章
    const latestArticles = [...entries]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5);

    return (
        <aside className="w-72 shrink-0 space-y-6">
            {/* 关于 Jekit */}
            <GlowCard className="rounded border border-[#081A2B] bg-[#03101C]/90 backdrop-blur-sm p-5">
                <h3 className="text-text-primary font-medium text-sm mb-2 flex items-center gap-2">
                    <BookOpen size={14} className="text-primary" />
                    关于 Jekit
                </h3>
                <p className="text-text-muted text-xs leading-relaxed mb-4">
                    Jekit 是一款免费、公开、高效的公共统计基础工具，致力于为开发者提供极简、可靠的数据分析能力。
                </p>
                <div className="grid grid-cols-2 gap-2 text-center">
                    <div>
                        <div className="text-lg font-bold text-primary">
                            {entries.length}
                        </div>
                        <div className="text-xs text-text-muted">
                            文章总数
                        </div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-primary">
                            {Object.keys(typeMeta).length}
                        </div>
                        <div className="text-xs text-text-muted">
                            分类数
                        </div>
                    </div>
                </div>
                {/* 订阅按钮 */}
            </GlowCard>

            {/* 热门标签 */}
            <GlowCard className="rounded border border-[#081A2B] bg-[#03101C]/90 backdrop-blur-sm p-5">
                <h3 className="text-text-primary font-medium text-sm mb-3 flex items-center gap-2">
                    <Tags size={14} className="text-primary" />
                    热门标签
                </h3>
                <div className="flex flex-wrap gap-2">
                    {keywords.map((kw) => (
                        <button
                            key={kw}
                            onClick={() => onTagClick(kw)}
                            className="px-2.5 py-1 rounded-md text-xs border border-primary/10 text-text-muted hover:text-primary hover:border-primary/60 transition-colors"
                        >
                            {kw}
                        </button>
                    ))}
                </div>
            </GlowCard>

            {/* 最新文章 */}
            <GlowCard className="rounded border border-[#081A2B] bg-[#03101C]/90 backdrop-blur-sm p-5">
                <h3 className="text-text-primary font-medium text-sm mb-3 flex items-center gap-2">
                    <TrendingUp size={14} className="text-primary" />
                    最新文章
                </h3>
                <ul className="space-y-4">
                    {latestArticles.map((entry) => (
                        <li key={entry.filename} className="flex items-start gap-2">
                            <span className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
                            <Link
                                to={`/blogs/${entry.filename.replace(/\.md$/, "")}/`}
                                className="group block"
                            >
                                <div className="text-xs text-white group-hover:text-primary transition-colors line-clamp-1">
                                    {entry.title}
                                </div>
                                <div className="text-xs text-text-muted/60 mt-0.5">
                                    {entry.date}
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            </GlowCard>
        </aside>
    );
}
