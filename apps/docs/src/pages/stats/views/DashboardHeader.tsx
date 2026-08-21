import {
    Search,
} from "lucide-react";

import { GlowCard } from "@/components/glow-card";
import { HelpTooltip } from "@/components/help-tooltip";
import { useQueryStore } from "@/stores/query";
import { fmtDate } from "@/utils/format";
import { Link } from "react-router";

// 从输入文本中提取 domain 和 path
function parseInput(text: string): { domain: string; path: string } {
    try {
        const url = new URL(text.startsWith("http") ? text : `https://${text}`);
        return { domain: url.origin, path: url.pathname };
    } catch {
        return { domain: text, path: "/" };
    }
}

// 仪表盘头部
export default function DashboardHeader() {
    const { domain, path, search, subPageCount, registeredAt, pageLimitForSite } = useQueryStore();

    const handleSearch = (value: string) => {
        const { domain: d, path: p } = parseInput(value);
        search(d, p);
    };

    return (
        <section className="px-3 pt-6 max-sm:px-5">
            <div className="flex items-end max-md:items-stretch gap-8 max-md:flex-col max-md:gap-5">
                <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-xl font-extrabold tracking-tight text-white max-sm:text-2xl max-md:hidden mt-2 mb-1">
                        统计查看
                        {/* 悬浮说明图标 */}
                        <HelpTooltip
                            size={14}
                            content={
                                <div className="space-y-1.5">
                                    <p><span className="text-[#5FECE6]">查询方式</span>：在搜索框输入 URL 后按回车即可查询。需要包含http部分。</p>
                                    <p><span className="text-[#22dfe5]">页面指标</span>：页面的指标是你当前查询的 URL 的路径所对应的路径的指标</p>
                                    <p><span className="text-[#5FECE6]">为什么不直接罗列我的域名的所有子页面？</span>：出于隐私安全考虑，jekit-sdk 不会上报域名的路径名，所以后端不知道你的域名有哪些子页面。</p>
                                </div>
                            }
                        />
                    </p>
                    <p className="text-sm text-text-secondary max-sm:text-xs">
                        搜索域名或页面路径，查看基础数据与趋势分析。
                        <span className="md:hidden">
                            网站开始登记日期：{fmtDate(registeredAt)}
                            {subPageCount != null && ` · 子页面数量：${subPageCount}`}
                            ，仅支持查看从网站开始使用日期到今天的数据。
                        </span>
                    </p>
                    {/* 搜索框 */}
                    <GlowCard className="mt-5 flex items-stretch gap-0 overflow-hidden rounded border border-[#102336] bg-[#03101C]/90 max-sm:flex-col max-w-180 transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10">
                        <div className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2">
                            <span className="sr-only">输入域名或页面路径</span>
                            <input
                                type="text"
                                data-main-content="true"
                                className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
                                defaultValue={`${domain}${path}`}
                                placeholder="输入 URL，如 http://localhost/stats/"
                                aria-label="输入域名或页面路径"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleSearch(e.currentTarget.value);
                                    }
                                }}
                            />
                            <button
                                type="button"
                                className="flex shrink-0 items-center justify-center rounded-full p-1 text-text-secondary transition-colors hover:text-primary"
                                aria-label="执行搜索"
                                onClick={() => {
                                    const input = document.querySelector<HTMLInputElement>(
                                        "input[aria-label='输入域名或页面路径']",
                                    );
                                    if (input) handleSearch(input.value);
                                }}
                            >
                                <Search size={18} />
                            </button>
                        </div>
                    </GlowCard>
                </div>

                {/* 数据起始日期 */}
                <GlowCard className="rounded overflow-hidden border border-[#081A2B] bg-[#03101C]/90 px-4 py-2 max-md:hidden">
                    <div className="mb-3 flex items-center gap-2 text-sm text-primary">
                        网站开始登记日期
                    </div>
                    <div className="text-sm font-bold text-white">
                        {fmtDate(registeredAt)}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
                        <span>子页面数量：{subPageCount ?? "-"} / {pageLimitForSite ?? "-"}</span>
                        {/* 悬浮说明图标 */}
                        <HelpTooltip
                            size={12}
                            content={
                                <div className="space-y-1.5">
                                    <p><span className="text-[#22dfe5]">子页面数量限制</span>：目的是防止服务器资源被无限耗尽。如果当前配置不足够使用，你可以添加 <Link className="underline" to="/docs/intro/what-this-is/">交流群</Link> 免费提高限制。</p>
                                </div>
                            }
                        />
                    </div>
                    <p className="mt-2 text-xs leading-5 text-text-secondary">
                        仅支持查看从网站开始使用日期到今天的数据
                    </p>
                </GlowCard>
            </div>
        </section>
    );
}
