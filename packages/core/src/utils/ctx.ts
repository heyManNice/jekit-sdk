import { fnv1a32 } from "./hash";
import {
    whereWasIFromOption,
    visitorStatusOption,
    whichBrowserOption,
    whichOsOption,
} from "../schema/options";
import { getCleanRequestUri } from "./uri";
import {
    toBase64,
    fromBase64,
} from "./base64";
import { BloomFilter } from "./filter";

// 获取访客的状态，副作用全在里面了
export function getVisitorStatus() {
    if (!window.localStorage) {
        return visitorStatusOption.ExistingUser_ExistingSite_ExistingPage;
    }

    // 直接算北京时间
    const today = Math.floor(((Date.now() + 28800000) / 86400000) % 255);
    const pathHash = getHashOfCurrentPath();

    // [1字节上次访问日期][1字节今天访问过的页面数量][今日13字节布隆过滤器] = 15字节
    const keyL1 = "jekit-l1";
    // [今日108字节布隆过滤器扩展]
    const keyL2 = "jekit-l2";

    const base64L1 = window.localStorage.getItem(keyL1);

    // ==================== 1. 历史新用户 ====================
    if (base64L1 === null) {
        const uint8Array = new Uint8Array(15);
        uint8Array[0] = today;
        uint8Array[1] = 1; // 看了 1 个页面

        const bloom = new BloomFilter({ bytes: 13, hashes: 7 });
        bloom.add(pathHash);
        uint8Array.set(bloom.toUint8Array(), 2);

        window.localStorage.setItem(keyL1, toBase64(uint8Array));
        // 新用户进来，L2 必然不存在，顺手清理可能存在的脏数据残留
        window.localStorage.removeItem(keyL2);
        return visitorStatusOption.NewUser_TodayNewSite_TodayNewPage;
    }

    const u8a = fromBase64(base64L1);
    const uint8Array = (u8a.length === 15) ? u8a : new Uint8Array(15);
    const lastVisit = uint8Array[0];

    // ==================== 2. 老用户但今天第一次访问（跨天熔断） ====================
    if (lastVisit !== today) {
        const newUint8Array = new Uint8Array(15);
        newUint8Array[0] = today;
        newUint8Array[1] = 1;

        const bloom = new BloomFilter({ bytes: 13, hashes: 7 });
        bloom.add(pathHash);
        newUint8Array.set(bloom.toUint8Array(), 2);

        window.localStorage.setItem(keyL1, toBase64(newUint8Array));
        // 核心微操：新的一天到了，一刀切物理自毁昨天的 L2 扩展层
        window.localStorage.removeItem(keyL2);
        return visitorStatusOption.ExistingUser_TodayNewSite_TodayNewPage;
    }

    // ==================== 3. 今天已经来过的老用户分流 ====================
    const todayVisitedPages = uint8Array[1];

    // 加载 L1 布隆状态
    const bloomL1 = new BloomFilter({ bytes: 13, hashes: 7 });
    bloomL1.fromUint8Array(uint8Array.subarray(2)); // 使用 subarray 视图零拷贝

    // 尝试加载 L2 扩展层（仅当今天访问页面数超过 10 且 L2 存在时才去碰 I/O）
    let bloomL2: BloomFilter | null = null;
    let hasL2 = false;
    if (todayVisitedPages > 10) {
        const base64L2 = window.localStorage.getItem(keyL2);
        if (base64L2 !== null) {
            const u8aL2 = fromBase64(base64L2);
            if (u8aL2.length === 108) {
                bloomL2 = new BloomFilter({ bytes: 108, hashes: 7 });
                bloomL2.fromUint8Array(u8aL2);
                hasL2 = true;
            }
        }
    }

    // --- 核心联动判定：这个页面今天看过了吗？ ---
    let isPageVisited = false;

    if (todayVisitedPages <= 10) {
        // 10页以内，只要 L1 说看过，就是看过
        isPageVisited = bloomL1.check(pathHash);
    } else {
        // 如果 L1 说没看过，那绝对没看过
        if (!bloomL1.check(pathHash)) {
            isPageVisited = false;
        } else {
            // 如果 L1 说看过，我们得看 L2 的态度
            if (!hasL2) {
                // 如果当年 L1 记录这 10 个页面的时候，L2 还没出生
                // 那么这个页面必定是那前 10 个历史页面之一！
                // 我们应该判定它“看过”，并且顺手把它同步到 L2 里，完成防线平滑升级！
                isPageVisited = true;

                // 补染 L2 的补丁逻辑
                bloomL2 = new BloomFilter({ bytes: 108, hashes: 7 });
                bloomL2.add(pathHash);
                window.localStorage.setItem(keyL2, toBase64(bloomL2.toUint8Array()));
            } else {
                // 如果 L2 已经存在了，那两家都说看过，才算看过
                isPageVisited = bloomL2!.check(pathHash);
            }
        }
    }

    // ==================== 情况 A：发现了全新未访问的页面 ====================
    if (!isPageVisited) {
        const nextVisitedCount = Math.min(255, todayVisitedPages + 1);
        uint8Array[1] = nextVisitedCount;

        bloomL1.add(pathHash);
        uint8Array.set(bloomL1.toUint8Array(), 2);
        window.localStorage.setItem(keyL1, toBase64(uint8Array));
        if (nextVisitedCount > 10) {
            // 如果是在大于 10 的时候迎来的全新页面
            if (!bloomL2) {
                bloomL2 = new BloomFilter({ bytes: 108, hashes: 7 });
            }
            bloomL2.add(pathHash);
            window.localStorage.setItem(keyL2, toBase64(bloomL2.toUint8Array()));
        }

        return visitorStatusOption.ExistingUser_ExistingSite_TodayNewPage;
    }

    // ==================== 情况 B：这个页面今天确实看过了 ====================
    return visitorStatusOption.ExistingUser_ExistingSite_ExistingPage;
}

