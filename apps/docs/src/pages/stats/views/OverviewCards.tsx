import {
    Eye,
    MousePointerClick,
    User,
    Users,
} from "lucide-react";

import { GlowCard } from "@/components/glow-card";
import { AsyncBoundary } from "@/components/async-boundary";
import { Sparkline } from "@/components/sparkline";
import type { StatsResource } from "../model/types";
import { cumulativeSparkline } from "../model/presenters";

// 基本数值总览
export default function OverviewCards({ resource }: { resource: StatsResource }) {
    const d = resource.data;

    const cards = [
        { label: "今日站点访客量", value: d?.todayVisitorForSite, daily: d?.dailyVisitorForSite, icon: Users },
        { label: "今日站点浏览量", value: d?.todayRequestForSite, daily: d?.dailyRequestForSite, icon: Eye },
        { label: "今日页面访客量", value: d?.todayVisitorForPage, daily: d?.dailyVisitorForPage, icon: User },
        { label: "今日页面浏览量", value: d?.todayRequestForPage, daily: d?.dailyRequestForPage, icon: MousePointerClick },
        { label: "总站点访客量", value: d?.totalVisitorForSite, daily: cumulativeSparkline(d?.totalVisitorForSite, d?.dailyVisitorForSite), icon: Users },
        { label: "总站点浏览量", value: d?.totalRequestForSite, daily: cumulativeSparkline(d?.totalRequestForSite, d?.dailyRequestForSite), icon: Eye },
        { label: "总页面访客量", value: d?.totalVisitorForPage, daily: cumulativeSparkline(d?.totalVisitorForPage, d?.dailyVisitorForPage), icon: User },
        { label: "总页面浏览量", value: d?.totalRequestForPage, daily: cumulativeSparkline(d?.totalRequestForPage, d?.dailyRequestForPage), icon: MousePointerClick },
    ] as const;

    return (
        <section className="px-3 pt-6 max-sm:px-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <GlowCard
                            key={card.label}
                            className="rounded border overflow-hidden border-[#081A2B] bg-[#03101C]/90 px-4 py-3 backdrop-blur-sm"
                        >
                            <AsyncBoundary api={resource}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 text-[#64f6ef]">
                                            <Icon size={14} className="shrink-0" />
                                            <span className="truncate">{card.label}</span>
                                        </div>
                                        <div className="mt-5 text-xl font-extrabold leading-none tracking-tight text-white max-sm:text-[26px]">
                                            {card.value ?? '-'}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 pt-1">
                                        <Icon size={16} className="text-primary/10" />
                                        <Sparkline data={card.daily ?? []} color="#06e6e2" heightClass="h-8 w-20 shrink-0" yMin={0} />
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
