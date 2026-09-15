import type { stats } from 'jekit-core';

type StatsResult = Awaited<ReturnType<typeof stats>>;

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

type MetricOption = {
    statsKey: keyof StatsResult;
    label: string;
};

export const BADGE_METRICS = {
    pv: { statsKey: 'totalRequestForSite', label: '站点PV' },
    ppv: { statsKey: 'totalRequestForPage', label: '页面PV' },
    uv: { statsKey: 'totalVisitorForSite', label: '站点UV' },
    puv: { statsKey: 'totalVisitorForPage', label: '页面UV' },
    tpv: { statsKey: 'todayRequestForSite', label: '今日站点PV' },
    tppv: { statsKey: 'todayRequestForPage', label: '今日页面PV' },
    tuv: { statsKey: 'todayVisitorForSite', label: '今日站点UV' },
    tpuv: { statsKey: 'todayVisitorForPage', label: '今日页面UV' },
} as const satisfies Record<string, MetricOption>;

export type BadgeMetric = keyof typeof BADGE_METRICS;

export const BADGE_DEFAULTS = {
    style: 'flat',
    metric: 'pv',
    valueColor: '#4c1',
    labelColor: '#555',
} as const satisfies {
    style: BadgeStyle;
    metric: BadgeMetric;
    valueColor: string;
    labelColor: string;
};

export const BADGE_STYLE_NAMES = Object.keys(BADGE_STYLES) as BadgeStyle[];
export const BADGE_METRIC_NAMES = Object.keys(BADGE_METRICS) as BadgeMetric[];

export function isBadgeStyle(value: string | undefined): value is BadgeStyle {
    return value !== undefined && Object.hasOwn(BADGE_STYLES, value);
}

export function isBadgeMetric(value: string | undefined): value is BadgeMetric {
    return value !== undefined && Object.hasOwn(BADGE_METRICS, value);
}
