export const PERFORMANCE_BUCKET = {
    lastDuration: 253,
    skipped: 254,
    failed: 255,
} as const;

/**
 * 从性能直方图中取最近秩分位数。
 * 只统计 0–253；254（无需采集）和 255（采集失败）不属于耗时样本。
 */
export function getPerformancePercentile(
    histogram: readonly number[],
    percentile: number,
): number | null {
    const durationBuckets = histogram.slice(0, PERFORMANCE_BUCKET.lastDuration + 1);
    const sampleCount = durationBuckets.reduce((sum, count) => sum + count, 0);

    if (sampleCount === 0) {
        return null;
    }

    const rank = Math.ceil(sampleCount * percentile / 100);
    let cumulativeCount = 0;

    for (let bucket = 0; bucket < durationBuckets.length; bucket++) {
        cumulativeCount += durationBuckets[bucket];
        if (cumulativeCount >= rank) {
            return bucket;
        }
    }

    return null;
}

export function formatPerformanceBucket(bucket: number): string {
    if (bucket === PERFORMANCE_BUCKET.lastDuration) {
        return '≥2.53s';
    }
    if (bucket < 100) {
        return `${bucket * 10}ms`;
    }

    return `${bucket / 100}s`;
}
