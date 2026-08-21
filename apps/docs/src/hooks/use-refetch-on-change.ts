import {
    useEffect,
    useRef,
} from "react";

// 监听 deps 变化时调用 refetch（跳过首次挂载）。
// 用于"切换查询参数后重新请求数据"的统一模式。
export function useRefetchOnChange(
    refetch: () => void,
    deps: readonly unknown[],
) {
    const isFirst = useRef(true);

    useEffect(() => {
        if (isFirst.current) {
            isFirst.current = false;
            return;
        }
        refetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}
