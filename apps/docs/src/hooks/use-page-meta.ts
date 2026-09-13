import { useEffect } from "react";
import { setTitle } from "@/utils/title";
import type { PageMeta } from "@/utils/meta";

// 设置页面标题与元信息
// 副作用移入 effect，避免在渲染期执行 document.title / 读屏播报
export function usePageMeta({ title, description, image, type }: PageMeta) {
    useEffect(() => {
        setTitle({ title, description, image, type });
    }, [title, description, image, type]);
}
