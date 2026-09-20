import {
    describe,
    expect,
    it,
    vi,
} from 'vitest';

const mocks = vi.hoisted(() => ({
    spaGreet: vi.fn(),
}));

vi.mock('jekit-core', () => ({
    spaGreet: mocks.spaGreet,
}));

import { initJekitReact } from '../store';

describe('initJekitReact 多消费者生命周期', () => {
    it('最后一位消费者卸载时才停止共享监听', () => {
        const stop = vi.fn();
        mocks.spaGreet.mockReturnValueOnce(stop);

        const releaseFirst = initJekitReact({});
        const releaseSecond = initJekitReact({});

        expect(mocks.spaGreet).toHaveBeenCalledOnce();

        releaseFirst();
        expect(stop).not.toHaveBeenCalled();

        releaseSecond();
        expect(stop).toHaveBeenCalledOnce();

        // React Strict Mode 等场景可能重复执行清理，必须保持幂等。
        releaseSecond();
        expect(stop).toHaveBeenCalledOnce();
    });
});
