import {
    useLayoutEffect,
} from "react";
import type { RefObject } from "react";
import { useLocation } from "react-router";
import { isFirstLoad, markFirstLoadDone } from "@/utils/first-load";

// 页面切换时：滚动容器到顶部 + 内容从下方滑入。
// - scrollRef：需要滚动到顶部的容器（必填）
// - animateRef：执行滑入动画的元素（可选，默认与 scrollRef 相同）
export function usePageEnterAnimation(
    scrollRef: RefObject<HTMLElement | null>,
    animateRef?: RefObject<HTMLElement | null>,
) {
    const location = useLocation();

    useLayoutEffect(() => {
        scrollRef.current?.scrollTo(0, 0);

        // 跳过首屏的动画
        if (isFirstLoad) {
            markFirstLoadDone();
            return;
        }

        // 从下慢慢滑动上来
        (animateRef?.current ?? scrollRef.current)?.animate(
            [
                { transform: "translateY(30px)", opacity: 0 },
                { transform: "translateY(0)", opacity: 1 },
            ],
            {
                duration: 500,
                easing: "cubic-bezier(0.25, 0.1, 0.25, 1.0)",
            },
        );
    }, [location.pathname]);
}
