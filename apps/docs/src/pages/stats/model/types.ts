import type {
    history,
    performance,
    source,
    stats,
} from "jekit-core";

import type { AsyncResource } from "@/hooks/use-async-resource";

export interface StatsQuery {
    domain: string;
    path: string;
}

export type StatsData = Awaited<ReturnType<typeof stats>>;
export type SourceData = Awaited<ReturnType<typeof source>>;
export type SourceDataItem = SourceData[number];
export type PerformanceData = Awaited<ReturnType<typeof performance>>;
export type HistoryData = Awaited<ReturnType<typeof history>>;
export type HistoryDataItem = HistoryData[number];

export type StatsResource = AsyncResource<StatsData>;
export type SourceResource = AsyncResource<SourceData>;
export type PerformanceResource = AsyncResource<PerformanceData>;
export type HistoryResource = AsyncResource<HistoryData>;
