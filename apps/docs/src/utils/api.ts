import { useState, useEffect, useCallback, useRef } from 'react';

// 封装一个react hook，来处理api请求
export function useApi<T>(reqCallback: () => Promise<T>) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    // 用 ref 持有最新回调，避免内联调用时无限重发请求
    const reqCallbackRef = useRef(reqCallback);
    reqCallbackRef.current = reqCallback;

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await reqCallbackRef.current();
            setData(result);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, update: fetchData };
};