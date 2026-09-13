import {
    useLayoutEffect,
} from "react";
import type { RefObject } from "react";
import { useLocation } from "react-router";
import { isFirstLoad, markFirstLoadDone } from "@/utils/first-load";

// 页面切换时：窗口滚动回顶部 + 内容从下方滑入。
// - pageRef：页面容器，作为默认的滑入动画目标（必填）
// - animateRef：需要单独指定动画元素时传入（可选，默认与 pageRef 相同）
export function usePageEnterAnimation(
    pageRef: RefObject<HTMLElement | null>,
    animateRef?: RefObject<HTMLElement | null>,
) {
    const location = useLocation();

    useLayoutEffect(() => {
        // 真正滚动的是 window：pageRef 指向的 main 元素没有 overflow，
        // 对那个元素调 scrollTo 是空操作，切页后滚动位置不会回到顶部。
        window.scrollTo(0, 0);

        // 跳过首屏的动画
        if (isFirstLoad) {
            markFirstLoadDone();
            return;
        }

        // 从下慢慢滑动上来
        (animateRef?.current ?? pageRef.current)?.animate(
            [
                { transform: "translateY(30px)", opacity: 0 },
                { transform: "translateY(0)", opacity: 1 },
            ],
            {
                duration: 500,
                easing: "cubic-bezier(0.25, 0.1, 0.25, 1.0)",
            },
        );
        // pageRef / animateRef 的引用是稳定的，放进依赖数组只是为了满足 exhaustive-deps，不会造成额外触发
    }, [location.pathname, pageRef, animateRef]);
}
