import { CircleHelp } from "lucide-react";

import { Line } from "react-chartjs-2";

import type { ChartData, ChartOptions } from "chart.js";

import { GlowCard } from "@/components/glow-card";
import { getBrandIconSrc } from "./brand-icons";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useApi } from "@/utils/api";
import {
    performance,
    source,
    scopeOption,
    dimensionOption,
    whichBrowserOption,
    whichOsOption,
} from "jekit-core";
import { AsyncBoundary } from "@/components/async-boundary";
import { useQueryStore } from "@/stores/query";
import { useRefetchOnChange } from "@/hooks/use-refetch-on-change";
import { gradientFill } from "@/utils/chart";

// 维度枚举 → 显示名称映射（与 getBrandIconSrc key 一致）

interface SourceRow {
    name: string;
    totalVisits: string;
    todayVisits: string;
    ratio: string;
}

// 从 source API 响应构建 SourceTable 行数据（缺失的维度显示为 0，按总访问量降序）
function buildRows(
    data: readonly {
        dimensionIndex: number;
        totalRequest: bigint;
        todayRequest: number;
    }[] | null,
    enumObj: Record<string, string | number>,
    nameFix: Record<string, string> = {},
): SourceRow[] {
    if (!data) return [];
    const dataMap = new Map(data.map((d) => [d.dimensionIndex, d]));
    const grandTotal = data.reduce((s, d) => s + Number(d.totalRequest), 0);

    return (
        Object.values(enumObj)
            .filter((v): v is number => typeof v === "number")
            .map((index) => {
                const entry = dataMap.get(index);
                const total = entry ? Number(entry.totalRequest) : 0;
                const today = entry ? entry.todayRequest : 0;
                const rawName = enumObj[index] as string;
                return {
                    name: nameFix[rawName] ?? rawName,
                    totalVisits: total.toLocaleString(),
                    todayVisits: today.toLocaleString(),
                    ratio:
                        grandTotal > 0
                            ? ((total / grandTotal) * 100).toFixed(1) + "%"
                            : "0%",
                    sortKey: total,
                };
            })
            .sort((a, b) => {
                // Other 始终在底部
                if (a.name === "Other") return 1;
                if (b.name === "Other") return -1;
                return b.sortKey - a.sortKey;
            })
            .map(({ sortKey: _, ...row }) => row)
    );
}

// 图例小色块
function ChartLegendDot({ className }: { className: string }) {
    return <span className={`inline-block h-2 w-4 bg-linear-to-r ${className}`} />;
}

// 性能数据点（TTFB / PLT 占比 + 原始计数）
interface PerfDataPoint {
    label: string;
    ttfb: number;
    plt: number;
    ttfbRaw: number;
    pltRaw: number;
}

interface TrafficChartProps {
    rawData: PerfDataPoint[];
    chartData: ChartData<"line">;
    chartOptions: ChartOptions<"line">;
}