// 获取我是从哪里来到这里的?
export function whereWasIFrom(): whereWasIFromOption {
    const referrer = document.referrer;
    // 结合当前页面的 URL 参数，因为很多 AI 导流会把痕迹留在 URL 的 search 里
    const currentSearch = typeof window !== 'undefined' ? window.location.search.toLowerCase() : '';

    // 如果没有来源，先别急着判 Direct，先看看 URL 参数里有没有被 AI 打了标记
    if (!referrer || referrer === "") {
        if (currentSearch.includes('copilot') || currentSearch.includes('msclkid')) {
            return whereWasIFromOption.Copilot;
        }
        if (currentSearch.includes('doubao') || currentSearch.includes('lucas')) {
            return whereWasIFromOption.Doubao;
        }
        if (currentSearch.includes('claude')) {
            return whereWasIFromOption.Claude;
        }
        if (currentSearch.includes('chatgpt') || currentSearch.includes('openai')) {
            return whereWasIFromOption.ChatGPT;
        }
        if (currentSearch.includes('deepseek')) {
            return whereWasIFromOption.DeepSeek;
        }
        if (currentSearch.includes('perplexity')) {
            return whereWasIFromOption.Perplexity;
        }
        if (currentSearch.includes('grok')) {
            return whereWasIFromOption.Grok;
        }
        if (currentSearch.includes('gemini')) {
            return whereWasIFromOption.Gemini;
        }
        if (currentSearch.includes('kimi')) {
            return whereWasIFromOption.Kimi;
        }
        if (currentSearch.includes('yuanbao') || currentSearch.includes('tencent')) {
            return whereWasIFromOption.Yuanbao;
        }
        if (currentSearch.includes('wenxin')) {
            return whereWasIFromOption.Wenxin;
        }
        if (currentSearch.includes('qwen') || currentSearch.includes('tongyi')) {
            return whereWasIFromOption.Qwen;
        }
        if (currentSearch.includes('xinghuo') || currentSearch.includes('spark')) {
            return whereWasIFromOption.Spark;
        }
        return whereWasIFromOption.Direct;
    }

    try {
        const lowerReferrer = referrer.toLowerCase();
        const referrerHost = (() => {
            try { return new URL(referrer).hostname.toLowerCase(); } catch { return ''; }
        })();

        if (lowerReferrer.includes('google.')) {
            return whereWasIFromOption.Google;
        }
        // 【百度 矩阵】
        if (lowerReferrer.includes('baidu.com')) {
            return whereWasIFromOption.Baidu;
        }

        if (
            lowerReferrer.includes('copilot.microsoft.com') ||
            lowerReferrer.includes('sydney.bing.com') ||
            (lowerReferrer.includes('bing.com') && currentSearch.includes('copilot')) ||
            currentSearch.includes('utm_source=copilot')
        ) {
            return whereWasIFromOption.Copilot;
        }

        if (lowerReferrer.includes('bing.com')) {
            return whereWasIFromOption.Bing;
        }

        if (
            lowerReferrer.includes('doubao.com') ||
            lowerReferrer.includes('ciciai.com') ||
            currentSearch.includes('utm_source=doubao')
        ) {
            return whereWasIFromOption.Doubao;
        }

        if (
            lowerReferrer.includes('claude.ai') ||
            lowerReferrer.includes('claude.app') ||
            currentSearch.includes('utm_source=claude')
        ) {
            return whereWasIFromOption.Claude;
        }

        // ChatGPT
        if (
            lowerReferrer.includes('chatgpt.com') ||
            lowerReferrer.includes('chat.openai.com') ||
            referrerHost.includes('openai') ||
            currentSearch.includes('utm_source=chatgpt') ||
            currentSearch.includes('utm_source=openai')
        ) {
            return whereWasIFromOption.ChatGPT;
        }

        // DeepSeek
        if (
            lowerReferrer.includes('deepseek.com') ||
            currentSearch.includes('utm_source=deepseek')
        ) {
            return whereWasIFromOption.DeepSeek;
        }

        // Perplexity
        if (
            lowerReferrer.includes('perplexity.ai') ||
            currentSearch.includes('utm_source=perplexity')
        ) {
            return whereWasIFromOption.Perplexity;
        }

        // Grok
        if (
            lowerReferrer.includes('grok.com') ||
            lowerReferrer.includes('x.ai') ||
            currentSearch.includes('utm_source=grok')
        ) {
            return whereWasIFromOption.Grok;
        }

        // Gemini
        if (
            lowerReferrer.includes('gemini.google.com') ||
            lowerReferrer.includes('bard.google.com') ||
            currentSearch.includes('utm_source=gemini')
        ) {
            return whereWasIFromOption.Gemini;
        }

        // Kimi
        if (
            lowerReferrer.includes('kimi.moonshot.cn') ||
            lowerReferrer.includes('kimi.com') ||
            currentSearch.includes('utm_source=kimi')
        ) {
            return whereWasIFromOption.Kimi;
        }

        // 元宝 (Yuanbao)
        if (
            lowerReferrer.includes('yuanbao.tencent.com') ||
            lowerReferrer.includes('yuanbao') ||
            currentSearch.includes('utm_source=yuanbao')
        ) {
            return whereWasIFromOption.Yuanbao;
        }

        // 搜狗 (Sogou)
        if (
            lowerReferrer.includes('sogou.com') ||
            lowerReferrer.includes('sogo.com')
        ) {
            return whereWasIFromOption.Sogou;
        }

        // 360 搜索
        if (
            lowerReferrer.includes('so.com') ||
            lowerReferrer.includes('hao.360.cn') ||
            lowerReferrer.includes('360.cn')
        ) {
            return whereWasIFromOption.Search360;
        }

        // Brave Search
        if (
            lowerReferrer.includes('search.brave.com') ||
            lowerReferrer.includes('brave.com')
        ) {
            return whereWasIFromOption.Brave;
        }

        // DuckDuckGo
        if (
            lowerReferrer.includes('duckduckgo.com')
        ) {
            return whereWasIFromOption.DuckDuckGo;
        }

        // Yandex
        if (
            lowerReferrer.includes('yandex.')
        ) {
            return whereWasIFromOption.Yandex;
        }

        // 文心一言 (Wenxin)
        if (
            lowerReferrer.includes('wenxin.baidu.com') ||
            lowerReferrer.includes('yiyan.baidu.com') ||
            currentSearch.includes('utm_source=wenxin')
        ) {
            return whereWasIFromOption.Wenxin;
        }

        // 通义千问 (Qwen)
        if (
            lowerReferrer.includes('tongyi.aliyun.com') ||
            lowerReferrer.includes('qwen.aliyun.com') ||
            lowerReferrer.includes('qwen.ai') ||
            currentSearch.includes('utm_source=qwen') ||
            currentSearch.includes('utm_source=tongyi')
        ) {
            return whereWasIFromOption.Qwen;
        }

        // 讯飞星火 (Spark)
        if (
            lowerReferrer.includes('xinghuo.xfyun.cn') ||
            lowerReferrer.includes('xfyun.cn') ||
            currentSearch.includes('utm_source=spark') ||
            currentSearch.includes('utm_source=xinghuo')
        ) {
            return whereWasIFromOption.Spark;
        }

        return whereWasIFromOption.Other;

    } catch (e) {
        return whereWasIFromOption.Other;
    }
}

