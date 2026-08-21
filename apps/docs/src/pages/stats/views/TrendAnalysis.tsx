import {
    Download,
    X,
} from "lucide-react";

import { Line } from "react-chartjs-2";

import type { ChartData, ChartOptions } from "chart.js";

import { GlowCard } from "@/components/glow-card";

import {
    useCallback,
    useMemo,
    useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApi } from "@/utils/api";
import {
    history,
    rangeOption,
    metricOption,
    whereWasIFromOption,
    whichBrowserOption,
    whichOsOption,
} from "jekit-core";
import { AsyncBoundary } from "@/components/async-boundary";
import { Dropdown } from "@/components/dropdown";
import { useQueryStore } from "@/stores/query";
import { useRefetchOnChange } from "@/hooks/use-refetch-on-change";
import { gradientFill } from "@/utils/chart";
import { fmtMonthDay } from "@/utils/format";
import {
    buildCsv,
    buildXlsHtml,
    downloadBlob,
} from "@/utils/export";

// history 接口的维度值类型（来源 / 浏览器 / 操作系统枚举的并集）
type DimensionValue = whereWasIFromOption | whichBrowserOption | whichOsOption;


// 时间范围配置：API range + 客户端截取条数
const RANGE_CONFIG = [
    { label: "7 天", apiRange: rangeOption.Daily, slice: 7 },
    { label: "30 天", apiRange: rangeOption.Daily, slice: 30 },
    { label: "90 天", apiRange: rangeOption.Monthly, slice: 3 },
    { label: "1 年", apiRange: rangeOption.Monthly, slice: 12 },
    { label: "全部", apiRange: rangeOption.Yearly, slice: Infinity },
] as const;

interface MetricDef {
    label: string;
    value: number;
    // 需要选择维度值时，标记维度类型
    dimensionType?: "source" | "browser" | "os";
}

const METRICS: MetricDef[] = [
    { label: "站点用户总数", value: metricOption.totalUserForSite },
    { label: "站点总浏览量", value: metricOption.totalRequestForSite },
    { label: "页面总浏览量", value: metricOption.totalRequestForPage },
    { label: "站点总访客量", value: metricOption.totalVisitorForSite },
    { label: "页面总访客量", value: metricOption.totalVisitorForPage },
    { label: "站点每日浏览量", value: metricOption.todayRequestForSite },
    { label: "页面每日浏览量", value: metricOption.todayRequestForPage },
    { label: "站点每日访客量", value: metricOption.todayVisitorForSite },
    { label: "页面每日访客量", value: metricOption.todayVisitorForPage },
    { label: "搜索引擎-站点总浏览量", value: metricOption.totalRequestFromForSite, dimensionType: "source" },
    { label: "搜索引擎-页面总浏览量", value: metricOption.totalRequestFromForPage, dimensionType: "source" },
    { label: "搜索引擎-站点每日浏览量", value: metricOption.todayRequestFromForSite, dimensionType: "source" },
    { label: "搜索引擎-页面每日浏览量", value: metricOption.todayRequestFromForPage, dimensionType: "source" },
    { label: "浏览器-站点总浏览量", value: metricOption.totalRequestFromBrowserForSite, dimensionType: "browser" },
    { label: "浏览器-页面总浏览量", value: metricOption.totalRequestFromBrowserForPage, dimensionType: "browser" },
    { label: "浏览器-站点每日浏览量", value: metricOption.todayRequestFromBrowserForSite, dimensionType: "browser" },
    { label: "浏览器-页面每日浏览量", value: metricOption.todayRequestFromBrowserForPage, dimensionType: "browser" },
    { label: "操作系统-站点总浏览量", value: metricOption.totalRequestFromOSForSite, dimensionType: "os" },
    { label: "操作系统-页面总浏览量", value: metricOption.totalRequestFromOSForPage, dimensionType: "os" },
    { label: "操作系统-站点每日浏览量", value: metricOption.todayRequestFromOSForSite, dimensionType: "os" },
    { label: "操作系统-页面每日浏览量", value: metricOption.todayRequestFromOSForPage, dimensionType: "os" },
];

