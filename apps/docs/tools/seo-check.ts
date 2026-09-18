import fs from "node:fs/promises";
import path from "node:path";
import { scanSiteRoutes } from "./site-routes";

const distDir = path.resolve("dist");
const siteOrigin = "https://jekit.cn";

function count(html: string, pattern: RegExp): number {
    return Array.from(html.matchAll(pattern)).length;
}

function matchContent(html: string, pattern: RegExp): string {
    return html.match(pattern)?.[1]?.trim() ?? "";
}

function outputFileForRoute(routePath: string): string {
    return path.join(distDir, routePath, "index.html");
}

async function main() {
    const routes = (await scanSiteRoutes()).filter((route) => route.indexable);
    const problems: string[] = [];

    for (const route of routes) {
        const outputFile = outputFileForRoute(route.path);
        let html = "";
        try {
            html = await fs.readFile(outputFile, "utf-8");
        } catch {
            problems.push(`${route.path}: 缺少预渲染文件 ${outputFile}`);
            continue;
        }

        const title = matchContent(html, /<title>([\s\S]*?)<\/title>/i);
        const description = matchContent(
            html,
            /<meta\s+name="description"\s+content="([^"]*)"/i,
        );
        const canonical = matchContent(
            html,
            /<link\s+rel="canonical"\s+href="([^"]+)"/i,
        );
        const ogImage = matchContent(
            html,
            /<meta\s+property="og:image"\s+content="([^"]+)"/i,
        );

        if (!/<html\s+lang="zh-CN"/i.test(html)) problems.push(`${route.path}: 缺少 lang="zh-CN"`);
        if (!title) problems.push(`${route.path}: 缺少 title`);
        if (!description) problems.push(`${route.path}: 缺少 meta description`);
        if (!canonical.startsWith(siteOrigin)) problems.push(`${route.path}: canonical 不是站内绝对地址`);
        if (!ogImage.startsWith("https://")) problems.push(`${route.path}: og:image 不是 HTTPS 绝对地址`);
        if (count(html, /<h1\b/gi) !== 1) problems.push(`${route.path}: 应当且只能有一个 H1`);
        if (!/<meta\s+property="og:title"/i.test(html)) problems.push(`${route.path}: 缺少 og:title`);
        if (!/<meta\s+property="og:description"/i.test(html)) problems.push(`${route.path}: 缺少 og:description`);
        if (!/<meta\s+name="twitter:title"/i.test(html)) problems.push(`${route.path}: 缺少 twitter:title`);
        if (!/<meta\s+name="twitter:description"/i.test(html)) problems.push(`${route.path}: 缺少 twitter:description`);
        if (!/<meta\s+name="twitter:image"/i.test(html)) problems.push(`${route.path}: 缺少 twitter:image`);
        if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) {
            problems.push(`${route.path}: sitemap 页面不能设置 noindex`);
        }

        const jsonLdBlocks = Array.from(
            html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi),
            (match) => match[1],
        );
        if (jsonLdBlocks.length === 0) problems.push(`${route.path}: 缺少 JSON-LD`);
        for (const json of jsonLdBlocks) {
            try {
                JSON.parse(json);
            } catch {
                problems.push(`${route.path}: JSON-LD 无法解析`);
            }
        }

        if (route.type === "blog") {
            if (!/<meta\s+property="article:published_time"/i.test(html)) {
                problems.push(`${route.path}: 博客缺少 article:published_time`);
            }
            if (!/<meta\s+property="article:modified_time"/i.test(html)) {
                problems.push(`${route.path}: 博客缺少 article:modified_time`);
            }
        }
    }

    const sitemap = await fs.readFile(path.join(distDir, "sitemap.xml"), "utf-8");
    const sitemapUrls = new Set(
        Array.from(sitemap.matchAll(/<loc>(.*?)<\/loc>/g), (match) => match[1]),
    );
    const expectedUrls = new Set(routes.map((route) => siteOrigin + route.path));
    for (const url of expectedUrls) {
        if (!sitemapUrls.has(url)) problems.push(`sitemap 缺少 ${url}`);
    }
    for (const url of sitemapUrls) {
        if (!expectedUrls.has(url)) problems.push(`sitemap 包含未预渲染地址 ${url}`);
    }

    const robots = await fs.readFile(path.join(distDir, "robots.txt"), "utf-8");
    if (!robots.includes(`Sitemap: ${siteOrigin}/sitemap.xml`)) {
        problems.push("robots.txt 没有声明正式 sitemap 地址");
    }

    if (problems.length > 0) {
        throw new Error(`SEO 构建检查失败：\n  ${problems.join("\n  ")}`);
    }

    console.log(`✅ SEO 构建检查通过，共检查 ${routes.length} 个页面`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
