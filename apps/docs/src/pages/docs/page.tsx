import { setTitle } from "@/utils/title";
import { useLocation, useOutletContext, Link } from "react-router";
import { useState, useEffect, useMemo } from "react";
import { Md } from "@/components/md";
import { ChevronLeft, ChevronRight, SquarePen } from "lucide-react";
import { useJekit } from "jekit-react";
import { allDocs } from "./docs-data";
import { ContentSkeleton } from "@/components/content-skeleton";
import { GITHUB_REPO, GITHUB_BRANCH, DOCS_CONTENT_PATH } from "@/utils/github";
import { docStructuredData } from "@/utils/structured-data";


const modules = import.meta.glob('./content/*/*.md', { import: 'default' });


// 工具：从正文提取 meta description
// 文档 import 进来时已被 vite-plugin-md 编译成 HTML（frontmatter 也已剥离），
// 里面没有现成的描述，只能从正文里挑一段当摘要。

// 低于这个长度的段落多半只是半句话，不足以当摘要
const MIN_SUMMARY_LENGTH = 12;

const SEO_TITLES: Record<string, string> = {
    "intro/what-this-is": "Jekit 是什么？免费、隐私友好的网站统计工具",
    "guide/ai": "通过 AI 助手接入网站访问统计 | Jekit",
    "guide/cdn": "CDN 网站访问统计接入教程 | Jekit",
    "guide/react": "React 网站访问统计接入教程 | Jekit",
    "guide/vue": "Vue 3 网站访问统计接入教程 | Jekit",
    "more/badge": "网站访问量 Badge 徽章使用教程 | Jekit",
    "more/api": "网站统计 API 文档 | Jekit",
    "faq/setup": "Jekit 网站统计安装问题与排查",
    "faq/use": "Jekit 网站统计使用问题与解答",
    "faq/impl": "Jekit 网站统计实现原理与隐私设计",
};

function summarizeContent(html: string, limit = 120): string {
    const doc = new DOMParser().parseFromString(
        // <br> 会消失得无影无踪，先换成空格，避免两句话被粘在一起
        html.replace(/<br\s*\/?>/gi, " "),
        "text/html",
    );

    for (const p of doc.body.querySelectorAll("p")) {
        // 列表项与引用块里是问答内容，不适合当整页摘要
        if (p.closest("li, blockquote")) continue;

        const text = (p.textContent ?? "").replace(/\s+/g, " ").trim();

        // 太短的是铺垫句；含 < 的是行内代码里的标签示例（如 CDN 用法里的 <span>）
        if (text.length < MIN_SUMMARY_LENGTH || text.includes("<")) continue;

        return text.length > limit ? text.slice(0, limit) + "…" : text;
    }

    return "";
}

// 摘要挑不出来时，用一句点到页面的通用描述兜底；
// 全站共用一句描述对 SEO 不友好，所以这里带上文档标题。
function describeDoc(html: string, title?: string): string {
    const summary = summarizeContent(html);
    if (summary) return summary;

    return title ? `Jekit 官方文档「${title}」：接入方式、配置项与常见问题说明。` : "";
}

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

        const key = `./content/${subPath}.md`;
        const loader = modules[key] as (() => Promise<string>) | undefined;
        if (loader) {
            loader().then((c) => {
                setContent(c);
                // 从文档索引中查找标题（与博客一致）
                const found = allDocs.find((e) => e.subPath === subPath);
                const section = sections.find((group) =>
                    group.items.some((item) => item.href === location.pathname)
                )?.title;
                const description = found?.description || describeDoc(c, found?.title);
                setTitle({
                    title: found
                        ? SEO_TITLES[found.subPath] ?? `${found.title} | Jekit 网站统计文档`
                        : "Jekit 网站统计接入文档",
                    announcement: found ? `${found.title}文档` : "Jekit 文档",
                    description,
                    structuredData: found
                        ? docStructuredData({ ...found, description, section })
                        : undefined,
                });
                setIsLoading(false);
            });
        } else {
            setContent("未找到对应的文档内容，请检查链接是否正确。");
            setIsLoading(false);
        }
    }, [location.pathname, sections, subPath]);

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
                        {entry ? (
                            <time dateTime={entry.modifiedDate}>最后编辑:{entry.date}</time>
                        ) : (
                            <span>最后编辑时间未知</span>
                        )}
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
