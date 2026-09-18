// 页面元信息（description / Open Graph）的唯一出口。
//
// 站点在构建时由 tools/render.ts 用真实 Chromium 渲染每个路由，再取
// page.content() 落盘，所以运行时写入的标签会原样进入预渲染 HTML，
// 不需要在 head 里做静态注入。

export const SITE_ORIGIN = "https://jekit.cn";
export const SITE_NAME = "Jekit 见客统计";
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/images/default-cover.webp`;
export const DEFAULT_OG_IMAGE_WIDTH = "1226";
export const DEFAULT_OG_IMAGE_HEIGHT = "752";

// 首页与没有单独描述的页面共用
export const DEFAULT_DESCRIPTION =
    "Jekit（见客统计）是一个免费、开源、无 Cookie 的网站访问统计工具，可通过 React、Vue 或 CDN 快速接入，查看访问量、访客数、来源渠道和网站性能指标。";

export type StructuredData = Record<string, unknown> | Record<string, unknown>[];

export interface PageMeta {
    title: string;
    // SPA 路由切换时播报的简短页面名称，避免把营销型 SEO 标题完整读出。
    announcement?: string;
    // 省略时用 DEFAULT_DESCRIPTION
    description?: string;
    image?: string;
    type?: "website" | "article";
    publishedTime?: string;
    modifiedTime?: string;
    articleSection?: string;
    articleTags?: string[];
    structuredData?: StructuredData;
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

function removeMeta(attr: "name" | "property", key: string) {
    document.head.querySelector(`meta[${attr}="${key}"]`)?.remove();
}

function replaceMetaList(attr: "name" | "property", key: string, values: string[]) {
    document.head.querySelectorAll(`meta[${attr}="${key}"]`).forEach((el) => el.remove());
    for (const value of values) {
        const el = document.createElement("meta");
        el.setAttribute(attr, key);
        el.setAttribute("content", value);
        document.head.appendChild(el);
    }
}

function upsertCanonical(href: string) {
    let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!el) {
        el = document.createElement("link");
        el.rel = "canonical";
        document.head.appendChild(el);
    }
    el.href = href;
}

function setStructuredData(data?: StructuredData) {
    const id = "page-structured-data";
    let el = document.head.querySelector<HTMLScriptElement>(`script#${id}`);

    if (!data) {
        el?.remove();
        return;
    }

    if (!el) {
        el = document.createElement("script");
        el.id = id;
        el.type = "application/ld+json";
        document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data).replaceAll("<", "\\u003c");
}

function absoluteUrl(value: string): string {
    return new URL(value, SITE_ORIGIN).href;
}

export function setPageMeta({
    title,
    description,
    image,
    type = "website",
    publishedTime,
    modifiedTime,
    articleSection,
    articleTags,
    structuredData,
}: PageMeta) {
    const summary = description || DEFAULT_DESCRIPTION;
    const pageUrl = SITE_ORIGIN + window.location.pathname;
    const imageUrl = absoluteUrl(image || DEFAULT_OG_IMAGE);

    document.title = title;

    upsertMeta("name", "description", summary);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:locale", "zh_CN");
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", summary);
    upsertMeta("property", "og:image", imageUrl);
    upsertMeta("property", "og:image:width", DEFAULT_OG_IMAGE_WIDTH);
    upsertMeta("property", "og:image:height", DEFAULT_OG_IMAGE_HEIGHT);
    // 预渲染时页面跑在 localhost，所以用固定站点域名拼绝对地址，而不是 location.origin
    upsertMeta("property", "og:url", pageUrl);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", summary);
    upsertMeta("name", "twitter:image", imageUrl);
    upsertCanonical(pageUrl);

    if (type === "article" && publishedTime) {
        upsertMeta("property", "article:published_time", publishedTime);
    } else {
        removeMeta("property", "article:published_time");
    }
    if (type === "article" && modifiedTime) {
        upsertMeta("property", "article:modified_time", modifiedTime);
    } else {
        removeMeta("property", "article:modified_time");
    }
    if (type === "article" && articleSection) {
        upsertMeta("property", "article:section", articleSection);
    } else {
        removeMeta("property", "article:section");
    }
    replaceMetaList("property", "article:tag", type === "article" ? articleTags ?? [] : []);

    setStructuredData(structuredData);
}
