import {
    Eye,
    MousePointerClick,
    User,
    Users,
} from "lucide-react";

import {
    useEffect,
} from "react";
import { GlowCard } from "@/components/glow-card";
import { useApi } from "@/utils/api";
import { stats } from "jekit-core";
import { AsyncBoundary } from "@/components/async-boundary";
import { Sparkline } from "@/components/sparkline";
import { useRefetchOnChange } from "@/hooks/use-refetch-on-change";
import { useQueryStore } from "@/stores/query";

// 将每日增量数据换算为累计趋势（从 total - 7 日总和 累进到 total）。
// 从右往左累加后缀和，O(n)，避免原先 slice+reduce 的 O(n²)。
function cumulativeSparkline(
    total: number | bigint | undefined,
    daily: readonly number[] | undefined,
): number[] {
    if (total == null || !daily) return [];
    const t = Number(total);
    const result = new Array(daily.length);
    let suffix = 0;
    for (let i = daily.length - 1; i >= 0; i--) {
        result[i] = t - suffix;
        suffix += daily[i];
    }
    return result;
}

// 基本数值总览
export default function OverviewCards() {

    const { domain, path, version, setStatsInfo } = useQueryStore();

    const api = useApi(() => stats({ domain, path }));

    // 切换查询（version 变化）时重新请求
    useRefetchOnChange(api.update, [version]);

    // stats 请求成功后，将站点信息写入 store
    useEffect(() => {
        const row = api.data;
        if (row && row.subPageCount != null && row.registeredAt != null) {
            setStatsInfo(
                Number(row.subPageCount),
                row.registeredAt,
                Number(row.pageLimitForSite),
            );
        }
    }, [api.data, setStatsInfo]);

    const d = api.data;

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
                            <AsyncBoundary api={api}>
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
