// 判断当前设备是否为手机端。
//
// - 优先检查 `navigator.maxTouchPoints`（触屏设备）
// - 同时检查屏幕宽度 ≤ 768px
// - 兜底匹配 User-Agent 中的移动端关键词
export function isMobileDevice(): boolean {
    if (typeof window === "undefined") return false;

    const isTouch = navigator.maxTouchPoints > 0;
    const isNarrow = window.innerWidth <= 768;

    if (isTouch && isNarrow) return true;

    // User-Agent 兜底
    const ua = navigator.userAgent.toLowerCase();
    return /android|iphone|ipod|webos|iemobile|opera mini|blackberry/i.test(ua);
}
