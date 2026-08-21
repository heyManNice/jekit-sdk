import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
} from 'vitest';

import {
    getCleanRequestUri,
} from '@/utils/uri';

type LocationLike = {
    pathname: string;
    search: string;
    hash: string;
};

function setWindowLocation(next: LocationLike) {
    (globalThis as any).window = {
        location: {
            pathname: next.pathname,
            search: next.search,
            hash: next.hash,
        },
    };
}

describe('utils/uri getCleanRequestUri', () => {
    const originalWindow = (globalThis as any).window;

    beforeEach(() => {
        setWindowLocation({
            pathname: '/p',
            search: '',
            hash: '',
        });
    });

    afterEach(() => {
        (globalThis as any).window = originalWindow;
    });

    it('不会修改不包含追踪参数的 search/hash', () => {
        setWindowLocation({
            pathname: '/hello',
            search: '?a=1&b=2',
            hash: '#section',
        });

        expect(getCleanRequestUri()).toBe('/hello?a=1&b=2#section');
    });

    it('会从 search 中移除已知追踪参数（保留其他参数）', () => {
        setWindowLocation({
            pathname: '/hello',
            search: '?utm_source=google&a=1&utm_medium=cpc&b=2',
            hash: '',
        });

        expect(getCleanRequestUri()).toBe('/hello?a=1&b=2');
    });

    it('当 search 只剩追踪参数时，search 变为空', () => {
        setWindowLocation({
            pathname: '/hello',
            search: '?utm_source=google&utm_medium=cpc',
            hash: '',
        });

        expect(getCleanRequestUri()).toBe('/hello');
    });

    it('会从 hash 中的 query（包含 ?）移除追踪参数', () => {
        setWindowLocation({
            pathname: '/hello',
            search: '',
            hash: '#/route?utm_source=google&a=1&utm_medium=cpc&b=2',
        });

        expect(getCleanRequestUri()).toBe('/hello#/route?a=1&b=2');
    });

    it('会从 hash 的参数串（不包含 ?）移除追踪参数', () => {
        setWindowLocation({
            pathname: '/hello',
            search: '',
            hash: '#utm_source=google&a=1&b=2',
        });

        expect(getCleanRequestUri()).toBe('/hello#a=1&b=2');
    });
});

