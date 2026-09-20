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

import { initJekitVue } from '../store';

describe('initJekitVue 多消费者生命周期', () => {
    it('最后一位消费者卸载时才停止共享监听', () => {
        const stop = vi.fn();
        mocks.spaGreet.mockReturnValueOnce(stop);

        const releaseFirst = initJekitVue({});
        const releaseSecond = initJekitVue({});

        expect(mocks.spaGreet).toHaveBeenCalledOnce();

        releaseFirst();
        expect(stop).not.toHaveBeenCalled();

        releaseSecond();
        expect(stop).toHaveBeenCalledOnce();

        releaseSecond();
        expect(stop).toHaveBeenCalledOnce();
    });
});
