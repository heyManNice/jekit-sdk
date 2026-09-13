// 页面元信息（description / Open Graph）的唯一出口。
//
// 站点在构建时由 tools/render.ts 用真实 Chromium 渲染每个路由，再取
// page.content() 落盘，所以运行时写入的标签会原样进入预渲染 HTML，
// 不需要在 head 里做静态注入。

export const SITE_ORIGIN = "https://jekit.cn";
export const SITE_NAME = "Jekit 见客统计";
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/images/default-cover.webp`;

// 首页与没有单独描述的页面共用
export const DEFAULT_DESCRIPTION =
    "Jekit（见客统计）是一个开源、轻量的网站统计服务：无 Cookie、不记录 IP 与来源，" +
    "几行代码即可为 React、Vue 或任意网页接入访问统计。";

export interface PageMeta {
    title: string;
    // 省略时用 DEFAULT_DESCRIPTION
    description?: string;
    image?: string;
    type?: "website" | "article";
}

// 写入或更新一个 <meta>，不存在则创建
function upsertMeta(attr: "name" | "property", key: string, content: string) {
    let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);

    if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
    }

    el.setAttribute("content", content);
}

export function setPageMeta({ title, description, image, type = "website" }: PageMeta) {
    const summary = description || DEFAULT_DESCRIPTION;

    document.title = title;

    upsertMeta("name", "description", summary);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", summary);
    upsertMeta("property", "og:image", image || DEFAULT_OG_IMAGE);
    // 预渲染时页面跑在 localhost，所以用固定站点域名拼绝对地址，而不是 location.origin
    upsertMeta("property", "og:url", SITE_ORIGIN + window.location.pathname);
    upsertMeta("name", "twitter:card", "summary_large_image");
}
