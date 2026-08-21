import { type RouteObject, createBrowserRouter } from "react-router";
import { AppLayout } from "@/layouts/app-layout";
import { DocsLayout } from "@/layouts/docs-layout";

// 页面和对应的loader映射
const routeModules: Record<string, () => Promise<{ default: React.ComponentType }>> = {};

// 预先加载一个路由模块
export function preload(routePath: string) {
    if (routeModules[routePath]) {
        routeModules[routePath]();
    }
}

// Create a browser router.
//
// When we have prerendered HTML, we want to avoid an initial "hydrate fallback"
// render that would replace/clear the prerendered DOM while lazy modules load.
// So we eagerly load the *current* route module and register it as a normal
// `Component` route (no `lazy`) for the initial path.
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
        const routePath = moduleKey.replace("/src/pages", "").replace("/page.tsx", "") + "/";

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