// 从枚举提取选项
function enumToOptions(
    enumObj: Record<string, string | number>,
): { label: string; value: number }[] {
    return (Object.values(enumObj) as (string | number)[])
        .filter((v): v is number => typeof v === "number")
        .map((v) => ({ label: enumObj[v] as string, value: v }))
        .sort((a, b) => a.value - b.value);
}

const DIMENSION_OPTIONS: Record<string, { label: string; value: number }[]> = {
    source: enumToOptions(whereWasIFromOption),
    browser: enumToOptions(whichBrowserOption),
    os: enumToOptions(whichOsOption),
};

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
            backgroundColor: "#03101C",
            titleColor: "#9eb0c0",
            bodyColor: "#e7f8fb",
            borderColor: "#102336",
            borderWidth: 1,
            padding: 10,
        },
    },
    scales: {
        x: {
            grid: { display: false },
            ticks: { color: "#9eb0c0", font: { size: 10 } },
        },
        y: {
            grid: { color: "rgba(27, 50, 66, 0.5)" },
            ticks: {
                color: "#9eb0c0",
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
export default function TrendAnalysis() {
    const [activeRange, setActiveRange] = useState<(typeof RANGE_CONFIG)[number]>(RANGE_CONFIG[0]);
    const [activeMetric, setActiveMetric] = useState<MetricDef>(METRICS[0]);
    const [dimensionValue, setDimensionValue] = useState(0);

    // 导出弹窗状态
    const [showExportModal, setShowExportModal] = useState(false);
    const [selectedMetrics, setSelectedMetrics] = useState<Set<number>>(
        () => new Set(METRICS.map((m) => m.value)),
    );
    const [exportFormat, setExportFormat] = useState<"json" | "csv" | "excel">("json");
    const [exporting, setExporting] = useState(false);
    const [exportRange, setExportRange] = useState<(typeof RANGE_CONFIG)[number]>(RANGE_CONFIG[0]);

    const { domain, path, version } = useQueryStore();

    // 切换指标勾选
    const toggleMetric = useCallback((value: number) => {
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
                ? new Set<number>()
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
                    const data = await history({
                        domain,
                        path,
                        range: exportRange.apiRange,
                        metric: metric.value,
                        dimensionValue: dimensionValue as DimensionValue,
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

    const api = useApi(() =>
        history({ domain, path, range: activeRange.apiRange, metric: activeMetric.value, dimensionValue: dimensionValue as DimensionValue }),
    );

    // 切换查询（version 变化）时重新请求
    useRefetchOnChange(api.update, [version]);

    // 切换指标 / 时间范围 / 维度值时重新请求
    useRefetchOnChange(api.update, [activeMetric, activeRange, dimensionValue]);

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
                        borderColor: "#11ebe9",
                        borderWidth: 1.5,
                        backgroundColor: gradientFill("#11ebe9", 0.5),
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: "#11ebe9",
                        pointRadius: 2,
                        pointHoverRadius: 4,
                    },
                ],
            }
            : null,
        [rawData],
    );

    return (
        <section className="px-3 pt-6 max-sm:px-5">
            <GlowCard className="rounded border overflow-hidden border-[#081A2B] bg-[#02111d]/70 backdrop-blur-sm">
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
                                            const dims = DIMENSION_OPTIONS[m.dimensionType ?? ""];
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
                            <div className="flex flex-wrap items-center gap-1 rounded border border-[#102336] bg-[#03101C]/90 p-1 sm:flex-nowrap max-sm:w-full">
                                {RANGE_CONFIG.map((cfg) => (
                                    <button
                                        key={cfg.label}
                                        type="button"
                                        onClick={() => setActiveRange(cfg)}
                                        className={`rounded cursor-pointer px-2 py-1 text-xs transition-colors max-sm:flex-1 sm:px-2.5 ${cfg.label === activeRange.label ? "bg-[#013F4C]" : "text-text-secondary hover:text-white"}`}
                                        aria-label={cfg.label}
                                    >
                                        {cfg.label}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowExportModal(true)}
                                className="max-sm:hidden flex items-center ml-auto gap-1.5 rounded border border-[#1e4058] px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-primary hover:text-primary"
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
                            className="sm:hidden flex w-full items-center justify-center mb-4 gap-1.5 rounded border border-[#1e4058] px-5 py-2.5 text-xs text-text-secondary transition-colors hover:border-primary hover:text-primary"
                            aria-label="导出数据"
                        >
                            <Download size={14} />
                            <span>导出数据</span>
                        </button>
                    </div>
                </AsyncBoundary>
            </GlowCard>

            {/* 导出弹窗 */}
            <AnimatePresence>
                {showExportModal && (
                    <>
                        {/* 遮罩 */}
                        <motion.div
                            key="export-mask"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowExportModal(false)}
                        />

                        {/* 弹窗 */}
                        <motion.div
                            key="export-dialog"
                            initial={{ opacity: 0, scale: 0.92, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 20 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div
                                className="relative w-full max-w-lg rounded border border-[#102336] bg-[#03101C] shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* 弹窗标题栏 */}
                                <div className="flex items-center justify-between border-b border-[#102336] px-5 py-3">
                                    <h3 className="text-sm font-medium text-white">导出数据</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowExportModal(false)}
                                        className="rounded p-1 text-text-secondary transition-colors hover:text-white"
                                        aria-label="关闭"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* 指标选择 */}
                                <div className="px-5 py-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <span className="text-xs text-text-secondary">选择要导出的指标</span>
                                        <button
                                            type="button"
                                            onClick={toggleAll}
                                            className="text-xs text-primary transition-colors hover:text-white"
                                        >
                                            {selectedMetrics.size === METRICS.length ? "取消全选" : "全选"}
                                        </button>
                                    </div>

                                    {/* 指标列表 */}
                                    <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                                        {METRICS.map((metric) => (
                                            <label
                                                key={metric.value}
                                                className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 text-xs text-text-secondary transition-colors hover:bg-[#081A2B] hover:text-white"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMetrics.has(metric.value)}
                                                    onChange={() => toggleMetric(metric.value)}
                                                    className="h-3.5 w-3.5 accent-[#11ebe9]"
                                                />
                                                <span>{metric.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* 时间范围选择 */}
                                <div className="border-[#102336] px-5 py-3">
                                    <span className="text-xs text-text-secondary">时间范围</span>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {RANGE_CONFIG.map((cfg) => (
                                            <button
                                                key={cfg.label}
                                                type="button"
                                                onClick={() => setExportRange(cfg)}
                                                className={`rounded border px-3 py-1.5 text-xs transition-colors ${cfg.label === exportRange.label
                                                    ? "border-primary bg-[#013F4C] text-primary"
                                                    : "border-[#1e4058] text-text-secondary hover:border-primary hover:text-primary"
                                                    }`}
                                            >
                                                {cfg.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 导出格式选择 */}
                                <div className=" border-[#102336] px-5 py-3">
                                    <span className="text-xs text-text-secondary">导出格式</span>
                                    <div className="mt-2 flex gap-2">
                                        {(["json", "csv", "excel"] as const).map((fmt) => (
                                            <button
                                                key={fmt}
                                                type="button"
                                                onClick={() => setExportFormat(fmt)}
                                                className={`rounded border px-3 py-1.5 text-xs transition-colors ${exportFormat === fmt
                                                    ? "border-primary bg-[#013F4C] text-primary"
                                                    : "border-[#1e4058] text-text-secondary hover:border-primary hover:text-primary"
                                                    }`}
                                            >
                                                {fmt === "json"
                                                    ? "JSON"
                                                    : fmt === "csv"
                                                        ? "CSV"
                                                        : "Excel"}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 操作按钮 */}
                                <div className="flex justify-end gap-2 border-t border-[#102336] px-5 py-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowExportModal(false)}
                                        className="rounded border border-[#1e4058] px-4 py-1.5 text-xs text-text-secondary transition-colors hover:border-primary hover:text-primary"
                                    >
                                        取消
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleExport}
                                        disabled={selectedMetrics.size === 0 || exporting}
                                        className="rounded border border-[#1e4058] px-4 py-1.5 text-xs text-text-secondary transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {exporting ? "导出中…" : `导出 ${selectedMetrics.size} 项`}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </section>
    );
}
