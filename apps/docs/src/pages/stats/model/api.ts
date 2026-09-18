import {
    history,
    type metricOption,
    type rangeOption,
} from "jekit-core";

import type { HistoryData, StatsQuery } from "./types";

type CoreHistoryParams = Parameters<typeof history>[0];

export interface HistoryQuery extends StatsQuery {
    range: rangeOption;
    metric: metricOption;
    // core 当前不为“无维度”公开 0 类型；在 docs 边界统一适配，UI 不再散落断言。
    dimensionValue: number;
}

export function fetchHistory(query: HistoryQuery): Promise<HistoryData> {
    return history({
        ...query,
        dimensionValue: query.dimensionValue as CoreHistoryParams["dimensionValue"],
    });
}
