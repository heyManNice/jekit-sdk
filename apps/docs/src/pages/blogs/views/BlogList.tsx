import { Link } from "react-router";
import { ChevronRight, FileText } from "lucide-react";
import type { BlogEntry } from "../blog-data";
import { typeMeta } from "../blog-data";
import { GlowCard } from "@/components/glow-card";
import { TypeBadge } from "@/components/type-badge";

interface BlogListProps {
    entries: BlogEntry[];
}

// 博客文章列表
export default function BlogList({ entries }: BlogListProps) {
    if (entries.length === 0) {
        return (
            <div className="text-center text-text-muted py-20">
                暂无匹配的文章
            </div>
        );
    }

    return (
        // 使用 flex + gap 控制卡片间距：
        // space-y-* 依赖子元素的 margin-top，而子元素是 <a>（inline），
        // inline 元素的垂直 margin 不生效，因此改用 flex 的 gap
        <div className="flex flex-col gap-4">
            {entries.map((entry) => {
                const meta = typeMeta[entry.type] ?? {
                    label: entry.type,
                    color: "#06D9D6",
                };
                return (
                    <Link
                        key={entry.filename}
                        to={`/blogs/${entry.filename.replace(/\.md$/, "")}/`}
                        className="group"
                    >
                        <GlowCard className="flex gap-4 p-4 rounded border border-[#081A2B] bg-[#03101C]/90 backdrop-blur-sm">
                            {/* 封面图 */}
                            <div className="w-32 h-24 shrink-0 rounded-sm overflow-hidden bg-surface">
                                {entry.cover ? (
                                    <img
                                        src={entry.cover}
                                        alt={entry.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <FileText
                                            size={24}
                                            className="text-text-muted/40"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* 文字内容 */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                    {/* 类型标签 */}
                                    <TypeBadge label={meta.label} color={meta.color} className="mb-2" />
                                    {/* 标题 */}
                                    <h3 className="text-text-primary font-medium text-sm leading-snug group-hover:text-primary transition-colors line-clamp-1">
                                        {entry.title}
                                    </h3>
                                    {/* 描述 */}
                                    <p className="text-text-muted text-xs mt-1 leading-relaxed line-clamp-2">
                                        {entry.description}
                                    </p>
                                </div>
                                {/* 底部元信息 */}
                                <div className="flex items-center gap-4 text-xs text-text-muted/70 mt-2">
                                    <span>{entry.date}</span>
                                </div>
                            </div>

                            {/* 右侧箭头 */}
                            <div className="flex items-center">
                                <ChevronRight
                                    size={16}
                                    className="text-text-muted/30 group-hover:text-primary/60 transition-colors"
                                />
                            </div>
                        </GlowCard>
                    </Link>
                );
            })}
        </div>
    );
}
