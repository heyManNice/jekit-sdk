import { spaGreet } from 'jekit-core';
import type { JekitStats } from 'jekit-core';

const loading = 'Loading';
const _error = 'Err';

let currentStats: Readonly<JekitStats> = Object.freeze({
    sitePv: loading,
    siteUv: loading,
    pagePv: loading,
    pageUv: loading,
    sitePvToday: loading,
    siteUvToday: loading,
    pagePvToday: loading,
    pageUvToday: loading
});

const listeners = new Set<() => void>();

export const jekitStore = {
    subscribe(listener: () => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },

    getSnapshot() {
        return currentStats;
    },

    emitChange(newStats: JekitStats) {
        currentStats = Object.freeze({
            ...newStats,
        });
        listeners.forEach((listener) => listener());
    }
};

function emitLoading(props: {
    defaultText?: string;
}) {
    if (props.defaultText) {
        jekitStore.emitChange({
            sitePv: props.defaultText,
            siteUv: props.defaultText,
            pagePv: props.defaultText,
            pageUv: props.defaultText,
            sitePvToday: props.defaultText,
            siteUvToday: props.defaultText,
            pagePvToday: props.defaultText,
            pageUvToday: props.defaultText
        });
    } else {
        jekitStore.emitChange({
            sitePv: loading,
            siteUv: loading,
            pagePv: loading,
            pageUv: loading,
            sitePvToday: loading,
            siteUvToday: loading,
            pagePvToday: loading,
            pageUvToday: loading
        });
    }
}

let consumerCount = 0;
let stopJekit: (() => void) | null = null;

export function initJekitReact(props: {
    defaultText?: string;
}) {
    consumerCount++;

    // 第一位消费者负责启动全局监听；后续消费者共享同一份数据源。
    if (consumerCount === 1) {
        stopJekit = spaGreet({
            onLoading: () => {
                emitLoading({
                    defaultText: props.defaultText
                });
            },
            onSuccess: (res) => {
                jekitStore.emitChange({
                    sitePv: res.totalRequestForSite.toString(),
                    siteUv: res.totalVisitorForSite.toString(),
                    pagePv: res.totalRequestForPage.toString(),
                    pageUv: res.totalVisitorForPage.toString(),
                    sitePvToday: res.todayRequestForSite.toString(),
                    siteUvToday: res.todayVisitorForSite.toString(),
                    pagePvToday: res.todayRequestForPage.toString(),
                    pageUvToday: res.todayVisitorForPage.toString()
                });
            },
            onError: (err) => {
                jekitStore.emitChange({
                    sitePv: _error,
                    siteUv: _error,
                    pagePv: _error,
                    pageUv: _error,
                    sitePvToday: _error,
                    siteUvToday: _error,
                    pagePvToday: _error,
                    pageUvToday: _error
                });
                console.error('[Jekit] Greet failed:', err);
            },
        });
    }

    let released = false;
    return () => {
        if (released) return;
        released = true;
        consumerCount--;

        // 只有最后一位消费者卸载时才关闭全局监听。
        if (consumerCount === 0) {
            stopJekit?.();
            stopJekit = null;
        }
    };
}
