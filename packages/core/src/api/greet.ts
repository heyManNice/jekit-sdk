import 'history-events';

import {
    dto,
    vto,
} from "../schema/greet";
import {
    defineBuffer,
    fetchResponse,
} from "../utils/io";
import * as ctx from "../utils/ctx";

// 登记并问候最新的访问信息
export async function greet() {
    if (ctx.isBotEnvironment()) {
        throw new Error("当前环境被检测为爬虫环境，Jekit Greet 已禁用");
    }

    const origin = location.origin;
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        throw new Error("本地环境禁用 Jekit Greet，部署到线上后即可生效");
    }

    const performanceMetrics = await ctx.getPerformanceMetrics();
    const reqBuf = defineBuffer(dto, {
        visitorStatus: ctx.getVisitorStatus(),
        whereWasIFrom: ctx.whereWasIFrom(),
        theHashOfPath: ctx.getHashOfCurrentPath(),
        whichBrowser: ctx.getWhichBrowser(),
        whichOS: ctx.getWhichOS(),
        ttfb: performanceMetrics.ttfb,
        plt: performanceMetrics.plt,
    });

    const res = await fetchResponse(vto, {
        target: '/greet',
        headers: {},
        buffer: reqBuf,
    });
    return res;
}

export type GreetResult = Awaited<ReturnType<typeof greet>>;

// SPA 虚拟路由切换时自动重新采集埋点
// 内部自带 50ms 防抖 + 并发竞态丢弃，返回取消订阅函数
export function spaGreet(props: {
    onLoading: () => void;
    onSuccess: (res: GreetResult) => void;
    onError: (err: unknown) => void;
}) {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let seq = 0;
    // 记录上一次导航的 URL，只有本次导航与上次不同才发送请求
    let lastHref: string | null = null;

    function handleRouteChange() {
        const currentHref = location.href;
        if (currentHref === lastHref) return;
        lastHref = currentHref;

        props.onLoading();
        if (timer !== null) clearTimeout(timer);
        timer = setTimeout(() => {
            const currentSeq = ++seq;
            greet()
                .then((res) => {
                    if (currentSeq === seq) props.onSuccess(res);
                })
                .catch((err) => {
                    if (currentSeq === seq) props.onError(err);
                });
        }, 50);
    }

    window.addEventListener('pushstate', handleRouteChange);
    window.addEventListener('replacestate', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);

    // 立即执行首次采集
    handleRouteChange();

    // 返回取消订阅函数，组件卸载时调用
    return () => {
        window.removeEventListener('pushstate', handleRouteChange);
        window.removeEventListener('replacestate', handleRouteChange);
        window.removeEventListener('popstate', handleRouteChange);
        if (timer !== null) clearTimeout(timer);
    };
}
