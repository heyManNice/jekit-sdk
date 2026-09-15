const BADGE_ORIGIN = 'https://badge.jekit.cn';
const nativeFetch = globalThis.fetch;

/** jekit-core 暂不接受自定义请求头，因此在 Worker 启动时统一补充 Origin。 */
globalThis.fetch = async function fetchWithBadgeOrigin(
    input: RequestInfo | URL,
    init?: RequestInit,
): Promise<Response> {
    const inputHeaders = input instanceof Request ? input.headers : undefined;
    const headers = new Headers(init?.headers ?? inputHeaders);

    if (!headers.has('Origin')) {
        headers.set('Origin', BADGE_ORIGIN);
    }

    // 保留原始 input 和 body。Bun 克隆带 0 字节 body 的 Request 时会将其
    // 改成空的 chunked 请求，部分代理会一直等待并最终重置连接。
    return nativeFetch(input, { ...init, headers });
};
