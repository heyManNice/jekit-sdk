import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

const ioMocks = vi.hoisted(() => ({
    defineBuffer: vi.fn(() => new ArrayBuffer(0)),
    fetchResponse: vi.fn(),
}));

const ctxMocks = vi.hoisted(() => ({
    getHashOfCurrentPath: vi.fn(() => 1),
    getPerformanceMetrics: vi.fn(async () => ({ ttfb: 1, plt: 1 })),
    getVisitorStatus: vi.fn(() => 1),
    getWhichBrowser: vi.fn(() => 1),
    getWhichOS: vi.fn(() => 1),
    isBotEnvironment: vi.fn(() => false),
    whereWasIFrom: vi.fn(() => 1),
}));

vi.mock('@/utils/io', () => ioMocks);
vi.mock('@/utils/ctx', () => ctxMocks);

import {
    spaGreet,
    type GreetResult,
} from '@/api/greet';

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

describe('spaGreet 请求生命周期', () => {
    let testWindow: EventTarget;
    let testLocation: { href: string; origin: string };

    beforeEach(() => {
        vi.useFakeTimers();
        ioMocks.fetchResponse.mockReset();

        testWindow = new EventTarget();
        testLocation = {
            href: 'https://example.com/a',
            origin: 'https://example.com',
        };
        Object.defineProperty(globalThis, 'window', {
            configurable: true,
            value: testWindow,
        });
        Object.defineProperty(globalThis, 'location', {
            configurable: true,
            value: testLocation,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        Reflect.deleteProperty(globalThis, 'window');
        Reflect.deleteProperty(globalThis, 'location');
    });

    it('路由变化后立即丢弃防抖窗口内返回的旧响应', async () => {
        const first = deferred<GreetResult>();
        const second = deferred<GreetResult>();
        ioMocks.fetchResponse
            .mockReturnValueOnce(first.promise)
            .mockReturnValueOnce(second.promise);

        const onLoading = vi.fn();
        const onSuccess = vi.fn();
        const onError = vi.fn();
        const unsubscribe = spaGreet({ onLoading, onSuccess, onError });

        await vi.advanceTimersByTimeAsync(50);
        expect(ioMocks.fetchResponse).toHaveBeenCalledTimes(1);

        testLocation.href = 'https://example.com/b';
        testWindow.dispatchEvent(new Event('pushstate'));
        expect(onLoading).toHaveBeenCalledTimes(2);

        const staleResult = {} as GreetResult;
        first.resolve(staleResult);
        await vi.advanceTimersByTimeAsync(0);
        expect(onSuccess).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(50);
        const currentResult = {} as GreetResult;
        second.resolve(currentResult);
        await vi.advanceTimersByTimeAsync(0);
        expect(onSuccess).toHaveBeenCalledOnce();
        expect(onSuccess).toHaveBeenCalledWith(currentResult);
        expect(onError).not.toHaveBeenCalled();

        unsubscribe();
    });

    it('取消订阅后忽略已经发出但尚未返回的请求', async () => {
        const pending = deferred<GreetResult>();
        ioMocks.fetchResponse.mockReturnValueOnce(pending.promise);

        const onSuccess = vi.fn();
        const onError = vi.fn();
        const unsubscribe = spaGreet({
            onLoading: vi.fn(),
            onSuccess,
            onError,
        });

        await vi.advanceTimersByTimeAsync(50);
        unsubscribe();
        unsubscribe();

        pending.resolve({} as GreetResult);
        await vi.advanceTimersByTimeAsync(0);
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onError).not.toHaveBeenCalled();
    });
});
