import { memo } from "react";
import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";

import { gradientFill } from "@/utils/chart";

interface SparklineProps {
    // 趋势数据
    data: readonly number[];
    // 线条颜色，默认青色
    color?: string;
    // 容器尺寸类
    heightClass?: string;
    // 曲线平滑度
    tension?: number;
    // 填充方式："gradient" 渐变 / 具体颜色字符串 / false 不填充
    fill?: "gradient" | string | false;
    // y 轴最小值（不传则交给 chart.js 自动）
    yMin?: number;
}

// 微型趋势折线图（不含坐标轴 / 图例 / 提示框）
export const Sparkline = memo(function Sparkline({
    data,
    color = "#11ebe9",
    heightClass = "h-4 w-16",
    tension = 0.3,
    fill = "gradient",
    yMin,
}: SparklineProps) {
    const chartData: ChartData<"line"> = {
        labels: ["", "", "", "", "", "", ""],
        datasets: [
            {
                data: [...data],
                borderColor: color,
                borderWidth: 1,
                backgroundColor:
                    fill === "gradient"
                        ? gradientFill(color)
                        : fill === false
                            ? undefined
                            : fill,
                fill: fill !== false,
                tension,
                pointRadius: 0,
                pointHoverRadius: 0,
            },
        ],
    };

    const chartOptions: ChartOptions<"line"> = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
        },
        scales: {
            x: { display: false },
            y: { display: false, ...(yMin !== undefined ? { min: yMin } : {}) },
        },
    };

    return (
        <div className={heightClass}>
            <Line data={chartData} options={chartOptions} />
        </div>
    );
});
