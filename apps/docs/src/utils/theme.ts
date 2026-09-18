export type ThemeColorToken = `--color-${string}`;

// Canvas 图表不会解析 CSS var()，因此在浏览器中读取主题变量的计算值。
// 颜色的唯一来源仍是 bootloader.css，图表配置不再复制十六进制色值。
export function themeColor(token: ThemeColorToken): string {
    return getComputedStyle(document.documentElement)
        .getPropertyValue(token)
        .trim();
}
