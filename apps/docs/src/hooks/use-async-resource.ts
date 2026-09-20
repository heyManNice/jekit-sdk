import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

export type AsyncStatus = "loading" | "success" | "error";

export interface AsyncResource<T> {
    data: T | null;
    status: AsyncStatus;
    loading: boolean;
    error: Error | null;
    refresh: () => void;
}

function toError(value: unknown): Error {
    return value instanceof Error ? value : new Error(String(value));
}

// 由稳定的资源 key 驱动请求。旧请求即使较晚返回，也不能覆盖新 key 的结果。
export function useAsyncResource<T>(key: string, load: () => Promise<T>): AsyncResource<T> {
    const loadRef = useRef(load);
    loadRef.current = load;

    const [refreshToken, setRefreshToken] = useState(0);
    const [state, setState] = useState<{
        data: T | null;
        status: AsyncStatus;
        error: Error | null;
    }>({ data: null, status: "loading", error: null });

    const refresh = useCallback(() => {
        setRefreshToken((value) => value + 1);
    }, []);

    useEffect(() => {
        let active = true;
        setState((previous) => ({ data: previous.data, status: "loading", error: null }));

        void loadRef.current().then(
            (data) => {
                if (!active) return;
                setState({ data, status: "success", error: null });
            },
            (error: unknown) => {
                if (!active) return;
                setState((previous) => ({
                    data: previous.data,
                    status: "error",
                    error: toError(error),
                }));
            },
        );

        return () => {
            active = false;
        };
    }, [key, refreshToken]);

    return {
        ...state,
        loading: state.status === "loading",
        refresh,
    };
}
