import {
    useEffect,
    useState,
} from "react";

import { GlowCard } from "@/components/glow-card";
import { HelpTooltip } from "@/components/help-tooltip";
import { SearchHistoryInput } from "@/components/search-history-input";
import { fmtDate } from "@/utils/format";
import { formatStatsUrl } from "@/utils/stats-url";
import { Link } from "react-router";
import type { StatsData, StatsQuery } from "../model/types";

interface DashboardHeaderProps {
    query: StatsQuery;
    history: readonly string[];
    stats: StatsData | null;
    onSearch: (value: string) => void;
    onRemoveHistory: (url: string) => void;
    onClearHistory: () => void;
}

// 仪表盘头部
export default function DashboardHeader({
    query,
    history,
    stats,
    onSearch,
    onRemoveHistory,
    onClearHistory,
}: DashboardHeaderProps) {
    const { domain, path } = query;
    const subPageCount = stats ? Number(stats.subPageCount) : null;
    const registeredAt = stats?.registeredAt ?? null;
    const pageLimitForSite = stats ? Number(stats.pageLimitForSite) : null;

    // 搜索框内容，初始为上次查询的地址
    const [text, setText] = useState(formatStatsUrl(domain, path));

    useEffect(() => {
        setText(formatStatsUrl(domain, path));
    }, [domain, path]);

    return (
        <section className="px-3 pt-6 max-sm:px-5">
            <div className="flex items-end max-md:items-stretch gap-8 max-md:flex-col max-md:gap-5">
                <div className="min-w-0 flex-1">
                    <h1 className="flex items-center gap-1.5 text-xl font-extrabold tracking-tight text-white max-sm:text-2xl mt-2 mb-1">
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
                    </h1>
                    <p className="text-sm text-text-secondary max-sm:text-xs">
                        搜索域名或页面路径，查看基础数据与趋势分析。
                        <span className="md:hidden">
                            网站开始登记日期：{fmtDate(registeredAt)}
                            {subPageCount != null && ` · 子页面数量：${subPageCount}`}
                            ，仅支持查看从网站开始使用日期到今天的数据。
                        </span>
                    </p>
                    {/* 搜索框：带历史记录下拉 */}
                    <SearchHistoryInput
                        value={text}
                        onChange={setText}
                        onSubmit={onSearch}
                        history={history}
                        onRemoveHistory={onRemoveHistory}
                        onClearHistory={onClearHistory}
                        placeholder="输入 URL，如 http://localhost/stats/"
                        ariaLabel="输入域名或页面路径"
                    />
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