// 获取当前路径和查询的哈希值
export function getHashOfCurrentPath() {
    const uri = getCleanRequestUri();
    return fnv1a32(uri);
}

// 获取当前网站的TTFB和PLT的数值
// 单位是10ms，范围是[0,252]
// 253代表大于或者等于 2.53 秒
// 254代表无需采集（spa虚拟路由时的情况）
// 255代表采集失败
let isFirstCall = true;
export async function getPerformanceMetrics() {
    // 如果是 SPA 的伪路由切换，直接返回 254
    if (!isFirstCall) {
        return { ttfb: 254, plt: 254 };
    }
    isFirstCall = false;
    // 判断页面是否加载完成
    if (document.readyState !== 'complete') {
        // 页面还没加载完成，等待 load 事件后再采集
        await new Promise<void>((resolve) => {
            window.addEventListener('load', () => resolve(), { once: true });
        });
    }

    // 延迟一个宏任务，确保浏览器把 loadEventEnd 字段写进去
    await new Promise(resolve => setTimeout(resolve, 50));

    if (window.performance && window.performance.getEntriesByType) {
        const entries = window.performance.getEntriesByType('navigation');
        if (entries && entries.length > 0) {
            const navEntry = entries[0] as PerformanceNavigationTiming;
            // 原始值单位是毫秒，除以10转换为10ms单位
            let ttfb = (navEntry.responseStart - navEntry.requestStart) / 10; // TTFB
            let plt = navEntry.loadEventEnd / 10; // PLT

            ttfb = Math.max(0, Math.min(253, Math.ceil(ttfb)));
            plt = Math.max(0, Math.min(253, Math.ceil(plt)));
            // 这两个指标不应该为0，如果是0的话警告一下
            if (ttfb === 0 || plt === 0) {
                console.warn("[Jekit] Performance metrics TTFB or PLT is 0, which may indicate an issue with the performance API.", { ttfb, plt });
            }
            return { ttfb, plt };
        }
    }
    return { ttfb: 255, plt: 255 };
}

