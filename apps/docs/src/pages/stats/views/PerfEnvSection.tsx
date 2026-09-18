import { Line } from "react-chartjs-2";

import type { ChartData, ChartOptions } from "chart.js";

import { GlowCard } from "@/components/glow-card";
import { HelpTooltip } from "@/components/help-tooltip";
import { getBrandIconSrc } from "./brand-icons";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
    whichBrowserOption,
    whichOsOption,
} from "jekit-core";
import { AsyncBoundary } from "@/components/async-boundary";
import { gradientFill } from "@/utils/chart";
import { themeColor } from "@/utils/theme";
import type {
    PerformanceResource,
    SourceResource,
} from "../model/types";
import {
    buildDimensionRows,
    buildPerformancePoints,
    type DimensionRow,
    type PerformancePoint,
} from "../model/presenters";

// 维度枚举 → 显示名称映射（与 getBrandIconSrc key 一致）

// 图例小色块
function ChartLegendDot({ className }: { className: string }) {
    return <span className={`inline-block h-2 w-4 bg-linear-to-r ${className}`} />;
}

// 性能数据点（TTFB / PLT 占比 + 原始计数）
interface TrafficChartProps {
    rawData: PerformancePoint[];
    chartData: ChartData<"line">;
    chartOptions: ChartOptions<"line">;
}

// 性能指标折线图（含桌面 tooltip 与手机弹窗说明）
function TrafficChart({ rawData, chartData, chartOptions }: TrafficChartProps) {
    // 性能说明内容（桌面 tooltip 和手机弹窗共用）
    const tooltipContent = (
        <div className="space-y-1.5">
            <p><span className="text-chart-secondary">TTFB</span>：首字节时间，从请求发出到收到服务器响应第一个字节的耗时。</p>
            <p><span className="text-chart-purple-soft">PLT</span>：页面加载时间，页面完全加载渲染完成的总耗时。</p>
            <p><span className="text-chart-green">数据范围</span>：为了减少服务器储存压力。性能指标只储存当天数据。</p>
        </div>
    );

    return (
        <div className="flex h-55 flex-col">
            <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-sm text-white">
                    <span>性能指标</span>
                    <HelpTooltip content={tooltipContent} />
                </div>
                <div className="flex items-center gap-4 text-xs text-text-secondary">
                    <span className="flex items-center gap-2"><ChartLegendDot className="from-chart-ttfb-start to-chart-ttfb-end" />TTFB</span>
                    <span className="flex items-center gap-2"><ChartLegendDot className="from-chart-plt-start to-chart-plt-end" />PLT</span>
                </div>
            </div>

            {/* Chart.js 折线图 */}
            <div className="relative flex-1 rounded-xl">
                {rawData.length > 0 ? (
                    <Line data={chartData} options={chartOptions} />
                ) : (
                    <div className="flex h-full items-center justify-center text-sm text-text-secondary">
                        今日无数据，请访问网站后重新查询
                    </div>
                )}
            </div>
        </div>
    );
}

interface SourceTableProps {
    title: string;
    api: { data: DimensionRow[] | null; loading: boolean; error: Error | null };
}

