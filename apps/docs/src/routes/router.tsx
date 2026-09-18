import { type RouteObject, createBrowserRouter } from "react-router";
import { AppLayout } from "@/layouts/app-layout";
import { DocsLayout } from "@/layouts/docs-layout";
import { pageFileToRoute } from "@/content/routes";

// 页面和对应的loader映射
const routeModules: Record<string, () => Promise<{ default: React.ComponentType }>> = {};

// 预先加载一个路由模块
export function preload(routePath: string) {
    if (routeModules[routePath]) {
        routeModules[routePath]();
    }
}

// 创建浏览器路由器。
// 当页面存在预渲染 HTML 时，需要避免首次渲染触发“水合回退”，
// 否则在懒加载模块期间，预渲染的 DOM 会被替换或清空。
// 因此，我们会预先加载“当前”路由模块，并将初始路径注册为普通的
// `Component` 路由（不使用 `lazy`）。
export async function createAppRouter() {
    // AppLayout 路由（首页、统计、博客等）
    const appLayout: RouteObject = {
        Component: AppLayout,
        children: []
    };
    const appChildren = appLayout.children as RouteObject[];

    // DocsLayout 路由（文档页，与 AppLayout 平级）
    const docsLayout: RouteObject = {
        path: "/docs",
        Component: DocsLayout,
        children: []
    };
    const docsChildren = docsLayout.children as RouteObject[];

    const modules = import.meta.glob<{ default: React.ComponentType }>(
        "/src/pages/**/page.tsx"
    );

    for (const [moduleKey, loader] of Object.entries(modules)) {
        const routePath = pageFileToRoute(moduleKey);

        routeModules[routePath] = loader;

        // /docs/ 路由归入 DocsLayout
        if (routePath === "/docs/") {
            const isCurrentPath = location.pathname === routePath;

            // index 路由（匹配 /docs 精确路径）
            docsChildren.push(
                isCurrentPath
                    ? { index: true, Component: (await loader()).default }
                    : {
                        index: true,
                        lazy: async () => {
                            const mod = await loader();
                            return { Component: mod.default };
                        }
                    }
            );

            // /docs/* 子路由（匹配 /docs/intro/what-this-is 等）
            docsChildren.push({
                path: "*",
                lazy: async () => {
                    const mod = await loader();
                    return { Component: mod.default };
                }
            });
            continue;
        }

        // 其他路由归入 AppLayout
        if (routePath === location.pathname) {
            const mod = await loader();
            appChildren.push({
                path: routePath,
                Component: mod.default
            });
        } else {
            appChildren.push({
                path: routePath,
                lazy: async () => {
                    const mod = await loader();
                    return { Component: mod.default };
                }
            });
        }
    }

    // 博客文章详情页（动态路由）
    appChildren.push({
        path: "/blogs/:filename",
        lazy: async () => {
            const mod = await import(
                "@/pages/blogs/views/BlogDetail"
            );
            return { Component: mod.default };
        },
    });

    // AppLayout 的 404 兜底
    appChildren.push({
        path: "*",
        element: <p className="text-center">404 Not Found</p>
    });

    return createBrowserRouter([docsLayout, appLayout]);
}
