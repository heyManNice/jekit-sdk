import { setTitle } from "@/utils/title";
import { useLocation, useOutletContext, Link } from "react-router";
import { useState, useEffect, useMemo } from "react";
import { Md } from "@/components/md";
import { ChevronLeft, ChevronRight, SquarePen } from "lucide-react";
import { useJekit } from "jekit-react";
import { allDocs } from "./docs-data";
import { ContentSkeleton } from "@/components/content-skeleton";
import { GITHUB_REPO, GITHUB_BRANCH, DOCS_CONTENT_PATH } from "@/utils/github";


const modules = import.meta.glob('./content/*/*.md', { import: 'default' });

// 工具：拍平侧边栏为有序列表

interface FlatItem {
    label: string;
    href: string;
}

function flattenSections(
    sections: { title: string; items: { label: string; href: string }[] }[]
): FlatItem[] {
    return sections.flatMap((s) => s.items);
}

// 底部：GitHub 编辑 + 上/下一节

interface PageNavProps {
    subPath: string;
    prev: FlatItem | null;
    next: FlatItem | null;
}

function PageNav({ subPath, prev, next }: PageNavProps) {
    const editUrl =
        `${GITHUB_REPO}/edit/${GITHUB_BRANCH}/${DOCS_CONTENT_PATH}/${subPath}.md`;

    return (
        <div className="mt-10 border-t border-border pt-6 space-y-4">
            {/* 在 GitHub 上编辑 */}
            <a
                href={editUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors"
            >
                <SquarePen size={14} />
                在 GitHub 上编辑此页
            </a>

            {/* 上 / 下一节 */}
            <div className="flex items-stretch gap-3 sm:gap-4">
                {prev ? (
                    <Link
                        to={prev.href}
                        className="flex-1 flex items-center gap-2 rounded-lg border border-[color-mix(in_srgb,var(--color-border)_70%,var(--color-text-muted)_30%)] px-4 py-3 text-sm hover:border-primary hover:text-primary transition-colors"
                    >
                        <ChevronLeft size={16} className="shrink-0" />
                        <div className="min-w-0">
                            <div className="text-xs text-text-muted">上一节</div>
                            <div className="truncate">{prev.label}</div>
                        </div>
                    </Link>
                ) : (
                    <div className="flex-1" />
                )}

                {next ? (
                    <Link
                        to={next.href}
                        className="flex-1 flex items-center gap-2 rounded-lg border border-[color-mix(in_srgb,var(--color-border)_70%,var(--color-text-muted)_30%)] px-4 py-3 text-sm hover:border-primary hover:text-primary transition-colors text-right"
                    >
                        <div className="min-w-0 flex-1">
                            <div className="text-xs text-text-muted">下一节</div>
                            <div className="truncate">{next.label}</div>
                        </div>
                        <ChevronRight size={16} className="shrink-0" />
                    </Link>
                ) : (
                    <div className="flex-1" />
                )}
            </div>
        </div>
    );
}

// 内容区域

export default function DocsContent() {
    const location = useLocation();
    const { sections } = useOutletContext<{
        sections: { title: string; items: { label: string; href: string }[] }[];
    }>();
    const subPath = location.pathname.replace(/^\/docs\/?/, "").replace(/\/$/, "");
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // 拍平侧边栏并定位当前页
    const flat = useMemo(() => flattenSections(sections), [sections]);
    const currentIdx = flat.findIndex((item) => item.href === location.pathname);
    const prev = currentIdx > 0 ? flat[currentIdx - 1] : null;
    const next = currentIdx < flat.length - 1 ? flat[currentIdx + 1] : null;

    const jekit = useJekit();

    useEffect(() => {
        if (!subPath) {
            setContent("");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);

        // 切换页面时滚动到顶部
        window.scrollTo(0, 0);

        const key = `./content/${subPath}.md`;
        const loader = modules[key] as (() => Promise<string>) | undefined;
        if (loader) {
            loader().then((c) => {
                setContent(c);
                // 从文档索引中查找标题（与博客一致）
                const found = allDocs.find((e) => e.subPath === subPath);
                if (found) {
                    setTitle("文档 - " + found.title);
                } else {
                    setTitle("文档 - 查看 Jekit 的接入文档说明");
                }
                setIsLoading(false);
            });
        } else {
            setContent("未找到对应的文档内容，请检查链接是否正确。");
            setIsLoading(false);
        }
    }, [subPath]);

    if (isLoading) {
        return <ContentSkeleton />;
    }

    // 从文档索引中查找当前条目（标题、编译时间）
    const entry = allDocs.find((e) => e.subPath === subPath);

    return (
        <div className="relative">
            {/* 文档元信息：标题、浏览量、最后编辑时间 */}
            <div className="mb-6">
                <h1 className="text-[2rem] font-extrabold tracking-tight text-white mb-3 mt-8">
                    {entry?.title ?? subPath}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[0.8rem] text-text-muted">
                    <span>浏览量：{jekit.pagePv}</span>
                    <span className="inline-flex items-center gap-1.5">
                        <span>最后编辑:{entry?.date}</span>
                        <span className="doc-meta-sep">·</span>
                        <a
                            href={`${GITHUB_REPO}/commits/${GITHUB_BRANCH}/${DOCS_CONTENT_PATH}/${subPath}.md`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-2 hover:text-primary transition-colors"
                        >
                            查看修改记录
                        </a>
                    </span>
                </div>
            </div>

            {/* Markdown 正文 */}
            <Md>{content}</Md>
            <PageNav subPath={subPath} prev={prev} next={next} />
        </div>
    );
}