import { useEffect } from "react";
import { setTitle } from "@/utils/title";

// 设置页面标题（副作用移入 effect，避免在渲染期执行 document.title / 读屏播报）
export function usePageTitle(title: string) {
    useEffect(() => {
        setTitle(title);
    }, [title]);
}
