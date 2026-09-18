import {
    Download,
} from "lucide-react";

import { Line } from "react-chartjs-2";

import type { ChartData, ChartOptions } from "chart.js";

import { GlowCard } from "@/components/glow-card";

import {
    useCallback,
    useMemo,
    useState,
} from "react";
import { metricOption } from "jekit-core";
import { AsyncBoundary } from "@/components/async-boundary";
import { Dropdown } from "@/components/dropdown";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { gradientFill } from "@/utils/chart";
import { fmtMonthDay } from "@/utils/format";
import { themeColor } from "@/utils/theme";
import {
    buildCsv,
    buildXlsHtml,
    downloadBlob,
} from "@/utils/export";
import { fetchHistory } from "../model/api";
import type { StatsQuery } from "../model/types";
import {
    DIMENSION_OPTIONS,
    METRICS,
    RANGE_CONFIG,
    type MetricDefinition,
} from "../model/trend-config";
import {
    ExportDialog,
    type ExportFormat,
} from "./ExportDialog";

const chartTheme = {
    primary: themeColor("--color-chart-primary"),
    surface: themeColor("--color-surface"),
    text: themeColor("--color-text-chart"),
    textMuted: themeColor("--color-text-chart-muted"),
    border: themeColor("--color-control-border"),
    grid: themeColor("--color-chart-grid"),
} as const;

// 趋势折线图的通用配置（不含数据，模块级常量避免每次渲染重建）
const TREND_CHART_OPTIONS: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600 },
    transitions: { resize: { animation: { duration: 600 } } },
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
        },
    },
    scales: {
        x: {
            grid: { display: false },
            ticks: { color: chartTheme.textMuted, font: { size: 10 } },
        },
        y: {
            grid: { color: chartTheme.grid },
            ticks: {
                color: chartTheme.textMuted,
                font: { size: 10 },
                callback: (value) => {
                    const v = Number(value);
                    return v < 10000 ? String(v) : (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + "k";
                },
            },
            beginAtZero: true,
        },
    },
};

// 趋势分析
interface TrendAnalysisProps {
    query: StatsQuery;
    refreshToken: number;
}

