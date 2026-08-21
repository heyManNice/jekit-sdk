import {
    spaGreet,
    type JekitStats,
} from "jekit-core";

const loading = "Loading";
let defaultText = loading;
const _error = "Err";

// 获取默认文本
export function updateDefaultText() {
    const classNames = [
        'jk-site-pv',
        'jk-site-uv',
        'jk-page-pv',
        'jk-page-uv',
        'jk-site-pv-today',
        'jk-site-uv-today',
        'jk-page-pv-today',
        'jk-page-uv-today',
    ];

    for (const className of classNames) {
        const element = document.querySelector(`.${className}`);
        if (element && element.innerHTML) {
            defaultText = element.innerHTML;
            break;
        }
    }
}

// 按class匹配设置dom文本
function setTextByClass(className: string, text: string) {
    const elements = document.querySelectorAll(`.${className}`);
    elements.forEach(el => {
        el.textContent = text;
    });
}

// 把统计数据设置在dom上面
function setStatsDataInDom(data: JekitStats) {
    setTextByClass('jk-site-pv', data.sitePv);
    setTextByClass('jk-site-uv', data.siteUv);
    setTextByClass('jk-page-pv', data.pagePv);
    setTextByClass('jk-page-uv', data.pageUv);
    setTextByClass('jk-site-pv-today', data.sitePvToday);
    setTextByClass('jk-site-uv-today', data.siteUvToday);
    setTextByClass('jk-page-pv-today', data.pagePvToday);
    setTextByClass('jk-page-uv-today', data.pageUvToday);
}

// 把统计数据挂载在window对象上并派发事件
function setStatsDataInWindow(name: string, data: JekitStats) {
    const event = new CustomEvent(name, {
        detail: data,
    });
    window.dispatchEvent(event);
    // 额外派发统一状态变化事件
    window.dispatchEvent(new CustomEvent('jekitchange', {
        detail: data,
    }));
    (window as any)._jekit = data;
}

export class CdnJekit {
    constructor() {
        updateDefaultText();
        this.init();
    }

    // 初始化：SPA 路由切换时自动重新采集并更新 DOM + 派发事件
    private init() {
        spaGreet({
            onLoading: () => {
                const data: JekitStats = {
                    sitePv: defaultText,
                    siteUv: defaultText,
                    pagePv: defaultText,
                    pageUv: defaultText,
                    sitePvToday: defaultText,
                    siteUvToday: defaultText,
                    pagePvToday: defaultText,
                    pageUvToday: defaultText,
                };
                setStatsDataInDom(data);
                setStatsDataInWindow("jekitloading", data);
            },
            onSuccess: (res) => {
                const data: JekitStats = {
                    sitePv: res.totalRequestForSite.toString(),
                    siteUv: res.totalVisitorForSite.toString(),
                    pagePv: res.totalRequestForPage.toString(),
                    pageUv: res.totalVisitorForPage.toString(),
                    sitePvToday: res.todayRequestForSite.toString(),
                    siteUvToday: res.todayVisitorForSite.toString(),
                    pagePvToday: res.todayRequestForPage.toString(),
                    pageUvToday: res.todayVisitorForPage.toString(),
                };
                setStatsDataInDom(data);
                setStatsDataInWindow("jekitready", data);
            },
            onError: (err) => {
                const data: JekitStats = {
                    sitePv: _error,
                    siteUv: _error,
                    pagePv: _error,
                    pageUv: _error,
                    sitePvToday: _error,
                    siteUvToday: _error,
                    pagePvToday: _error,
                    pageUvToday: _error,
                }
                setStatsDataInDom(data);
                setStatsDataInWindow("jekiterror", data);
                console.error('[Jekit] Greet failed:', err);
            },
        });
    }
}