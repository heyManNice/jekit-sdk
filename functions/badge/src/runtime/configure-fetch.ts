const BADGE_ORIGIN = 'https://badge.jekit.cn';
const nativeFetch = globalThis.fetch;

/** jekit-core 暂不接受自定义请求头，因此在 Worker 启动时统一补充 Origin。 */
globalThis.fetch = async function fetchWithBadgeOrigin(
    input: RequestInfo | URL,
    init?: RequestInit,
): Promise<Response> {
    const request = new Request(input, init);
    const headers = new Headers(request.headers);

    if (!headers.has('Origin')) {
        headers.set('Origin', BADGE_ORIGIN);
    }

    return nativeFetch(new Request(request, { headers }));
};
