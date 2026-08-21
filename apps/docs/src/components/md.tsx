import "./md.css";
import {
    useLocation,
    useNavigate,
} from "react-router";
import {
    type MouseEvent,
} from "react";

// Markdown 渲染组件

interface MdProps {
    children: string;
    className?: string;
}

// 判断是否为站内路由链接（排除锚点、协议链接、协议相对链接）
function isInternalHref(href: string): boolean {
    if (!href || href.startsWith("#")) return false;
    if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(href)) return false;
    if (href.startsWith("//")) return false;
    return true;
}

// 将 markdown 中的链接解析为站内路由路径。
// 绝对路径（/docs/xxx/）直接使用；相对路径（../use/）以当前 URL 为基准解析，
// 与原生浏览器 <a> 的解析行为保持一致。
function resolveRoute(href: string, pathname: string): string | null {
    try {
        const url = href.startsWith("/")
            ? new URL(href, window.location.origin)
            : new URL(href, window.location.origin + pathname);
        return url.pathname + url.search + url.hash;
    } catch {
        return null;
    }
}

// Markdown → HTML 渲染组件
// 内容已在 Vite 编译期由 vite-plugin-md 预渲染为 HTML
// （含 shiki 代码高亮），运行时直接 innerHTML
export function Md({ children, className }: MdProps) {
    const navigate = useNavigate();
    const location = useLocation();

    // 拦截站内链接点击，交给 react-router 做 SPA 导航（避免整页刷新）
    const handleClick = (e: MouseEvent<HTMLDivElement>) => {
        if (e.defaultPrevented) return;
        if (e.button !== 0) return;
        // 修饰键（新标签/新窗口/下载等）保持浏览器默认行为
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        // 向上查找被点击的 <a>
        let el = e.target as HTMLElement | null;
        while (el && el.tagName !== "A") el = el.parentElement;
        const anchor = el as HTMLAnchorElement | null;
        if (!anchor) return;

        const href = anchor.getAttribute("href") ?? "";
        if (!isInternalHref(href)) return;
        // target="_blank" / download 链接保持默认行为
        if (anchor.target && anchor.target !== "_self") return;
        if (anchor.hasAttribute("download")) return;

        const to = resolveRoute(href, location.pathname);
        if (to === null) return;

        e.preventDefault();
        navigate(to);
    };

    return (
        <div
            className={["md", className].filter(Boolean).join(" ")}
            onClick={handleClick}
            dangerouslySetInnerHTML={{ __html: children }}
        />
    );
}
