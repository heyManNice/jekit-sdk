import {
    Chart,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
} from "chart.js";
import type { ScriptableContext } from "chart.js";

// Chart.js 全局注册（只需在模块加载时执行一次）。
// 所有用到图表的文件都应 import 本模块，避免各自重复 / 遗漏注册。
Chart.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
);

// hex (#rrggbb) → rgba()，alpha ∈ [0,1]
function withAlpha(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 折线图从顶到底的渐变填充（chart.js backgroundColor 回调）。
// topAlpha 控制渐变顶部的不透明度，底部统一收敛到 0.01。
export function gradientFill(hex: string, topAlpha = 0.25) {
    return (ctx: ScriptableContext<"line">): string | CanvasGradient => {
        // 图表尚未完成布局时返回纯色兜底
        if (!ctx.chart.chartArea) return withAlpha(hex, topAlpha);
        const {
            ctx: c,
            chartArea: { top, bottom },
        } = ctx.chart;
        const g = c.createLinearGradient(0, top, 0, bottom);
        g.addColorStop(0, withAlpha(hex, topAlpha));
        g.addColorStop(1, withAlpha(hex, 0.01));
        return g;
    };
}
