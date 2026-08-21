
// 导出接口
export {
    greet,
    spaGreet,
    type GreetResult,
} from "./api/greet";
export { device } from "./api/device";
export { stats } from "./api/stats";
export { history } from "./api/history";
export { source } from "./api/source";
export { performance } from "./api/performance";

// 导出枚举
export {
    whereWasIFromOption,
    whichBrowserOption,
    whichOsOption,
    dimensionOption,
    visitorStatusOption,
    rangeOption,
    metricOption,
    scopeOption,
} from "./schema/options";

// 导出给框架封装的简易类型
export interface JekitStats {
    sitePv: string;
    siteUv: string;
    pagePv: string;
    pageUv: string;
    sitePvToday: string;
    siteUvToday: string;
    pagePvToday: string;
    pageUvToday: string;
}
