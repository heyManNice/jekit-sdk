import { animate } from "framer-motion";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";


// ==================== 类型定义 ====================

// 解析后的片段：纯文本 或 数字段
type Segment =
    | { type: "text"; value: string }
    | { type: "number"; value: number; decimals: number };


// ==================== 工具函数 ====================

// 将 "12 / 34.5 MB" 解析为 [文本, 数字, 文本, 数字, 文本]
function parse(raw: string): Segment[] {
    const regex = /-?\d+(?:\.\d+)?/g;
    const result: Segment[] = [];
    let cursor = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(raw)) !== null) {
        const full = match[0];
        const start = match.index;

        // 数字前面的纯文本
        if (start > cursor) {
            result.push({ type: "text", value: raw.slice(cursor, start) });
        }

        // 数字段
        result.push({
            type: "number",
            value: Number(full),
            decimals: full.includes(".") ? full.length - full.indexOf(".") - 1 : 0,
        });

        cursor = start + full.length;
    }

    // 尾部剩余纯文本
    if (cursor < raw.length) {
        result.push({ type: "text", value: raw.slice(cursor) });
    }

    return result;
}

// 将动画中的浮点数格式化为指定位数的字符串
function formatNum(value: number, decimals: number): string {
    return decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
}


// ==================== 组件 ====================

export function AnimatedMetricValue({
    value,
    shouldAnimate,
}: {
    value: string;
    shouldAnimate: boolean;
}) {
    // 1. 解析字符串为段序列
    const segments = useMemo(() => parse(value), [value]);

    // 2. 提取所有数字的目标值
    const targets = useMemo(
        () =>
            segments
                .filter((s): s is Segment & { type: "number" } => s.type === "number")
                .map((s) => s.value),
        [segments],
    );

    // 3. 用 ref 持有动画中的数值（避免闭包陷阱），用 tick 触发渲染
    const animRef = useRef<number[]>([]);
    const [, setTick] = useState(0);

    // 当 targets 变化时重置动画缓冲区
    if (animRef.current.length !== targets.length) {
        animRef.current = targets.map(() => 0);
    }

    useEffect(() => {
        if (!shouldAnimate || targets.length === 0) return;

        const startValues = [...animRef.current];

        const controls = targets.map((target, index) =>
            animate(startValues[index] ?? 0, target, {
                duration: 3,
                ease: "easeOut",
                onUpdate: (latest) => {
                    animRef.current[index] = latest;
                    setTick((t) => t + 1);
                },
            }),
        );

        return () => controls.forEach((c) => c.stop());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shouldAnimate, targets]);

    // 4. 无动画模式 —— 用 dangerouslySetInnerHTML 支持 <br/> 等内联 HTML
    if (!shouldAnimate) {
        return <div dangerouslySetInnerHTML={{ __html: value }} />;
    }

    // 5. 有动画 —— 逐段渲染
    let numIdx = 0;

    return segments.map((segment, i) =>
        segment.type === "text"
            ? <span key={`t-${i}`}>{segment.value}</span>
            : <span key={`n-${i}`}>{formatNum(animRef.current[numIdx++] ?? 0, segment.decimals)}</span>,
    );
}
