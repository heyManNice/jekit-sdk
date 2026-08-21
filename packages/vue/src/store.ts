import {
    spaGreet,
    type JekitStats,
} from 'jekit-core';
import {
    reactive,
    readonly,
    onMounted,
    onUnmounted,
    type DeepReadonly,
} from 'vue';

const loading = 'Loading';
const _error = 'Err';

const statsState = reactive<JekitStats>({
    sitePv: loading,
    siteUv: loading,
    pagePv: loading,
    pageUv: loading,
    sitePvToday: loading,
    siteUvToday: loading,
    pagePvToday: loading,
    pageUvToday: loading,
});

function emitChange(newStats: JekitStats) {
    Object.assign(statsState, newStats);
}

let initialized = false;

function emitLoading(props: {
    defaultText?: string;
}) {
    if (props.defaultText) {
        emitChange({
            sitePv: props.defaultText,
            siteUv: props.defaultText,
            pagePv: props.defaultText,
            pageUv: props.defaultText,
            sitePvToday: props.defaultText,
            siteUvToday: props.defaultText,
            pagePvToday: props.defaultText,
            pageUvToday: props.defaultText,
        });
    } else {
        emitChange({
            sitePv: loading,
            siteUv: loading,
            pagePv: loading,
            pageUv: loading,
            sitePvToday: loading,
            siteUvToday: loading,
            pagePvToday: loading,
            pageUvToday: loading,
        });
    }
}

export function initJekitVue(props: {
    defaultText?: string;
}) {
    if (initialized) return () => { };
    initialized = true;

    const unsubscribe = spaGreet({
        onLoading: () => {
            emitLoading({ defaultText: props.defaultText });
        },
        onSuccess: (res) => {
            emitChange({
                sitePv: res.totalRequestForSite.toString(),
                siteUv: res.totalVisitorForSite.toString(),
                pagePv: res.totalRequestForPage.toString(),
                pageUv: res.totalVisitorForPage.toString(),
                sitePvToday: res.todayRequestForSite.toString(),
                siteUvToday: res.todayVisitorForSite.toString(),
                pagePvToday: res.todayRequestForPage.toString(),
                pageUvToday: res.todayVisitorForPage.toString(),
            });
        },
        onError: (err) => {
            emitChange({
                sitePv: _error,
                siteUv: _error,
                pagePv: _error,
                pageUv: _error,
                sitePvToday: _error,
                siteUvToday: _error,
                pagePvToday: _error,
                pageUvToday: _error,
            });
            console.error('[Jekit] Greet failed:', err);
        },
    });

    return () => {
        initialized = false;
        unsubscribe();
    };
}

export function useJekitStore(props?: {
    defaultText?: string;
}): DeepReadonly<JekitStats> {
    onMounted(() => {
        const unsubscribe = initJekitVue({
            defaultText: props?.defaultText,
        });
        onUnmounted(() => {
            unsubscribe();
        });
    });

    return readonly(statsState);
}
