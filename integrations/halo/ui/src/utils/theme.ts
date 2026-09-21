// 看板的配色分工：
// - 数据可视化（折线、面积填充、图例色块、指标徽章）各自保留高区分度的颜色，不走 Halo 品牌色，
//   否则整个面板会变成单色调；
// - 通用元素（图表网格线、坐标轴刻度、tooltip 边框与文字、次要说明文字）统一取 Halo Console
//   组件库 style.css 中实际使用的灰阶，跟着 Console 的观感走；
// - 需要品牌/语义色时直接在 CSS 里写 rgb(var(--colors-primary|secondary|danger) / α)。
export const neutral = {
    // 坐标轴刻度文字
    line: '#9ca3af',
    // 网格线与 tooltip 边框
    grid: '#e5e7eb',
    // tooltip 正文
    text: '#111827',
    // tooltip 标题、次要说明文字
    textMuted: '#6b7280',
} as const