export default function TrendAnalysis({ query, refreshToken }: TrendAnalysisProps) {
    const [activeRange, setActiveRange] = useState<(typeof RANGE_CONFIG)[number]>(RANGE_CONFIG[0]);
    const [activeMetric, setActiveMetric] = useState<MetricDefinition>(METRICS[0]);
    const [dimensionValue, setDimensionValue] = useState(0);

    // 导出弹窗状态
    const [showExportModal, setShowExportModal] = useState(false);
    const [selectedMetrics, setSelectedMetrics] = useState<Set<metricOption>>(
        () => new Set(METRICS.map((m) => m.value)),
    );
    const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
    const [exporting, setExporting] = useState(false);
    const [exportRange, setExportRange] = useState<(typeof RANGE_CONFIG)[number]>(RANGE_CONFIG[0]);

    const { domain, path } = query;

    // 切换指标勾选
    const toggleMetric = useCallback((value: metricOption) => {
        setSelectedMetrics((prev) => {
            const next = new Set(prev);
            if (next.has(value)) {
                next.delete(value);
            } else {
                next.add(value);
            }
            return next;
        });
    }, []);

    // 全选/取消全选
    const toggleAll = useCallback(() => {
        setSelectedMetrics((prev) =>
            prev.size === METRICS.length
                ? new Set<metricOption>()
                : new Set(METRICS.map((m) => m.value)),
        );
    }, []);

    // 导出数据
    const handleExport = useCallback(async () => {
        if (selectedMetrics.size === 0) return;
        setExporting(true);
        try {
            const selected = METRICS.filter((m) => selectedMetrics.has(m.value));
            // 并行请求所有选中指标的数据
            const results = await Promise.all(
                selected.map(async (metric) => {
                    const data = await fetchHistory({
                        domain,
                        path,
                        range: exportRange.apiRange,
                        metric: metric.value,
                        dimensionValue,
                    });
                    return {
                        metric: metric.label,
                        data: (data ?? []).map((d) => ({
                            date: fmtMonthDay(d.date),
                            value: Number(d.value),
                        })),
                    };
                }),
            );

            const timestamp = new Date().toISOString().slice(0, 10);
            const filename = `trend-${timestamp}`;

            if (exportFormat === "json") {
                downloadBlob(
                    JSON.stringify(results, null, 2),
                    `${filename}.json`,
                    "application/json",
                );
            } else if (exportFormat === "csv") {
                downloadBlob(buildCsv(results), `${filename}.csv`, "text/csv;charset=utf-8");
            } else {
                // Excel 格式：生成简易 XLSX (HTML table 方式，Excel 可打开)
                downloadBlob(buildXlsHtml(results), `${filename}.xls`, "application/vnd.ms-excel");
            }

            setShowExportModal(false);
        } catch (err) {
            console.error("导出失败", err);
        } finally {
            setExporting(false);
        }
    }, [selectedMetrics, domain, path, exportRange, dimensionValue, exportFormat]);

    const dimOptions = activeMetric.dimensionType
        ? DIMENSION_OPTIONS[activeMetric.dimensionType]
        : null;

    const api = useAsyncResource(
        `history:${domain}\u0000${path}\u0000${activeRange.apiRange}\u0000${activeMetric.value}\u0000${dimensionValue}\u0000${refreshToken}`,
        () => fetchHistory({
            domain,
            path,
            range: activeRange.apiRange,
            metric: activeMetric.value,
            dimensionValue,
        }),
    );

    const rawData = useMemo(() => {
        if (!api.data) return null;

        // 按日期升序排列，取最后 N 条
        const sorted = [...api.data].sort(
            (a, b) => Number(a.date - b.date),
        );
        const sliced = activeRange.slice === Infinity
            ? sorted
            : sorted.slice(-activeRange.slice);

        return sliced.map((d) => ({
            date: fmtMonthDay(d.date),
            visits: Number(d.value),
        }));
    }, [api.data, activeRange]);

    const chartData: ChartData<"line"> | null = useMemo(
        () => rawData
            ? {
                labels: rawData.map((d) => d.date),
                datasets: [
                    {
                        data: rawData.map((d) => d.visits),
                        borderColor: chartTheme.primary,
                        borderWidth: 1.5,
                        backgroundColor: gradientFill(chartTheme.primary, 0.5),
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: chartTheme.primary,
                        pointRadius: 2,
                        pointHoverRadius: 4,
                    },
                ],
            }
            : null,
        [rawData],
    );

    return (
        <section className="page-section">
            <GlowCard className="rounded border overflow-hidden border-card-border bg-surface-muted/70 backdrop-blur-sm">
                <AsyncBoundary api={api}>
                    <div className="min-h-50 px-5">
                        {/* 子栏：趋势指标 + 时间选择 */}
                        <div className="mt-4 flex flex-col gap-3 pb-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-5">
                                <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                                    <span>趋势分析</span>
                                </div>
                                {/* 指标选择 */}
                                <div className="max-sm:flex-1">
                                    <Dropdown
                                        items={METRICS}
                                        selected={activeMetric.value}
                                        minWidth="min-w-50 max-sm:min-w-0 max-sm:w-full"
                                        onSelect={(value) => {
                                            const m = METRICS.find((x) => x.value === value)!;
                                            const dims = m.dimensionType
                                                ? DIMENSION_OPTIONS[m.dimensionType]
                                                : undefined;
                                            setActiveMetric(m);
                                            setDimensionValue(dims?.[0]?.value ?? 0);
                                        }}
                                    />
                                </div>

                                {/* 维度值选择（仅维度相关指标显示） */}
                                {dimOptions && (
                                    <div className="max-sm:w-full">
                                        <Dropdown
                                            items={dimOptions}
                                            selected={dimensionValue}
                                            onSelect={setDimensionValue}
                                            minWidth="min-w-32 max-sm:min-w-0 max-sm:w-full"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* 时间选择按钮组 */}
                            <div className="flex flex-wrap items-center gap-1 rounded border border-control-border bg-surface/90 p-1 sm:flex-nowrap max-sm:w-full">
                                {RANGE_CONFIG.map((cfg) => (
                                    <button
                                        key={cfg.label}
                                        type="button"
                                        onClick={() => setActiveRange(cfg)}
                                        className={`rounded cursor-pointer px-2 py-1 text-xs transition-colors max-sm:flex-1 sm:px-2.5 ${cfg.label === activeRange.label ? "bg-surface-active" : "text-text-secondary hover:text-white"}`}
                                        aria-label={cfg.label}
                                    >
                                        {cfg.label}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowExportModal(true)}
                                className="secondary-action max-sm:hidden flex items-center ml-auto gap-1.5 px-3 py-1.5 text-xs"
                                aria-label="导出数据"
                            >
                                <Download size={14} />
                                <span>导出数据</span>
                            </button>
                        </div>

                        {/* 图表区 */}
                        <div className="relative py-4" style={{ height: 170 }}>
                            {rawData && rawData.length > 0 ? (
                                <Line data={chartData!} options={TREND_CHART_OPTIONS} />
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-text-secondary">
                                    暂无数据，明天再查看
                                </div>
                            )}
                        </div>

                        {/* 手机版导出按钮 — 图表下方 */}
                        <button
                            type="button"
                            onClick={() => setShowExportModal(true)}
                            className="secondary-action sm:hidden flex w-full items-center justify-center mb-4 gap-1.5 px-5 py-2.5 text-xs"
                            aria-label="导出数据"
                        >
                            <Download size={14} />
                            <span>导出数据</span>
                        </button>
                    </div>
                </AsyncBoundary>
            </GlowCard>

            <ExportDialog
                open={showExportModal}
                selectedMetrics={selectedMetrics}
                range={exportRange}
                format={exportFormat}
                exporting={exporting}
                onClose={() => setShowExportModal(false)}
                onToggleMetric={toggleMetric}
                onToggleAll={toggleAll}
                onRangeChange={setExportRange}
                onFormatChange={setExportFormat}
                onExport={handleExport}
            />
        </section>
    );
}
