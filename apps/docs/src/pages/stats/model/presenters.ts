import type {
    PerformanceData,
    SourceData,
} from "./types";

export function cumulativeSparkline(
    total: number | bigint | undefined,
    daily: readonly number[] | undefined,
): number[] {
    if (total == null || !daily) return [];
    const result = new Array<number>(daily.length);
    let suffix = 0;
    for (let index = daily.length - 1; index >= 0; index--) {
        result[index] = Number(total) - suffix;
        suffix += daily[index];
    }
    return result;
}

export interface PreviousDayComparison {
    value: number;
    changePercent: number | null;
}

export function previousDayComparison(
    daily: readonly number[] | undefined,
): PreviousDayComparison | null {
    if (!daily || daily.length < 2) return null;

    const value = daily[daily.length - 2];
    const previousValue = daily[daily.length - 3];
    const changePercent = previousValue == null || previousValue === 0
        ? null
        : ((value - previousValue) / previousValue) * 100;

    return { value, changePercent };
}

export interface DimensionRow {
    name: string;
    totalVisits: string;
    todayVisits: string;
    ratio: string;
}

export function buildDimensionRows(
    data: SourceData | null,
    enumObject: Record<string, string | number>,
    rename: Readonly<Record<string, string>> = {},
): DimensionRow[] {
    if (!data) return [];
    const byIndex = new Map(data.map((item) => [item.dimensionIndex, item]));
    const grandTotal = data.reduce((sum, item) => sum + Number(item.totalRequest), 0);

    return Object.values(enumObject)
        .filter((value): value is number => typeof value === "number")
        .map((index) => {
            const item = byIndex.get(index);
            const total = Number(item?.totalRequest ?? 0);
            const rawName = String(enumObject[index]);
            return {
                name: rename[rawName] ?? rawName,
                totalVisits: total.toLocaleString(),
                todayVisits: (item?.todayRequest ?? 0).toLocaleString(),
                ratio: grandTotal > 0 ? `${((total / grandTotal) * 100).toFixed(1)}%` : "0%",
                sortKey: total,
            };
        })
        .sort((left, right) => {
            if (left.name === "Other") return 1;
            if (right.name === "Other") return -1;
            return right.sortKey - left.sortKey;
        })
        .map(({ sortKey: _sortKey, ...row }) => row);
}

export interface SearchRow {
    name: string;
    visitsToday: string;
    visitsTotal: string;
    ratio: string;
    daily: readonly number[];
}

const EMPTY_DAILY_TREND = [0, 0, 0, 0, 0, 0, 0] as const;

export function buildSearchRows(
    data: SourceData | null,
    searchEngineOptions: Record<string, string | number>,
): SearchRow[] {
    if (!data) return [];
    const byIndex = new Map(data.map((item) => [item.dimensionIndex, item]));
    const grandTotal = data.reduce((sum, item) => sum + Number(item.totalRequest), 0);

    return Object.values(searchEngineOptions)
        .filter((value): value is number => typeof value === "number")
        .map((index) => {
            const item = byIndex.get(index);
            const name = String(searchEngineOptions[index]);
            const total = Number(item?.totalRequest ?? 0);
            return {
                name,
                visitsToday: (item?.todayRequest ?? 0).toLocaleString(),
                visitsTotal: total.toLocaleString(),
                ratio: grandTotal > 0 ? `${((total / grandTotal) * 100).toFixed(1)}%` : "0%",
                daily: item?.dailyRequest ?? EMPTY_DAILY_TREND,
                sortKey: total,
            };
        })
        .sort((left, right) => {
            if (left.name === "Other") return 1;
            if (right.name === "Other") return -1;
            return right.sortKey - left.sortKey;
        })
        .map(({ sortKey: _sortKey, ...row }) => row);
}

export interface PerformancePoint {
    label: string;
    ttfb: number;
    plt: number;
    ttfbRaw: number;
    pltRaw: number;
}

export function buildPerformancePoints(data: PerformanceData | null): PerformancePoint[] {
    if (!data) return [];
    const { ttfbHist, pltHist } = data;

    let start = 0;
    let end = ttfbHist.length - 2;
    while (start < end && ttfbHist[start] === 0 && pltHist[start] === 0) start++;
    while (end > start && ttfbHist[end - 1] === 0 && pltHist[end - 1] === 0) end--;

    const sumTtfb = ttfbHist.slice(start, end).reduce((sum, value) => sum + value, 0);
    const sumPlt = pltHist.slice(start, end).reduce((sum, value) => sum + value, 0);

    return Array.from({ length: end - start }, (_, offset) => {
        const index = start + offset;
        const label = index < 100
            ? `${index * 10}ms`
            : index < 253
                ? `${index / 100}s`
                : "≥2.53s";
        return {
            label,
            ttfb: sumTtfb > 0 ? Math.round((ttfbHist[index] / sumTtfb) * 100) : 0,
            plt: sumPlt > 0 ? Math.round((pltHist[index] / sumPlt) * 100) : 0,
            ttfbRaw: ttfbHist[index],
            pltRaw: pltHist[index],
        };
    });
}
