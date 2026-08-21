import { type JekitStats } from 'jekit-core';
import {
    useJekitStore,
} from './store';

export {
    type JekitStats,
};

export function useJekit(defaultText?: string) {
    return useJekitStore({
        defaultText,
    });
}
