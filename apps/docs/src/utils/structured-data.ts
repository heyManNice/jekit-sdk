import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_ORIGIN, type StructuredData } from "./meta";

const organizationId = `${SITE_ORIGIN}/#organization`;

function publisher() {
    return {
        "@type": "Organization",
        "@id": organizationId,
        name: SITE_NAME,
        url: SITE_ORIGIN,
        logo: DEFAULT_OG_IMAGE,
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
                logo: DEFAULT_OG_IMAGE,
                sameAs: ["https://github.com/heyManNice/jekit-sdk"],
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
                dateModified: entry.date.slice(0, 10),
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
