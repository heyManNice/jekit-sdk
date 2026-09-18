import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { metricOption } from "jekit-core";

import { METRICS, RANGE_CONFIG } from "../model/trend-config";

export type ExportFormat = "json" | "csv" | "excel";
export type ExportRange = (typeof RANGE_CONFIG)[number];

interface ExportDialogProps {
    open: boolean;
    selectedMetrics: ReadonlySet<metricOption>;
    range: ExportRange;
    format: ExportFormat;
    exporting: boolean;
    onClose: () => void;
    onToggleMetric: (value: metricOption) => void;
    onToggleAll: () => void;
    onRangeChange: (range: ExportRange) => void;
    onFormatChange: (format: ExportFormat) => void;
    onExport: () => void;
}

export function ExportDialog({
    open,
    selectedMetrics,
    range,
    format,
    exporting,
    onClose,
    onToggleMetric,
    onToggleAll,
    onRangeChange,
    onFormatChange,
    onExport,
}: ExportDialogProps) {
    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        key="export-mask"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        key="export-dialog"
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="export-dialog-title"
                            className="relative w-full max-w-lg rounded border border-[#102336] bg-[#03101C] shadow-2xl"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="flex items-center justify-between border-b border-[#102336] px-5 py-3">
                                <h2 id="export-dialog-title" className="text-sm font-medium text-white">导出数据</h2>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded p-1 text-text-secondary transition-colors hover:text-white"
                                    aria-label="关闭"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="px-5 py-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="text-xs text-text-secondary">选择要导出的指标</span>
                                    <button type="button" onClick={onToggleAll} className="text-xs text-primary transition-colors hover:text-white">
                                        {selectedMetrics.size === METRICS.length ? "取消全选" : "全选"}
                                    </button>
                                </div>
                                <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                                    {METRICS.map((metric) => (
                                        <label key={metric.value} className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 text-xs text-text-secondary transition-colors hover:bg-[#081A2B] hover:text-white">
                                            <input
                                                type="checkbox"
                                                checked={selectedMetrics.has(metric.value)}
                                                onChange={() => onToggleMetric(metric.value)}
                                                className="h-3.5 w-3.5 accent-[#11ebe9]"
                                            />
                                            <span>{metric.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="border-[#102336] px-5 py-3">
                                <span className="text-xs text-text-secondary">时间范围</span>
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {RANGE_CONFIG.map((item) => (
                                        <button
                                            key={item.label}
                                            type="button"
                                            onClick={() => onRangeChange(item)}
                                            className={`rounded border px-3 py-1.5 text-xs transition-colors ${item.label === range.label
                                                ? "border-primary bg-[#013F4C] text-primary"
                                                : "border-[#1e4058] text-text-secondary hover:border-primary hover:text-primary"
                                                }`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="border-[#102336] px-5 py-3">
                                <span className="text-xs text-text-secondary">导出格式</span>
                                <div className="mt-2 flex gap-2">
                                    {(["json", "csv", "excel"] as const).map((item) => (
                                        <button
                                            key={item}
                                            type="button"
                                            onClick={() => onFormatChange(item)}
                                            className={`rounded border px-3 py-1.5 text-xs transition-colors ${format === item
                                                ? "border-primary bg-[#013F4C] text-primary"
                                                : "border-[#1e4058] text-text-secondary hover:border-primary hover:text-primary"
                                                }`}
                                        >
                                            {item === "json" ? "JSON" : item === "csv" ? "CSV" : "Excel"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 border-t border-[#102336] px-5 py-3">
                                <button type="button" onClick={onClose} className="rounded border border-[#1e4058] px-4 py-1.5 text-xs text-text-secondary transition-colors hover:border-primary hover:text-primary">
                                    取消
                                </button>
                                <button
                                    type="button"
                                    onClick={onExport}
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
    );
}