// 检测当前浏览器类型
export function getWhichBrowser(): whichBrowserOption {
    const ua = navigator.userAgent;

    // 注意：Edge 的 UA 中同时包含 Edg 和 Chrome，优先判断 Edge
    if (ua.indexOf('Edg') !== -1) {
        return whichBrowserOption.Edge;
    }
    // Opera 的 UA 中包含 OPR
    if (ua.indexOf('OPR') !== -1 || ua.indexOf('Opera') !== -1) {
        return whichBrowserOption.Opera;
    }
    // 微信内置浏览器
    if (ua.indexOf('MicroMessenger') !== -1) {
        return whichBrowserOption.WeChat;
    }
    // 360 浏览器
    if (ua.indexOf('QIHU') !== -1 || ua.indexOf('360EE') !== -1 || ua.indexOf('360SE') !== -1) {
        return whichBrowserOption.Browser360;
    }
    // Chrome 的 UA 中包含 Chrome 但不包含 Edg/OPR
    if (ua.indexOf('Chrome') !== -1) {
        return whichBrowserOption.Chrome;
    }
    // Safari 的 UA 中包含 Safari 但不包含 Chrome
    if (ua.indexOf('Safari') !== -1) {
        return whichBrowserOption.Safari;
    }
    // Firefox 的 UA 中包含 Firefox
    if (ua.indexOf('Firefox') !== -1) {
        return whichBrowserOption.Firefox;
    }

    return whichBrowserOption.Other;
}

// 检测当前操作系统类型
export function getWhichOS(): whichOsOption {
    const ua = navigator.userAgent;

    // 鸿蒙系统优先检测（部分鸿蒙设备 UA 也包含 Android 或 Linux 标记）
    if (ua.indexOf('HarmonyOS') !== -1 || ua.indexOf('OpenHarmony') !== -1) {
        return whichOsOption.HarmonyOS;
    }
    // Windows
    if (ua.indexOf('Windows') !== -1 || ua.indexOf('Win') !== -1) {
        return whichOsOption.Windows;
    }
    // macOS（注意区分 iOS）
    if (ua.indexOf('Macintosh') !== -1 || ua.indexOf('Mac OS') !== -1) {
        return whichOsOption.MacOS;
    }
    // iOS（iPhone / iPad / iPod）
    if (ua.indexOf('iPhone') !== -1 || ua.indexOf('iPad') !== -1 || ua.indexOf('iPod') !== -1) {
        return whichOsOption.iOS;
    }
    // Android
    if (ua.indexOf('Android') !== -1) {
        return whichOsOption.Android;
    }
    // Linux（不含 Android）
    if (ua.indexOf('Linux') !== -1) {
        return whichOsOption.Linux;
    }

    return whichOsOption.Other;
}

// 判断当前环境是否是机器人
export function isBotEnvironment(): boolean {
    if (!navigator || !navigator.userAgent) {
        return true;
    }

    const ua = navigator.userAgent.toLowerCase();
    const botKeywords = ['bot', 'spider', 'crawler', 'slurp', 'archiver'];

    return botKeywords.some(keyword => ua.includes(keyword));
}
