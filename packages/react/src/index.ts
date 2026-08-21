import { useSyncExternalStore, useEffect } from 'react';
import {
    initJekitReact,
    jekitStore,
} from './store';
import type { JekitStats } from 'jekit-core';

export function useJekit(defaultText?: string) {
    useEffect(() => {
        return initJekitReact({
            defaultText
        });
    }, [defaultText]);

    return useSyncExternalStore(
        jekitStore.subscribe,
        jekitStore.getSnapshot
    ) as Readonly<JekitStats>;
}