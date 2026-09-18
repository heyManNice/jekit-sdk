import {
    Eye,
    MousePointerClick,
    User,
    Users,
} from "lucide-react";

import { GlowCard } from "@/components/glow-card";
import { AsyncBoundary } from "@/components/async-boundary";
import { HelpTooltip } from "@/components/help-tooltip";
import { Sparkline } from "@/components/sparkline";
import type { StatsResource } from "../model/types";
import { cumulativeSparkline } from "../model/presenters";

// 基本数值总览
export default function OverviewCards({
    resource,
    path,
}: {
    resource: StatsResource;
    path: string;
}) {
    const d = resource.data;

    const cards = [
        { label: "今日站点 UV", value: d?.todayVisitorForSite, daily: d?.dailyVisitorForSite, icon: Users, isPageMetric: false },
        { label: "今日站点 PV", value: d?.todayRequestForSite, daily: d?.dailyRequestForSite, icon: Eye, isPageMetric: false },
        { label: "今日页面 UV", value: d?.todayVisitorForPage, daily: d?.dailyVisitorForPage, icon: User, isPageMetric: true },
        { label: "今日页面 PV", value: d?.todayRequestForPage, daily: d?.dailyRequestForPage, icon: MousePointerClick, isPageMetric: true },
        { label: "累计站点 UV", value: d?.totalVisitorForSite, daily: cumulativeSparkline(d?.totalVisitorForSite, d?.dailyVisitorForSite), icon: Users, isPageMetric: false },
        { label: "累计站点 PV", value: d?.totalRequestForSite, daily: cumulativeSparkline(d?.totalRequestForSite, d?.dailyRequestForSite), icon: Eye, isPageMetric: false },
        { label: "累计页面 UV", value: d?.totalVisitorForPage, daily: cumulativeSparkline(d?.totalVisitorForPage, d?.dailyVisitorForPage), icon: User, isPageMetric: true },
        { label: "累计页面 PV", value: d?.totalRequestForPage, daily: cumulativeSparkline(d?.totalRequestForPage, d?.dailyRequestForPage), icon: MousePointerClick, isPageMetric: true },
    ] as const;

    return (
        <section className="page-section">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <GlowCard
                            key={card.label}
                            className="surface-card overflow-hidden px-4 py-3"
                        >
                            <AsyncBoundary api={resource}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 text-accent-bright">
                                            <Icon size={14} className="shrink-0" />
                                            <span className="truncate">{card.label}</span>
                                            {card.isPageMetric && (
                                                <HelpTooltip
                                                    content={
                                                        <div className="space-y-1.5">
                                                            <p>
                                                                <span className="text-chart-secondary">当前页面</span>
                                                                ：<span className="break-all">{path}</span>
                                                            </p>
                                                            <p>
                                                                <span className="text-accent">查询其他页面</span>
                                                                ：在上方搜索框输入该页面的完整 URL 后按回车。
                                                            </p>
                                                        </div>
                                                    }
                                                    size={12}
                                                    className="inline-flex shrink-0"
                                                />
                                            )}
                                        </div>
                                        <div className="mt-5 text-xl font-extrabold leading-none tracking-tight text-white max-sm:text-[26px]">
                                            {card.value ?? '-'}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 pt-1">
                                        <Icon size={16} className="text-primary/10" />
                                        <Sparkline data={card.daily ?? []} color="var(--color-primary)" heightClass="h-8 w-20 shrink-0" yMin={0} />
                                    </div>
                                </div>
                            </AsyncBoundary>
                        </GlowCard>
                    );
                })}
            </div>
        </section>
    );
}
