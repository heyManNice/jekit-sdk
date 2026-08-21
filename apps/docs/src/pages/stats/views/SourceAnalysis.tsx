import { GlowCard } from "@/components/glow-card";
import { getBrandIconSrc } from "./brand-icons";

import {
    useMemo,
} from "react";
import { motion } from "framer-motion";
import { useApi } from "@/utils/api";
import {
    source,
    scopeOption,
    dimensionOption,
    whereWasIFromOption,
} from "jekit-core";
import { AsyncBoundary } from "@/components/async-boundary";
import { Sparkline } from "@/components/sparkline";
import { useRefetchOnChange } from "@/hooks/use-refetch-on-change";
import { useQueryStore } from "@/stores/query";

// 搜索引擎颜色映射
const SEARCH_COLORS: Record<string, string> = {
    Google: "from-[#4cc7ff] to-[#06e6e2]",
    Baidu: "from-[#7a8dff] to-[#b46cff]",
    Direct: "from-[#6a7a8e] to-[#9aa7ba]",
    Bing: "from-[#60d8ff] to-[#22dfe5]",
    Doubao: "from-[#ff8d4a] to-[#ff5f6d]",
    Copilot: "from-[#8a67ff] to-[#53d5ff]",
    Claude: "from-[#ffb36b] to-[#ff8b3d]",
    Other: "from-[#c3cad5] to-[#8f9db4]",
};

interface SearchRow {
    name: string;
    visitsToday: string;
    visitsTotal: string;
    ratio: string;
    daily: readonly number[];
    color: string;
}

// 从 source API 响应构建搜索引擎行数据
function buildSearchRows(
    data: readonly {
        dimensionIndex: number;
        totalRequest: bigint;
        todayRequest: number;
        dailyRequest: readonly number[];
    }[] | null,
): SearchRow[] {
    if (!data) return [];
    const dataMap = new Map(data.map((d) => [d.dimensionIndex, d]));
    const grandTotal = data.reduce((s, d) => s + Number(d.totalRequest), 0);

    return (
        Object.values(whereWasIFromOption)
            .filter((v): v is number => typeof v === "number")
            .map((index) => {
                const entry = dataMap.get(index);
                const name = whereWasIFromOption[index] as string;
                const totalRequest = entry ? Number(entry.totalRequest) : 0;
                const todayRequest = entry ? entry.todayRequest : 0;
                return {
                    name,
                    visitsToday: todayRequest.toLocaleString(),
                    visitsTotal: totalRequest.toLocaleString(),
                    ratio:
                        grandTotal > 0
                            ? ((totalRequest / grandTotal) * 100).toFixed(1) + "%"
                            : "0%",
                    daily: entry?.dailyRequest ?? [],
                    color: SEARCH_COLORS[name] ?? "from-[#c3cad5] to-[#8f9db4]",
                    sortKey: totalRequest,
                };
            })
            .sort((a, b) => {
                if (a.name === "Other") return 1;
                if (b.name === "Other") return -1;
                return b.sortKey - a.sortKey;
            })
    );
}

// 来源分析
export default function SourceAnalysis() {

    const { domain, path, version } = useQueryStore();

    const api = useApi(() =>
        source({ domain, path, scope: scopeOption.Site, dimension: dimensionOption.SearchEngine }),
    );

    // 切换查询（version 变化）时重新请求
    useRefetchOnChange(api.update, [version]);

    const rows = useMemo(
        () => (api.data ? buildSearchRows(api.data) : null),
        [api.data],
    );

    return (
        <section className="px-3 pt-6 max-sm:px-5">
            <GlowCard className="rounded border overflow-auto border-[#081A2B] bg-[#03101C]/90 px-4 py-4 backdrop-blur-sm">
                <AsyncBoundary api={{ data: rows, loading: api.loading, error: api.error }}>
                    <div className="min-h-30">
                        <div className="grid grid-cols-[minmax(100px,1.15fr)_90px_90px_110px_120px] items-center gap-3 text-xs text-text-secondary">
                            <div>搜索引擎来源</div>
                            <div className="text-center">站点今日请求量</div>
                            <div className="text-center">站点总请求</div>
                            <div className="text-center">总请求比例</div>
                            <div className="text-center">趋势</div>
                        </div>

                        <div className="mt-2 flex flex-col gap-y-1">
                            {rows?.map((item, index) => (
                                <motion.div
                                    key={item.name}
                                    className="grid text-xs grid-cols-[minmax(100px,1.15fr)_90px_90px_110px_120px] items-center gap-3 rounded px-2 py-1"
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                        delay: index * 0.05,
                                        duration: 0.25,
                                        ease: "easeOut",
                                    }}
                                >
                                    <div className="flex min-w-0 items-center gap-3 text-[#ecf6ff]">
                                        <img src={getBrandIconSrc(item.name)} alt={item.name} height={16} width={16} />
                                        <span className="truncate">{item.name}</span>
                                    </div>
                                    <div className="text-center text-white">{item.visitsToday}</div>
                                    <div className="text-center text-white">{item.visitsTotal}</div>
                                    <div className="text-center text-white">{item.ratio}</div>
                                    <div className="flex justify-center">
                                        <Sparkline
                                            data={item.daily}
                                            heightClass="h-4 w-16"
                                            tension={0.1}
                                            fill="rgba(17, 235, 233, 0.12)"
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </AsyncBoundary>
            </GlowCard>
        </section>
    );
}
