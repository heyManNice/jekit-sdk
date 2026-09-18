import { DEFAULT_OG_IMAGE, GITHUB_REPO, SITE_NAME, SITE_ORIGIN } from "@/config/site";
import type { StructuredData } from "./meta";

const organizationId = `${SITE_ORIGIN}/#organization`;
const siteLogo = `${SITE_ORIGIN}/favicon.ico`;

function publisher() {
    return {
        "@type": "Organization",
        "@id": organizationId,
        name: SITE_NAME,
        url: SITE_ORIGIN,
        logo: siteLogo,
    };
}

export function homeStructuredData(): StructuredData {
    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": organizationId,
                name: SITE_NAME,
                url: SITE_ORIGIN,
                logo: siteLogo,
                sameAs: [GITHUB_REPO],
            },
            {
                "@type": "WebSite",
                "@id": `${SITE_ORIGIN}/#website`,
                name: SITE_NAME,
                url: SITE_ORIGIN,
                publisher: { "@id": organizationId },
                inLanguage: "zh-CN",
            },
            {
                "@type": "SoftwareApplication",
                name: "Jekit",
                url: SITE_ORIGIN,
                applicationCategory: "WebApplication",
                operatingSystem: "Web",
                description: "免费、开源、无 Cookie 的网站访问统计工具。",
                offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "CNY",
                },
                publisher: { "@id": organizationId },
            },
        ],
    };
}

export function blogStructuredData(entries: Array<{
    title: string;
    description: string;
    filename: string;
}>): StructuredData {
    return {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: "Jekit 博客",
        description: "Jekit 关于网站统计、隐私设计和前端开发的技术博客。",
        url: `${SITE_ORIGIN}/blogs/`,
        publisher: publisher(),
        blogPost: entries.map((entry) => ({
            "@type": "BlogPosting",
            headline: entry.title,
            description: entry.description,
            url: `${SITE_ORIGIN}/blogs/${entry.filename.replace(/\.md$/, "")}/`,
        })),
    };
}

export function blogPostStructuredData(entry: {
    title: string;
    description: string;
    filename: string;
    image?: string | null;
    publishedDate?: string;
    modifiedDate?: string;
    keywords?: string;
    section?: string;
}): StructuredData {
    const path = `/blogs/${entry.filename.replace(/\.md$/, "")}/`;
    return {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: entry.title,
        description: entry.description,
        image: new URL(entry.image || DEFAULT_OG_IMAGE, SITE_ORIGIN).href,
        datePublished: entry.publishedDate || undefined,
        dateModified: entry.modifiedDate || undefined,
        keywords: entry.keywords || undefined,
        articleSection: entry.section || undefined,
        mainEntityOfPage: `${SITE_ORIGIN}${path}`,
        publisher: publisher(),
        inLanguage: "zh-CN",
    };
}

export function docStructuredData(entry: {
    title: string;
    description: string;
    subPath: string;
    date: string;
    modifiedDate: string;
    section?: string;
}): StructuredData {
    const pageUrl = `${SITE_ORIGIN}/docs/${entry.subPath}/`;
    const breadcrumbItems: Array<{ name: string; item?: string }> = [
        { name: "首页", item: `${SITE_ORIGIN}/` },
        { name: "文档", item: `${SITE_ORIGIN}/docs/` },
        ...(entry.section ? [{ name: entry.section }] : []),
        { name: entry.title, item: pageUrl },
    ];

    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "TechArticle",
                headline: entry.title,
                description: entry.description,
                dateModified: entry.modifiedDate,
                mainEntityOfPage: pageUrl,
                publisher: publisher(),
                inLanguage: "zh-CN",
            },
            {
                "@type": "BreadcrumbList",
                itemListElement: breadcrumbItems.map((item, index) => ({
                    "@type": "ListItem",
                    position: index + 1,
                    name: item.name,
                    ...(item.item ? { item: item.item } : {}),
                })),
            },
        ],
    };
}

export function statsStructuredData(): StructuredData {
    return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "网站访问统计查询",
        description: "查询已接入 Jekit 的网站访问量趋势、来源渠道、运行环境和网站性能指标。",
        url: `${SITE_ORIGIN}/stats/`,
        isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
        inLanguage: "zh-CN",
    };
}
