// 视觉规范：配色直接沿用文档站 apps/docs/src/bootloader.css 中的 @theme 变量，
// 保证宣传片与官网是同一套视觉语言。

export const VIDEO = {
    width: 1920,
    height: 1080,
    fps: 30,
} as const;

export const colors = {
    bg: '#000713',
    surface: '#03101c',
    surfaceSubtle: '#011122',
    surfaceCode: '#0a1628',
    surfaceFloating: '#0a1f33',
    surfaceActive: '#013f4c',
    codePanel: '#022037',

    border: '#081a2b',
    controlBorder: '#102336',
    strongBorder: '#1e4058',
    gridBorder: '#083142',

    primary: '#06e6e2',
    primaryStrong: '#00f8db',
    primaryHighlight: '#02ffff',
    accent: '#65dfe9',

    text: '#DFE2E1',
    textSecondary: '#bbbfc8',
    textSubtle: '#a7afbb',
    textMuted: '#718096',
    textHeading: '#dff9ff',
    textLabel: '#9ac3ce',

    purple: '#ba74ff',
    positive: '#5ce5a4',
    negative: '#fb7185',
    warning: '#ffb30e',

    ttfbStart: '#21dbe6',
    ttfbEnd: '#27a1ff',
    pltStart: '#b46cff',
    pltEnd: '#7e65ff',
} as const;

export const syntax = {
    muted: '#808080',
    keyword: '#c586c0',
    punctuation: '#ffb30e',
    identifier: '#4ad987',
    string: '#6cc2fc',
    text: '#d3d3d3',
    tag: '#65dfe9',
} as const;

export const fonts = {
    sans: '"HarmonyOS Sans SC", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", system-ui, sans-serif',
    mono: '"JetBrains Mono", "Cascadia Code", "Fira Code", Consolas, "Microsoft YaHei", monospace',
} as const;

// 场景内容区的统一边距
export const SAFE_X = 120;
