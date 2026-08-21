import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

// 服务器无该站点记录时的错误特征串（message 以它结尾即视为无记录）
const NO_RECORD_MARKER = "HTTP 403";

export function AsyncBoundary<T>(props: {
    api: {
        data: T | null;
        loading: boolean;
        error: Error | null;
    };
    children: ReactNode | ((data: T) => ReactNode);
    className?: string;
}) {
    const { api, children, className = "" } = props;
    const { data, loading, error } = api;
    const message = error?.message ?? "";
    const isNoRecord = error != null && message.endsWith(NO_RECORD_MARKER);

    return (
        <div className={`${error ? "relative" : ""} ${className}`}>
            {/* 始终渲染 children（函数式 children 只在有数据时调用） */}
            {typeof children === "function"
                ? data
                    ? (children as (data: T) => ReactNode)(data)
                    : null
                : children}

            {/* 遮罩层 — AnimatePresence 驱动 fade 进出动画 */}
            <AnimatePresence>
                {(error || loading) && (
                    <motion.div
                        key="async-mask"
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 z-10 flex items-center justify-center bg-[#03101C]/60"
                    >
                        {loading && (
                            <div className="flex flex-col items-center gap-2 text-text-secondary">
                                <LoaderCircle
                                    size={28}
                                    className="animate-spin text-[#65dfe9]"
                                />
                                <span className="text-xs">加载中…</span>
                            </div>
                        )}
                        {error && (
                            <div className="flex flex-col items-center gap-1 text-xs text-red-400">
                                <span>{isNoRecord ? "该网站无记录，请稍后重试" : "数据加载失败"}</span>
                                <span className="opacity-60">{message}</span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
