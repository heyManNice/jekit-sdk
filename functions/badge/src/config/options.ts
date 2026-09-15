import type { performance as getPerformance, stats } from 'jekit-core';

type StatsResult = Awaited<ReturnType<typeof stats>>;
type PerformanceResult = Awaited<ReturnType<typeof getPerformance>>;
export const PERFORMANCE_PERCENTILE = 75 as const;

export const BADGE_STYLES = {
    flat: {
        height: 20,
        radius: 3,
        padding: 6,
        fontSize: 11,
        fontWeight: 400,
        letterSpacing: 0,
        hasTextShadow: true,
        gradient: 'flat',
    },
    'flat-square': {
        height: 20,
        radius: 0,
        padding: 6,
        fontSize: 11,
        fontWeight: 400,
        letterSpacing: 0,
        hasTextShadow: false,
        gradient: 'none',
    },
    plastic: {
        height: 18,
        radius: 4,
        padding: 6,
        fontSize: 11,
        fontWeight: 400,
        letterSpacing: 0,
        hasTextShadow: true,
        gradient: 'plastic',
    },
    'for-the-badge': {
        height: 28,
        radius: 0,
        padding: 12,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1,
        hasTextShadow: false,
        gradient: 'none',
    },
} as const;

export type BadgeStyle = keyof typeof BADGE_STYLES;

type StatsMetricOption = {
    source: 'stats';
    statsKey: keyof StatsResult;
    label: string;
};

type PerformanceMetricOption = {
    source: 'performance';
    histogramKey: keyof PerformanceResult;
    percentile: typeof PERFORMANCE_PERCENTILE;
    label: string;
};

type MetricOption = StatsMetricOption | PerformanceMetricOption;

export const BADGE_METRICS = {
    pv: { source: 'stats', statsKey: 'totalRequestForSite', label: '站点PV' },
    ppv: { source: 'stats', statsKey: 'totalRequestForPage', label: '页面PV' },
    uv: { source: 'stats', statsKey: 'totalVisitorForSite', label: '站点UV' },
    puv: { source: 'stats', statsKey: 'totalVisitorForPage', label: '页面UV' },
    tpv: { source: 'stats', statsKey: 'todayRequestForSite', label: '今日站点PV' },
    tppv: { source: 'stats', statsKey: 'todayRequestForPage', label: '今日页面PV' },
    tuv: { source: 'stats', statsKey: 'todayVisitorForSite', label: '今日站点UV' },
    tpuv: { source: 'stats', statsKey: 'todayVisitorForPage', label: '今日页面UV' },
    ttfb: {
        source: 'performance',
        histogramKey: 'ttfbHist',
        percentile: PERFORMANCE_PERCENTILE,
        label: `TTFB P${PERFORMANCE_PERCENTILE}`,
    },
    plt: {
        source: 'performance',
        histogramKey: 'pltHist',
        percentile: PERFORMANCE_PERCENTILE,
        label: `PLT P${PERFORMANCE_PERCENTILE}`,
    },
} as const satisfies Record<string, MetricOption>;

export type BadgeMetric = keyof typeof BADGE_METRICS;

export const BADGE_DEFAULTS = {
    style: 'flat',
    metric: 'pv',
    valueColor: '#4c1',
    labelColor: '#555',
    emptyValue: '无数据',
    emptyColor: '#9f9f9f',
} as const satisfies {
    style: BadgeStyle;
    metric: BadgeMetric;
    valueColor: string;
    labelColor: string;
    emptyValue: string;
    emptyColor: string;
};

export const BADGE_STYLE_NAMES = Object.keys(BADGE_STYLES) as BadgeStyle[];
export const BADGE_METRIC_NAMES = Object.keys(BADGE_METRICS) as BadgeMetric[];

export function isBadgeStyle(value: string | undefined): value is BadgeStyle {
    return value !== undefined && Object.hasOwn(BADGE_STYLES, value);
}

export function isBadgeMetric(value: string | undefined): value is BadgeMetric {
    return value !== undefined && Object.hasOwn(BADGE_METRICS, value);
}
