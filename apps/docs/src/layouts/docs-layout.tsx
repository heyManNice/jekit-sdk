import {
    Outlet,
    useLocation,
    useNavigate,
    useNavigation,
    Link
} from "react-router";
import { Menu, X } from "lucide-react";
import { Header } from "@/views/header";
import { Footer } from "@/views/footer";
import {
    useLayoutEffect,
    useMemo,
    useState,
    useEffect,
    useRef
} from "react";
import sidebar from "@/pages/docs/content/sidebar.md?raw";
import { usePageEnterAnimation } from "@/hooks/use-page-enter-animation";
import { isFirstLoad } from "@/utils/first-load";

// 侧边栏 Markdown 解析

interface SidebarItem {
    label: string;
    href: string;
}

interface SidebarSection {
    title: string;
    items: SidebarItem[];
}

// 将 sidebar.md 原文解析为结构化数据
function parseSidebarMarkdown(raw: string): SidebarSection[] {
    const lines = raw.split("\n");
    const sections: SidebarSection[] = [];
    let current: SidebarSection | null = null;

    for (const line of lines) {
        const trimmed = line.trim();

        // ## 标题 → 新分组
        const headingMatch = trimmed.match(/^##\s+(.+)/);
        if (headingMatch) {
            current = { title: headingMatch[1], items: [] };
            sections.push(current);
            continue;
        }

        // * [文本](链接) → 分组下的条目
        const itemMatch = trimmed.match(/^\*\s+\[([^\]]+)\]\(([^)]+)\)/);
        if (itemMatch && current) {
            // ./intro/what-this-is.md → /docs/intro/what-this-is/
            const path = "/docs/" + itemMatch[2]
                .replace(/^\.\//, "")
                .replace(/\.md$/, "") + "/";
            current.items.push({
                label: itemMatch[1],
                href: path,
            });
        }
    }

    return sections;
}

// 边栏条目渲染（供手机/桌面端复用）

function renderSidebarItems(
    sections: SidebarSection[],
    currentPath: string,
    onItemClick?: () => void
) {
    return sections.map((section) => (
        <div key={section.title} className="mb-4">
            <h3 className="text-xs font-semibold px-3 mb-2 tracking-wide">
                {section.title}
            </h3>
            <ul>
                {section.items.map((item, i) => {
                    const isActive = currentPath === item.href;
                    return (
                        <li key={item.href}>
                            <Link
                                to={item.href}
                                onClick={onItemClick}
                                data-main-content={i === 0}
                                className={
                                    "block px-3 py-1.5 text-sm rounded-r-md " +
                                    "border-l-2 transition-colors duration-200 " +
                                    (isActive
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-transparent text-text-secondary hover:text-text-primary hover:bg-white/5")
                                }
                            >
                                {item.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    ));
}

// 边栏（桌面端）

function DesktopSidebar() {
    const location = useLocation();
    const sections = useMemo(() => parseSidebarMarkdown(sidebar), []);
    const navRef = useRef<HTMLElement>(null);

    useLayoutEffect(() => {
        if (isFirstLoad) return;
        navRef.current?.animate(
            [
                { transform: "translateY(30px)", opacity: 0 },
                { transform: "translateY(0)", opacity: 1 }
            ],
            {
                duration: 500,
                easing: "cubic-bezier(0.25, 0.1, 0.25, 1.0)"
            }
        );
    }, []);

    return (
        <nav
            ref={navRef}
            className="hidden lg:block w-56 shrink-0 border-r border-border pr-4 pt-9 sticky top-13 self-start"
        >
            <h2 className="text-base font-bold px-3 mb-4">文档指南</h2>
            {renderSidebarItems(sections, location.pathname)}
        </nav>
    );
}

// 文档页 Layout

export function DocsLayout() {
    const location = useLocation();
    const navigation = useNavigation();
    const navigate = useNavigate();
    const isPageLoading = navigation.state === "loading";
    const sections = useMemo(() => parseSidebarMarkdown(sidebar), []);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const mainRef = useRef<HTMLElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    // 页面切换：滚动到顶部 + 仅内容区做滑入动画（边栏不受影响）
    usePageEnterAnimation(mainRef, contentRef);

    // 路由切换时自动关闭手机端侧栏
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    // /docs/ 无子路径时自动跳转到首个文档
    useEffect(() => {
        if (location.pathname === "/docs/" && sections[0]?.items[0]) {
            navigate(sections[0].items[0].href, { replace: true });
        }
    }, [location.pathname, sections, navigate]);

    return (
        <>
            <Header />
            {isPageLoading &&
                <div className="loading-overlay" />
            }
            <main ref={mainRef} className="max-w-6xl mx-auto pb-12">
                {/* 手机端菜单按钮 */}
                <div className="lg:hidden px-4 pt-4">
                    <button
                        onClick={() => setSidebarOpen((v) => !v)}
                        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                        aria-label={sidebarOpen ? "关闭导航菜单" : "打开导航菜单"}
                    >
                        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                        文档导航
                    </button>
                </div>

                {/* 手机端遮罩 */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* 手机端抽屉（fixed 脱离 flex 流） */}
                <nav
                    className={[
                        "fixed inset-y-0 left-0 z-50",
                        "w-56 bg-text-inverse border-r border-border",
                        "overflow-y-auto pr-4 pt-9",
                        "transform transition-transform duration-300",
                        sidebarOpen ? "translate-x-0" : "-translate-x-full",
                        "lg:hidden"
                    ].join(" ")}
                >
                    <h2 className="text-base font-bold px-3 mb-4 mt-14">
                        文档指南
                    </h2>
                    {renderSidebarItems(sections, location.pathname, () => setSidebarOpen(false))}
                </nav>

                <div className="flex flex-row">
                    <DesktopSidebar />
                    <div ref={contentRef} className="flex-1 px-4 lg:px-6 min-w-0">
                        <Outlet context={{ sections }} />
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