// 来源表格（浏览器 / 操作系统）
function SourceTable({ title, api }: SourceTableProps) {
    return (
        <GlowCard className="surface-card overflow-hidden px-4 py-4">
            <AsyncBoundary api={api}>
                <div className="min-h-53">
                    {/* 表头 — 不滚动 */}
                    <div className="grid grid-cols-[minmax(0,1fr)_80px_55px] text-xs">
                        <div className="text-text-secondary">{title}</div>
                        <div className="text-right text-text-secondary">今日 / 总请求</div>
                        <div className="text-right text-text-secondary">占比</div>
                    </div>

                    {/* 数据行 — 仅 PC 超出滚动 */}
                    <div className="xl:max-h-53 xl:overflow-y-auto max-xl:overflow-visible">
                        <div className="mt-3.5 flex flex-col gap-y-3.5 text-xs">
                            {api.data?.map((row, index) => (
                                <motion.div
                                    key={row.name}
                                    className="grid grid-cols-[minmax(0,1fr)_80px_55px]"
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                        delay: index * 0.05,
                                        duration: 0.25,
                                        ease: "easeOut",
                                    }}
                                >
                                    <div className="flex min-w-0 items-center gap-2 text-text-data-alt">
                                        <img src={getBrandIconSrc(row.name)} alt={row.name} height={16} width={16} />
                                        <span className="truncate">{row.name}</span>
                                    </div>
                                    <div className="text-right text-white">{row.todayVisits} / {row.totalVisits}</div>
                                    <div className="text-right text-white">{row.ratio}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </AsyncBoundary>
        </GlowCard>
    );
}

// 性能与环境分析
interface PerfEnvSectionProps {
    performanceResource: PerformanceResource;
    browserResource: SourceResource;
    osResource: SourceResource;
}

export default function PerfEnvSection({
    performanceResource,
    browserResource,
    osResource,
}: PerfEnvSectionProps) {

    const chartTheme = useMemo(() => ({
        ttfb: themeColor("--color-chart-secondary"),
        plt: themeColor("--color-chart-purple"),
        surface: themeColor("--color-surface"),
        text: themeColor("--color-text-chart"),
        textMuted: themeColor("--color-text-chart-muted"),
        border: themeColor("--color-control-border"),
        grid: themeColor("--color-chart-grid"),
    }), []);

    const browserRows = useMemo(
        () => (browserResource.data ? buildDimensionRows(browserResource.data, whichBrowserOption) : null),
        [browserResource.data],
    );

    const osRows = useMemo(
        () => (osResource.data ? buildDimensionRows(osResource.data, whichOsOption, { iOS: "IOS", HarmonyOS: "HMOS" }) : null),
        [osResource.data],
    );

    // 性能数据：去除两端的 0，只保留有数据的范围，并计算占比
    const perfRawData = useMemo(
        () => buildPerformancePoints(performanceResource.data),
        [performanceResource.data],
    );

    const perfChartData: ChartData<"line"> = useMemo(
        () => ({
            labels: perfRawData.map((d) => d.label),
            datasets: [
                {
                    label: "TTFB",
                    data: perfRawData.map((d) => d.ttfb),
                    borderColor: chartTheme.ttfb,
                    backgroundColor: gradientFill(chartTheme.ttfb, 0.2),
                    fill: true,
                    tension: 0.3,
                    borderWidth: 1,
                    pointBackgroundColor: chartTheme.ttfb,
                    pointRadius: 0,
                    pointHoverRadius: 2,
                },
                {
                    label: "PLT",
                    data: perfRawData.map((d) => d.plt),
                    borderColor: chartTheme.plt,
                    backgroundColor: gradientFill(chartTheme.plt, 0.2),
                    fill: true,
                    tension: 0.3,
                    borderWidth: 1,
                    pointBackgroundColor: chartTheme.plt,
                    pointRadius: 0,
                    pointHoverRadius: 2,
                },
            ],
        }),
        [perfRawData, chartTheme],
    );

    const perfChartOptions: ChartOptions<"line"> = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 600,
            },
            transitions: {
                resize: {
                    animation: {
                        duration: 600,
                    },
                },
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    intersect: false,
                    backgroundColor: chartTheme.surface,
                    titleColor: chartTheme.textMuted,
                    bodyColor: chartTheme.text,
                    borderColor: chartTheme.border,
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: (ctx) => {
                            const raw = perfRawData[ctx.dataIndex];
                            const label = ctx.dataset.label ?? "";
                            const pct = ctx.parsed.y;
                            const cnt = raw
                                ? ctx.dataset.label === "TTFB"
                                    ? raw.ttfbRaw
                                    : raw.pltRaw
                                : 0;
                            return `${label}: ${pct}%（${cnt} 次）`;
                        },
                    },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: chartTheme.textMuted,
                        font: { size: 11 },
                        maxTicksLimit: 8,
                    },
                },
                y: {
                    grid: { color: chartTheme.grid },
                    ticks: {
                        color: chartTheme.textMuted,
                        font: { size: 11 },
                        maxTicksLimit: 5,
                        callback: (value) => `${value}%`,
                    },
                    min: 0,
                },
            },
        }),
        [perfRawData, chartTheme],
    );

    return (
        <section className="page-section">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.25fr_1fr_1fr]">
                <GlowCard className="surface-card min-w-0 overflow-hidden px-4 py-4">
                    <AsyncBoundary api={performanceResource} className="h-full">
                        <TrafficChart
                            rawData={perfRawData}
                            chartData={perfChartData}
                            chartOptions={perfChartOptions}
                        />
                    </AsyncBoundary>
                </GlowCard>
                <div className="min-w-0">
                    <SourceTable title="浏览器来源" api={{ data: browserRows, loading: browserResource.loading, error: browserResource.error }} />
                </div>
                <div className="min-w-0">
                    <SourceTable title="操作系统来源" api={{ data: osRows, loading: osResource.loading, error: osResource.error }} />
                </div>
            </div>
        </section>
    );
}
