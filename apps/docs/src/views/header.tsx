import {
    Link,
    useLocation
} from "react-router";
import { motion as m } from "framer-motion";
import { GlowCard } from "@/components/glow-card";
import { preload } from "@/routes/router";
import jekit from "@/images/jekit.webp";
import {
    useEffect,
    useState,
} from "react";

// 当前展示的 GitHub 仓库（jekit-sdk 公开前先用此仓库测试星星数）
const GITHUB_REPO = "heyManNice/jekit-sdk";

// 格式化星星数量：109 → 109，1234 → 1.2k
function fmtStars(n: number): string {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return String(n);
}

function Logo() {
    return (
        <Link to="/" tabIndex={-1} className="flex items-center gap-5 max-md:hidden">
            <img src={jekit} alt="jekit" style={{ height: '32px' }} />
            <span className="text-sm">免费 · 公开 · 高效</span>
        </Link>
    );
}

function Github() {
    const [stars, setStars] = useState<number | null>(null);

    // 从 GitHub API 获取仓库星星数量
    useEffect(() => {
        let cancelled = false;
        fetch(`https://api.github.com/repos/${GITHUB_REPO}`)
            .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
            .then((data: { stargazers_count?: number }) => {
                if (!cancelled && typeof data.stargazers_count === "number") {
                    setStars(data.stargazers_count);
                }
            })
            .catch(() => {
                // 获取失败时保持隐藏（stars 为 null 时不显示数字）
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="md:w-40 flex justify-end items-center">
            <a href={`https://github.com/${GITHUB_REPO}`} aria-label="开源 收藏量" target="_blank" className="flex items-center cursor-pointer gap-2 md:border border-primary/20 self-center px-2 py-1 rounded">
                <svg className="w-6 h-6 fill-text-primary" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5475" width="20" height="20"><path d="M511.6 76.3C264.3 76.2 64 276.4 64 523.5 64 718.9 189.3 885 363.8 946c23.5 5.9 19.9-10.8 19.9-22.2v-77.5c-135.7 15.9-141.2-73.9-150.3-88.9C215 726 171.5 718 184.5 703c30.9-15.9 62.4 4 98.9 57.9 26.4 39.1 77.9 32.5 104 26 5.7-23.5 17.9-44.5 34.7-60.8-140.6-25.2-199.2-111-199.2-213 0-49.5 16.3-95 48.3-131.7-20.4-60.5 1.9-112.3 4.9-120 58.1-5.2 118.5 41.6 123.2 45.3 33-8.9 70.7-13.6 112.9-13.6 42.4 0 80.2 4.9 113.5 13.9 11.3-8.6 67.3-48.8 121.3-43.9 2.9 7.7 24.7 58.3 5.5 118 32.4 36.8 48.9 82.7 48.9 132.3 0 102.2-59 188.1-200 212.9 23.5 23.2 38.1 55.4 38.1 91v112.5c0.8 9 0 17.9 15 17.9 177.1-59.7 304.6-227 304.6-424.1 0-247.2-200.4-447.3-447.5-447.3z" p-id="5476"></path></svg>
                <span className="max-md:hidden">Stars</span>
                {stars != null && (
                    <span className="max-md:hidden">{fmtStars(stars)}</span>
                )}
            </a>
        </div>
    );
}

function NavLink(props: {
    to: string;
    label: string;
}) {
    const location = useLocation();
    // 首页精确匹配，其他导航支持子路径前缀匹配（如 /docs/intro/xxx 仍匹配 /docs/）
    const isActive = props.to === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(props.to);
    const activeClass = isActive ? "text-primary" : "text-text-primary";
    return (
        <Link
            to={props.to}
            className={"relative text-sm flex items-center px-2 hover:text-primary transition-colors " + activeClass}
            onMouseEnter={() => preload(props.to)}
            aria-label={props.label + "导航"}
        >
            {props.label}
            {isActive && (
                <m.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
            )}
        </Link>
    );
}

export function Header() {
    const navLinks = [
        { to: "/", label: "首页" },
        { to: "/docs/", label: "文档" },
        { to: "/stats/", label: "统计" },
        { to: "/blogs/", label: "博客" }
    ];
    return (
        <GlowCard className="border-b border-border px-5 backdrop-blur-sm sticky top-0 z-66">
            <header className="max-w-6xl mx-auto h-13 flex items-stretch justify-between gap-10 text-nowrap relative">
                <button
                    type="button"
                    tabIndex={0}
                    onClick={() => {
                        const el = document.querySelectorAll<HTMLElement>("[data-main-content]");
                        // 检测第一个没有被隐藏的元素
                        for (const e of el) {
                            if (e.offsetParent !== null) {
                                e.focus();
                                break;
                            }
                        }
                    }}
                    className="absolute text-center left-0 -top-10 focus:top-1 p-2 w-50 text-primary z-30 cursor-pointer"
                >
                    跳转到主要内容
                </button>
                <Logo />
                <nav className="flex gap-10 max-sm:gap-5">
                    {navLinks.map((link) => (
                        <NavLink key={link.to} to={link.to} label={link.label} />
                    ))}
                </nav>
                <Github />
            </header>
        </GlowCard>
    );
}