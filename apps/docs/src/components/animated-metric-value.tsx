import { animate } from "framer-motion";

import {
    Fragment,
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

// 文本段里的换行符渲染成 <br/>（多行指标在内部用 \n 连接成一段）
function renderText(text: string, keyPrefix: string) {
    return text.split("\n").map((part, index) => (
        <Fragment key={`${keyPrefix}-${index}`}>
            {index > 0 && <br />}
            {part}
        </Fragment>
    ));
}


// ==================== 组件 ====================

export function AnimatedMetricValue({
    lines,
    shouldAnimate,
}: {
    lines: string[];
    shouldAnimate: boolean;
}) {
    // 1. 解析文本为段序列（多行用 \n 连接；带动画的指标都是单行）
    const segments = useMemo(() => parse(lines.join("\n")), [lines]);

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
    }, [shouldAnimate, targets]);

    // 4. 无动画模式 —— 逐行渲染，行间插入 <br/>
    if (!shouldAnimate) {
        return lines.map((line, index) => (
            <Fragment key={index}>
                {index > 0 && <br />}
                {line}
            </Fragment>
        ));
    }

    // 5. 有动画 —— 逐段渲染
    let numIdx = 0;

    return segments.map((segment, i) =>
        segment.type === "text"
            ? renderText(segment.value, `t-${i}`)
            : <span key={`n-${i}`}>{formatNum(animRef.current[numIdx++] ?? 0, segment.decimals)}</span>,
    );
}
