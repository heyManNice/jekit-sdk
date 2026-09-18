import { GlowCard } from "@/components/glow-card";
import { getBrandIconSrc } from "./brand-icons";

import {
    useMemo,
} from "react";
import { motion } from "framer-motion";
import { whereWasIFromOption } from "jekit-core";
import { AsyncBoundary } from "@/components/async-boundary";
import { Sparkline } from "@/components/sparkline";
import type { SourceResource } from "../model/types";
import { buildSearchRows } from "../model/presenters";

// 来源分析
export default function SourceAnalysis({ resource }: { resource: SourceResource }) {
    const rows = useMemo(
        () => (resource.data ? buildSearchRows(resource.data, whereWasIFromOption) : null),
        [resource.data],
    );

    return (
        <section className="px-3 pt-6 max-sm:px-5">
            <GlowCard className="rounded border overflow-auto border-[#081A2B] bg-[#03101C]/90 px-4 py-4 backdrop-blur-sm">
                <AsyncBoundary api={{ data: rows, loading: resource.loading, error: resource.error }}>
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