// 性能指标折线图（含桌面 tooltip 与手机弹窗说明）
function TrafficChart({ rawData, chartData, chartOptions }: TrafficChartProps) {
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const [isMobile, setIsMobile] = useState(false);
    const [showMobileModal, setShowMobileModal] = useState(false);
    const iconRef = useRef<HTMLSpanElement>(null);

    // 检测是否为触屏设备
    useEffect(() => {
        setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    }, []);

    const showTooltip = () => {
        if (iconRef.current) {
            const rect = iconRef.current.getBoundingClientRect();
            setTooltipPos({
                top: rect.bottom + 8,
                left: rect.left + rect.width / 2,
            });
            setTooltipVisible(true);
        }
    };
    const hideTooltip = () => setTooltipVisible(false);

    const handleClick = () => {
        if (isMobile) {
            setShowMobileModal(true);
        }
    };

    // 性能说明内容（桌面 tooltip 和手机弹窗共用）
    const tooltipContent = (
        <div className="space-y-1.5">
            <p><span className="text-[#22dfe5]">TTFB</span>：首字节时间，从请求发出到收到服务器响应第一个字节的耗时。</p>
            <p><span className="text-[#c68dff]">PLT</span>：页面加载时间，页面完全加载渲染完成的总耗时。</p>
            <p><span className="text-[#5ce5de]">数据范围</span>：为了减少服务器储存压力。性能指标只储存当天数据。</p>
        </div>
    );

    return (
        <div className="flex h-55 flex-col">
            <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-sm text-white">
                    <span>性能指标</span>
                    <span
                        ref={iconRef}
                        onMouseEnter={showTooltip}
                        onMouseLeave={hideTooltip}
                        onClick={handleClick}
                        className="inline-flex"
                    >
                        <CircleHelp size={13} className="text-[#65dfe9] cursor-help" />
                    </span>

                    {/* 桌面版 — Portal tooltip → body */}
                    {!isMobile && createPortal(
                        <AnimatePresence>
                            {tooltipVisible && (
                                <motion.div
                                    key="perf-tooltip"
                                    className="fixed z-9999"
                                    style={{ top: tooltipPos.top, left: tooltipPos.left }}
                                    onMouseEnter={showTooltip}
                                    onMouseLeave={hideTooltip}
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.15, ease: "easeOut" }}
                                >
                                    <div className="-translate-x-1/2 w-56 rounded border border-[#102336] bg-[#03101C] px-3 py-2 text-xs text-text-secondary shadow-lg">
                                        {tooltipContent}
                                        {/* 小三角 */}
                                        <span className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#102336]" />
                                        <span className="absolute -top-0.75 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#03101C]" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>,
                        document.body,
                    )}

                    {/* 手机版 — 点击弹窗 */}
                    {isMobile && createPortal(
                        <AnimatePresence>
                            {showMobileModal && (
                                <motion.div
                                    key="perf-mobile-modal"
                                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={() => setShowMobileModal(false)}
                                >
                                    <motion.div
                                        key="perf-mobile-dialog"
                                        className="w-full max-w-sm rounded border border-[#102336] bg-[#03101C] p-5 shadow-2xl"
                                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="mb-4 text-xs text-text-secondary leading-relaxed">
                                            {tooltipContent}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowMobileModal(false)}
                                            className="w-full rounded border border-primary bg-[#013F4C] py-2 text-xs text-primary transition-colors hover:bg-[#01505E]"
                                        >
                                            确定
                                        </button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>,
                        document.body,
                    )}
                </div>
                <div className="flex items-center gap-4 text-xs text-text-secondary">
                    <span className="flex items-center gap-2"><ChartLegendDot className="from-[#21dbe6] to-[#27a1ff]" />TTFB</span>
                    <span className="flex items-center gap-2"><ChartLegendDot className="from-[#b46cff] to-[#7e65ff]" />PLT</span>
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
    api: { data: SourceRow[] | null; loading: boolean; error: Error | null };
}

// 来源表格（浏览器 / 操作系统）
function SourceTable({ title, api }: SourceTableProps) {
    return (
        <GlowCard className="rounded border overflow-hidden border-[#081A2B] bg-[#03101C]/90 px-4 py-4 backdrop-blur-sm">
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
                                    <div className="flex min-w-0 items-center gap-2 text-[#eaf4ff]">
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
export default function PerfEnvSection() {

    const { domain, path, version } = useQueryStore();

    // source API（浏览器 / 操作系统）
    const browserApi = useApi(() =>
        source({ domain, path, scope: scopeOption.Site, dimension: dimensionOption.Browser }),
    );

    const osApi = useApi(() =>
        source({ domain, path, scope: scopeOption.Site, dimension: dimensionOption.OS }),
    );

    // 切换查询（version 变化）时重新请求
    const api = useApi(() => performance({ domain }));
    useRefetchOnChange(() => {
        browserApi.update();
        osApi.update();
        api.update();
    }, [version]);

    const browserRows = useMemo(
        () => (browserApi.data ? buildRows(browserApi.data, whichBrowserOption) : null),
        [browserApi.data],
    );

    const osRows = useMemo(
        () => (osApi.data ? buildRows(osApi.data, whichOsOption, { iOS: "IOS", HarmonyOS: "HMOS" }) : null),
        [osApi.data],
    );

    // 性能数据：去除两端的 0，只保留有数据的范围，并计算占比
    const perfRawData: PerfDataPoint[] = useMemo(() => {
        if (!api.data) return [];

        const { ttfbHist, pltHist } = api.data;

        // 自动去除两端的 0，只保留有数据的范围
        let start = 0;
        let end = ttfbHist.length - 2; // 254代表虚拟路由无性能采集，255代表采集失败
        while (start < end && ttfbHist[start] === 0 && pltHist[start] === 0) start++;
        while (end > start && ttfbHist[end - 1] === 0 && pltHist[end - 1] === 0) end--;

        const sliceLen = end - start;
        const sumTtfb = ttfbHist.slice(start, end).reduce((a, b) => a + b, 0);
        const sumPlt = pltHist.slice(start, end).reduce((a, b) => a + b, 0);

        return Array.from({ length: sliceLen }, (_, i) => {
            const idx = start + i;
            return {
                label: (() => {
                    if (idx < 100) return `${idx * 10}ms`;
                    if (idx < 253) return `${idx / 100}s`;
                    return "≥2.53s";
                })(),
                ttfb: Math.round((ttfbHist[idx] / sumTtfb) * 100),
                plt: Math.round((pltHist[idx] / sumPlt) * 100),
                ttfbRaw: ttfbHist[idx],
                pltRaw: pltHist[idx],
            };
        });
    }, [api.data]);

    const perfChartData: ChartData<"line"> = useMemo(
        () => ({
            labels: perfRawData.map((d) => d.label),
            datasets: [
                {
                    label: "TTFB",
                    data: perfRawData.map((d) => d.ttfb),
                    borderColor: "#22dfe5",
                    backgroundColor: gradientFill("#22dfe5", 0.2),
                    fill: true,
                    tension: 0.3,
                    borderWidth: 1,
                    pointBackgroundColor: "#22dfe5",
                    pointRadius: 0,
                    pointHoverRadius: 2,
                },
                {
                    label: "PLT",
                    data: perfRawData.map((d) => d.plt),
                    borderColor: "#ba74ff",
                    backgroundColor: gradientFill("#ba74ff", 0.2),
                    fill: true,
                    tension: 0.3,
                    borderWidth: 1,
                    pointBackgroundColor: "#ba74ff",
                    pointRadius: 0,
                    pointHoverRadius: 2,
                },
            ],
        }),
        [perfRawData],
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
                    backgroundColor: "#03101C",
                    titleColor: "#9eb0c0",
                    bodyColor: "#e7f8fb",
                    borderColor: "#102336",
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
                        color: "#9eb0c0",
                        font: { size: 11 },
                        maxTicksLimit: 8,
                    },
                },
                y: {
                    grid: { color: "rgba(27, 50, 66, 0.5)" },
                    ticks: {
                        color: "#9eb0c0",
                        font: { size: 11 },
                        maxTicksLimit: 5,
                        callback: (value) => `${value}%`,
                    },
                    min: 0,
                },
            },
        }),
        [perfRawData],
    );

    return (
        <section className="px-3 pt-6 max-sm:px-5">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.25fr_1fr_1fr]">
                <GlowCard className="min-w-0 rounded border overflow-hidden border-[#081A2B] bg-[#03101C]/90 px-4 py-4 backdrop-blur-sm">
                    <AsyncBoundary api={api} className="h-full">
                        <TrafficChart
                            rawData={perfRawData}
                            chartData={perfChartData}
                            chartOptions={perfChartOptions}
                        />
                    </AsyncBoundary>
                </GlowCard>
                <div className="min-w-0">
                    <SourceTable title="浏览器来源" api={{ data: browserRows, loading: browserApi.loading, error: browserApi.error }} />
                </div>
                <div className="min-w-0">
                    <SourceTable title="操作系统来源" api={{ data: osRows, loading: osApi.loading, error: osApi.error }} />
                </div>
            </div>
        </section>
    );
}
