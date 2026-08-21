import {
    Outlet,
    useNavigation
} from "react-router";
import { Header } from "@/views/header";
import { Footer } from "@/views/footer";
import {
    useRef
} from "react";

import { usePageEnterAnimation } from "@/hooks/use-page-enter-animation";

export function AppLayout() {
    const navigation = useNavigation();
    const isPageLoading = navigation.state === "loading";

    const mainRef = useRef<HTMLElement>(null);
    // 页面切换：滚动到顶部 + 内容滑入动画
    usePageEnterAnimation(mainRef);

    return (
        <>
            <Header />
            {isPageLoading &&
                <div className="loading-overlay" />
            }
            <main ref={mainRef} className="max-w-6xl mx-auto pb-12">
                <Outlet />
            </main>
            <Footer />
        </>
    );
}