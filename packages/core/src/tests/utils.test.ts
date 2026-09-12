import {
    describe,
    it,
    expect,
    afterEach,
} from 'vitest';

import {
    normalizePageUri,
    getHashOfPagePath,
} from '@/utils/uri';
import { getHashOfCurrentPath } from '@/utils/ctx';

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

describe('utils/uri 页面标识归一化', () => {
    describe('查询参数', () => {
        it('没有查询参数时保持原样', () => {
            expect(normalizePageUri('/hello')).toBe('/hello');
        });

        it('忽略白名单之外的全部查询参数', () => {
            expect(normalizePageUri('/hello?a=1&b=2')).toBe('/hello');
        });

        it('忽略追踪参数', () => {
            expect(normalizePageUri('/hello?utm_source=google&utm_medium=cpc')).toBe('/hello');
        });

        it('忽略来源与分享参数', () => {
            expect(normalizePageUri('/hello?from=wechat&spm=abc&ref=weibo')).toBe('/hello');
        });

        it('忽略分页与排序参数', () => {
            expect(normalizePageUri('/list?page=2&sort=asc')).toBe('/list');
        });

        it('忽略搜索词参数', () => {
            expect(normalizePageUri('/search?q=x&s=y&keyword=z')).toBe('/search');
        });

        it('忽略歧义参数 p', () => {
            expect(normalizePageUri('/x?p=123')).toBe('/x');
        });

        it('保留白名单内的内容参数，并剔除其余参数', () => {
            expect(normalizePageUri('/article?id=1&utm_source=x')).toBe('/article?id=1');
        });

        it('多个白名单参数按顺序规范化，与书写顺序无关', () => {
            expect(normalizePageUri('/x?tid=2&id=1&utm_source=x')).toBe('/x?id=1&tid=2');
        });

        it('保留同名参数的多个值', () => {
            expect(normalizePageUri('/x?id=1&id=2')).toBe('/x?id=1&id=2');
        });

        it('白名单参数没有值时保留空值', () => {
            expect(normalizePageUri('/x?id=')).toBe('/x?id=');
        });
    });

    describe('hash', () => {
        it('忽略纯锚点', () => {
            expect(normalizePageUri('/hello#section')).toBe('/hello');
        });

        it('忽略中文锚点', () => {
            expect(normalizePageUri('/hello#注释-1')).toBe('/hello');
        });

        it('计入以斜杠开头的路由', () => {
            expect(normalizePageUri('/hello#/route')).toBe('/hello#/route');
        });

        it('计入 hashbang 路由', () => {
            expect(normalizePageUri('/hello#!/route/1')).toBe('/hello#!/route/1');
        });

        it('计入不含前导斜杠但含斜杠的路由', () => {
            expect(normalizePageUri('/hello#post/1')).toBe('/hello#post/1');
        });

        it('既有查询参数又有纯锚点时，只忽略锚点', () => {
            expect(normalizePageUri('/hello?id=1#section')).toBe('/hello?id=1');
        });

        it('路由内的查询参数同样按白名单过滤', () => {
            expect(normalizePageUri('/hello#/route?utm_source=x&id=1'))
                .toBe('/hello#/route?id=1');
        });

        it('路由内未命中白名单时只剩路由', () => {
            expect(normalizePageUri('/hello#/route?utm_source=x')).toBe('/hello#/route');
        });
    });

    describe('页面标识哈希', () => {
        it('白名单参数相同则哈希相同', () => {
            expect(getHashOfPagePath('/hello?id=1&a=2'))
                .toBe(getHashOfPagePath('/hello?id=1'));
        });

        it('白名单参数不同则哈希不同', () => {
            expect(getHashOfPagePath('/hello?id=1'))
                .not.toBe(getHashOfPagePath('/hello?id=2'));
        });

        it('不同路径得到不同哈希', () => {
            expect(getHashOfPagePath('/a')).not.toBe(getHashOfPagePath('/b'));
        });
    });
});

describe('utils/ctx getHashOfCurrentPath', () => {
    const originalWindow = (globalThis as any).window;

    afterEach(() => {
        (globalThis as any).window = originalWindow;
    });

    it('纯锚点不影响当前页面标识', () => {
        setWindowLocation({ pathname: '/hello', search: '', hash: '' });
        const base = getHashOfCurrentPath();

        setWindowLocation({ pathname: '/hello', search: '', hash: '#section' });
        expect(getHashOfCurrentPath()).toBe(base);
    });

    it('路由 hash 影响当前页面标识', () => {
        setWindowLocation({ pathname: '/hello', search: '', hash: '#/route' });
        const routed = getHashOfCurrentPath();

        setWindowLocation({ pathname: '/hello', search: '', hash: '' });
        expect(getHashOfCurrentPath()).not.toBe(routed);
    });

    it('白名单之外的查询参数不影响当前页面标识', () => {
        setWindowLocation({ pathname: '/hello', search: '?utm_source=x', hash: '' });
        const withNoise = getHashOfCurrentPath();

        setWindowLocation({ pathname: '/hello', search: '', hash: '' });
        expect(getHashOfCurrentPath()).toBe(withNoise);
    });

    it('白名单之内的查询参数影响当前页面标识', () => {
        setWindowLocation({ pathname: '/article', search: '?id=1', hash: '' });
        const withId = getHashOfCurrentPath();

        setWindowLocation({ pathname: '/article', search: '?id=2', hash: '' });
        expect(getHashOfCurrentPath()).not.toBe(withId);
    });
});

