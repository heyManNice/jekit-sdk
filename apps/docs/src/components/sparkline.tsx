import { memo, useId, useMemo } from "react";

interface SparklineProps {
    data: readonly number[];
    color?: string;
    heightClass?: string;
    fill?: "gradient" | string | false;
    yMin?: number;
}

interface Point {
    x: number;
    y: number;
}

function makePoints(data: readonly number[], yMin?: number): Point[] {
    if (data.length === 0) return [];

    const min = yMin ?? Math.min(...data);
    const max = Math.max(...data, min);
    const range = max - min;

    return data.map((value, index) => ({
        x: data.length === 1 ? 50 : (index / (data.length - 1)) * 100,
        y: range === 0 ? 16 : 30 - ((value - min) / range) * 28,
    }));
}

function makeSmoothPath(points: readonly Point[]): string {
    if (points.length === 0) return "";
    if (points.length === 1) {
        return `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    }

    const segments = points.slice(0, -1).map((point, index) => {
        const previous = points[index - 1] ?? point;
        const next = points[index + 1];
        const following = points[index + 2] ?? next;
        const minY = Math.min(point.y, next.y);
        const maxY = Math.max(point.y, next.y);
        const control1X = point.x + (next.x - previous.x) / 6;
        const control1Y = Math.min(maxY, Math.max(minY, point.y + (next.y - previous.y) / 6));
        const control2X = next.x - (following.x - point.x) / 6;
        const control2Y = Math.min(maxY, Math.max(minY, next.y - (following.y - point.y) / 6));

        return `C${control1X.toFixed(2)} ${control1Y.toFixed(2)} ${control2X.toFixed(2)} ${control2Y.toFixed(2)} ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
    });

    return `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} ${segments.join(" ")}`;
}

// 7 个点的迷你趋势图使用 SVG，避免为每一行创建完整 Chart.js 实例。
export const Sparkline = memo(function Sparkline({
    data,
    color = "var(--color-chart-primary)",
    heightClass = "h-4 w-16",
    fill = "gradient",
    yMin,
}: SparklineProps) {
    const gradientId = useId();
    const points = useMemo(() => makePoints(data, yMin), [data, yMin]);
    const linePath = makeSmoothPath(points);
    const areaPath = linePath
        ? `${linePath} L100 32 L0 32 Z`
        : "";
    const fillColor = fill === "gradient"
        ? `url(#${gradientId})`
        : fill === false
            ? "none"
            : fill;

    return (
        <div className={heightClass} aria-hidden="true">
            <svg
                viewBox="0 0 100 32"
                preserveAspectRatio="none"
                className="block h-full w-full overflow-visible"
            >
                {fill === "gradient" && (
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
                        </linearGradient>
                    </defs>
                )}
                {areaPath && fillColor !== "none" && <path d={areaPath} fill={fillColor} />}
                {linePath && (
                    <path
                        d={linePath}
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                    />
                )}
            </svg>
        </div>
    );
});
