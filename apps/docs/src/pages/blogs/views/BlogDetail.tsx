import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useParams, Link } from "react-router";
import { ChevronLeft, SquarePen, ArrowUp } from "lucide-react";
import { Md } from "@/components/md";
import { useJekit } from "jekit-react";
import { setTitle } from "@/utils/title";
import { allEntries, typeMeta } from "../blog-data";
import { ContentSkeleton } from "@/components/content-skeleton";
import { TypeBadge } from "@/components/type-badge";
import { GITHUB_REPO, GITHUB_BRANCH, BLOG_CONTENT_REPO_PATH } from "@/utils/github";

// Markdown 内容加载器

const modules = import.meta.glob(
    "../content/**/*.md",
    { import: "default" },
);

// TOC 项

interface TocItem {
    id: string;
    text: string;
    level: number; // 2 = h2, 3 = h3
}

// 由标题文本生成锚点 id（中文保留、去空格与符号）
function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w\u4e00-\u9fff-]/g, "");
}

// 按文件名（去掉 .md 后缀）查找博客条目
function findEntry(filename?: string) {
    return allEntries.find((e) => e.filename.replace(/\.md$/, "") === filename);
}

// 从 HTML 提取标题

function extractHeadings(html: string): TocItem[] {
    const items: TocItem[] = [];
    const regex = /<h([23])\s*(?:id="([^"]*)")?[^>]*>([\s\S]*?)<\/h\1>/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        const level = Number(match[1]);
        const rawId = match[2] ?? "";
        const text = match[3]
            .replace(/<[^>]+>/g, "")   // 去除内部 HTML 标签
            .trim();
        if (!text) continue;
        // 若无 id 则用文本生成一个
        const id = rawId || slugify(text);
        items.push({ id, text, level });
    }
    return items;
}

// 博客正文详情页

export default function BlogDetail() {
    const { filename } = useParams<{ filename: string }>();
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [activeId, setActiveId] = useState("");
    const [showTopBtn, setShowTopBtn] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const jekit = useJekit();

    // 加载 Markdown
    useEffect(() => {
        if (!filename) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        window.scrollTo(0, 0);

        // 从索引中查找对应条目
        const entry = findEntry(filename);
        if (!entry) {
            setContent("");
            setIsLoading(false);
            return;
        }

        setTitle(`博客 - ${entry.title}`);

        // 构造 glob key：../content/{type}/{filename}
        const key = `../content/${entry.type}/${entry.filename}`;
        const loader = modules[key] as (() => Promise<unknown>) | undefined;
        if (loader) {
            loader().then((c) => {
                setContent(c as string);
                setIsLoading(false);
            });
        } else {
            setContent("未找到对应的文章内容。");
            setIsLoading(false);
        }
    }, [filename]);

    // 提取标题列表
    const headings = useMemo(() => {
        if (!content) return [];
        return extractHeadings(content);
    }, [content]);

    // 为标题生成 id
    const processedContent = useMemo(() => {
        if (!content) return "";
        return content.replace(
            /<h([23])\s*>([\s\S]*?)<\/h\1>/g,
            (_match, level, inner) => {
                const text = inner.replace(/<[^>]+>/g, "").trim();
                return `<h${level} id="${slugify(text)}">${inner}</h${level}>`;
            },
        );
    }, [content]);

    // 滚动监听：高亮当前标题 + 回到顶部按钮
    useEffect(() => {
        function onScroll() {
            // 回到顶部按钮
            setShowTopBtn(window.scrollY > 400);

            // 标题高亮（需要有标题才执行）
            if (headings.length === 0) return;
            const OFFSET = 100;
            let currentId = headings[0].id;
            for (const h of headings) {
                const el = document.getElementById(h.id);
                if (el && el.getBoundingClientRect().top <= OFFSET) {
                    currentId = h.id;
                } else if (el && el.getBoundingClientRect().top > OFFSET) {
                    break;
                }
            }
            setActiveId(currentId);
        }

        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, [headings, processedContent]);

    // 查找当前文章的元信息
    const entry = findEntry(filename);

    if (isLoading) {
        return <ContentSkeleton />;
    }

    if (!entry) {
        return (
            <div className="text-center text-text-muted py-20">
                文章不存在
            </div>
        );
    }

    const meta = typeMeta[entry.type] ?? { label: entry.type, color: "#06D9D6" };

    return (
        <div className="mt-6 px-4 lg:px-6">
            {/* 返回链接 */}
            <Link
                to="/blogs/"
                className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-6"
                data-main-content="true"
            >
                <ChevronLeft size={16} />
                返回博客列表
            </Link>

            {/* 两栏布局 */}
            <div className="flex gap-8">
                {/* 左侧：文章内容 */}
                <div className="flex-1 min-w-0" ref={contentRef}>
                    {/* 文章元信息 */}
                    <div className="mb-6">
                        <TypeBadge label={meta.label} color={meta.color} className="mb-3" />
                        <h1 className="text-[2rem] font-extrabold tracking-tight text-white mb-2">
                            {entry.title}
                        </h1>
                        <p className="text-sm text-text-secondary mb-3">
                            {entry.description}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[0.8rem] text-text-muted">
                            <span>浏览量：{jekit.pagePv}</span>
                            <span className="inline-flex items-center gap-1.5">
                                <span>最后编辑:{entry.date}</span>
                                <span className="doc-meta-sep">·</span>
                                <a
                                    href={`${GITHUB_REPO}/commits/${GITHUB_BRANCH}/${BLOG_CONTENT_REPO_PATH}/${entry.type}/${entry.filename}`}
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
                    <Md className="blog-content">{processedContent}</Md>

                    {/* 在 GitHub 上编辑 */}
                    <div className="mt-10 border-t border-border pt-6">
                        <a
                            href={`${GITHUB_REPO}/edit/${GITHUB_BRANCH}/${BLOG_CONTENT_REPO_PATH}/${entry.type}/${entry.filename}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors"
                        >
                            <SquarePen size={14} />
                            在 GitHub 上编辑此页
                        </a>
                    </div>
                </div>

                {/* 右侧：标题导航 */}
                {headings.length > 0 && (
                    <aside className="hidden lg:block w-56 shrink-0">
                        <div className="sticky top-24">
                            <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                                目录
                            </h4>
                            <nav className="space-y-1">
                                {headings.map((h) => (
                                    <a
                                        key={h.id}
                                        href={`#${h.id}`}
                                        className={`block text-sm leading-relaxed transition-colors truncate ${h.level === 3 ? "pl-3" : ""
                                            } ${activeId === h.id
                                                ? "text-primary"
                                                : "text-text-muted hover:text-text-primary"
                                            }`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const el = document.getElementById(h.id);
                                            if (!el) return;
                                            const top = el.getBoundingClientRect().top + window.scrollY - 100;
                                            window.scrollTo({ top, behavior: "smooth" });
                                        }}
                                    >
                                        {h.text}
                                    </a>
                                ))}
                            </nav>
                        </div>
                    </aside>
                )}
            </div>

            {/* 回到顶部 */}
            {showTopBtn && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-[#0a1f33]/95 border border-border backdrop-blur-sm text-text-muted hover:text-primary hover:border-primary transition-colors shadow-lg"
                    aria-label="回到顶部"
                >
                    <ArrowUp size={18} />
                </button>
            )}
        </div>
    );
}
