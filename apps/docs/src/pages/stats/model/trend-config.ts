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
    { label: "累计站点用户数", value: metricOption.totalUserForSite },
    { label: "累计站点 UV", value: metricOption.totalVisitorForSite },
    { label: "累计站点 PV", value: metricOption.totalRequestForSite },
    { label: "累计页面 UV", value: metricOption.totalVisitorForPage },
    { label: "累计页面 PV", value: metricOption.totalRequestForPage },
    { label: "每日站点 UV", value: metricOption.todayVisitorForSite },
    { label: "每日站点 PV", value: metricOption.todayRequestForSite },
    { label: "每日页面 UV", value: metricOption.todayVisitorForPage },
    { label: "每日页面 PV", value: metricOption.todayRequestForPage },
    { label: "来源 · 累计站点 PV", value: metricOption.totalRequestFromForSite, dimensionType: "source" },
    { label: "来源 · 累计页面 PV", value: metricOption.totalRequestFromForPage, dimensionType: "source" },
    { label: "来源 · 每日站点 PV", value: metricOption.todayRequestFromForSite, dimensionType: "source" },
    { label: "来源 · 每日页面 PV", value: metricOption.todayRequestFromForPage, dimensionType: "source" },
    { label: "浏览器 · 累计站点 PV", value: metricOption.totalRequestFromBrowserForSite, dimensionType: "browser" },
    { label: "浏览器 · 累计页面 PV", value: metricOption.totalRequestFromBrowserForPage, dimensionType: "browser" },
    { label: "浏览器 · 每日站点 PV", value: metricOption.todayRequestFromBrowserForSite, dimensionType: "browser" },
    { label: "浏览器 · 每日页面 PV", value: metricOption.todayRequestFromBrowserForPage, dimensionType: "browser" },
    { label: "操作系统 · 累计站点 PV", value: metricOption.totalRequestFromOSForSite, dimensionType: "os" },
    { label: "操作系统 · 累计页面 PV", value: metricOption.totalRequestFromOSForPage, dimensionType: "os" },
    { label: "操作系统 · 每日站点 PV", value: metricOption.todayRequestFromOSForSite, dimensionType: "os" },
    { label: "操作系统 · 每日页面 PV", value: metricOption.todayRequestFromOSForPage, dimensionType: "os" },
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
