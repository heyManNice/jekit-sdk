import {
    metricOption,
    rangeOption,
    whereWasIFromOption,
    whichBrowserOption,
    whichOsOption,
} from "jekit-core";

export const RANGE_CONFIG = [
    { label: "7 天", apiRange: rangeOption.Daily, slice: 7 },
    { label: "30 天", apiRange: rangeOption.Daily, slice: 30 },
    { label: "90 天", apiRange: rangeOption.Monthly, slice: 3 },
    { label: "1 年", apiRange: rangeOption.Monthly, slice: 12 },
    { label: "全部", apiRange: rangeOption.Yearly, slice: Infinity },
] as const;

export type DimensionKind = "source" | "browser" | "os";

export interface MetricDefinition {
    label: string;
    value: metricOption;
    dimensionType?: DimensionKind;
}

export const METRICS = [
    { label: "站点用户总数", value: metricOption.totalUserForSite },
    { label: "站点总浏览量", value: metricOption.totalRequestForSite },
    { label: "页面总浏览量", value: metricOption.totalRequestForPage },
    { label: "站点总访客量", value: metricOption.totalVisitorForSite },
    { label: "页面总访客量", value: metricOption.totalVisitorForPage },
    { label: "站点每日浏览量", value: metricOption.todayRequestForSite },
    { label: "页面每日浏览量", value: metricOption.todayRequestForPage },
    { label: "站点每日访客量", value: metricOption.todayVisitorForSite },
    { label: "页面每日访客量", value: metricOption.todayVisitorForPage },
    { label: "搜索引擎-站点总浏览量", value: metricOption.totalRequestFromForSite, dimensionType: "source" },
    { label: "搜索引擎-页面总浏览量", value: metricOption.totalRequestFromForPage, dimensionType: "source" },
    { label: "搜索引擎-站点每日浏览量", value: metricOption.todayRequestFromForSite, dimensionType: "source" },
    { label: "搜索引擎-页面每日浏览量", value: metricOption.todayRequestFromForPage, dimensionType: "source" },
    { label: "浏览器-站点总浏览量", value: metricOption.totalRequestFromBrowserForSite, dimensionType: "browser" },
    { label: "浏览器-页面总浏览量", value: metricOption.totalRequestFromBrowserForPage, dimensionType: "browser" },
    { label: "浏览器-站点每日浏览量", value: metricOption.todayRequestFromBrowserForSite, dimensionType: "browser" },
    { label: "浏览器-页面每日浏览量", value: metricOption.todayRequestFromBrowserForPage, dimensionType: "browser" },
    { label: "操作系统-站点总浏览量", value: metricOption.totalRequestFromOSForSite, dimensionType: "os" },
    { label: "操作系统-页面总浏览量", value: metricOption.totalRequestFromOSForPage, dimensionType: "os" },
    { label: "操作系统-站点每日浏览量", value: metricOption.todayRequestFromOSForSite, dimensionType: "os" },
    { label: "操作系统-页面每日浏览量", value: metricOption.todayRequestFromOSForPage, dimensionType: "os" },
] satisfies MetricDefinition[];

function enumToOptions(enumObject: Record<string, string | number>) {
    return Object.values(enumObject)
        .filter((value): value is number => typeof value === "number")
        .map((value) => ({ label: String(enumObject[value]), value }))
        .sort((left, right) => left.value - right.value);
}

export const DIMENSION_OPTIONS: Record<DimensionKind, { label: string; value: number }[]> = {
    source: enumToOptions(whereWasIFromOption),
    browser: enumToOptions(whichBrowserOption),
    os: enumToOptions(whichOsOption),
};
