import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useLocation, useNavigate } from "react-router";
import {
    dimensionOption,
    performance,
    scopeOption,
    source,
    stats,
} from "jekit-core";

import { useAsyncResource } from "@/hooks/use-async-resource";
import { useQueryHistoryStore } from "@/stores/query-history";
import {
    buildStatsQueryUrl,
    formatStatsUrl,
    parseStatsUrl,
    readStatsQuery,
} from "@/utils/stats-url";

import type { StatsQuery } from "./types";

const DEFAULT_QUERY: StatsQuery = {
    domain: "https://jekit.cn",
    path: "/",
};

export function useStatsDashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    const history = useQueryHistoryStore((state) => state.history);
    const addHistory = useQueryHistoryStore((state) => state.addHistory);
    const removeHistory = useQueryHistoryStore((state) => state.removeHistory);
    const clearHistory = useQueryHistoryStore((state) => state.clearHistory);
    const [refreshToken, setRefreshToken] = useState(0);

    const rawQuery = readStatsQuery(location.search, location.hash);
    const query = useMemo(
        () => rawQuery ? parseStatsUrl(rawQuery) : DEFAULT_QUERY,
        [rawQuery],
    );
    const queryUrl = formatStatsUrl(query.domain, query.path);
    const resourceKey = `${queryUrl}\u0000${refreshToken}`;

    // 没有查询参数时补上默认地址，使刷新、分享和数据请求始终由 URL 驱动。
    useEffect(() => {
        if (rawQuery) return;
        navigate(buildStatsQueryUrl(location.pathname, queryUrl), { replace: true });
    }, [location.pathname, navigate, queryUrl, rawQuery]);

    const submitQuery = useCallback((value: string) => {
        const nextQuery = parseStatsUrl(value);
        const nextUrl = formatStatsUrl(nextQuery.domain, nextQuery.path);
        addHistory(nextUrl);

        if (nextUrl === queryUrl) {
            setRefreshToken((current) => current + 1);
            return;
        }

        navigate(buildStatsQueryUrl(location.pathname, nextUrl), { replace: true });
    }, [addHistory, location.pathname, navigate, queryUrl]);

    const overview = useAsyncResource(
        `stats:${resourceKey}`,
        () => stats(query),
    );
    const browserSource = useAsyncResource(
        `source:browser:${resourceKey}`,
        () => source({
            ...query,
            scope: scopeOption.Site,
            dimension: dimensionOption.Browser,
        }),
    );
    const osSource = useAsyncResource(
        `source:os:${resourceKey}`,
        () => source({
            ...query,
            scope: scopeOption.Site,
            dimension: dimensionOption.OS,
        }),
    );
    const searchSource = useAsyncResource(
        `source:search:${resourceKey}`,
        () => source({
            ...query,
            scope: scopeOption.Site,
            dimension: dimensionOption.SearchEngine,
        }),
    );
    const performanceData = useAsyncResource(
        `performance:${query.domain}\u0000${refreshToken}`,
        () => performance({ domain: query.domain }),
    );

    return {
        query,
        queryUrl,
        refreshToken,
        history,
        removeHistory,
        clearHistory,
        submitQuery,
        overview,
        browserSource,
        osSource,
        searchSource,
        performance: performanceData,
    };
}
