import fs from "node:fs/promises";
import path from "node:path";
import { scanSiteRoutes } from "./site-routes";

const siteOrigin = "https://jekit.cn";
const outputFile = path.resolve("dist/sitemap.xml");

function escapeXml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}

async function main() {
    const routes = (await scanSiteRoutes()).filter((route) => route.indexable);
    const urls = routes.map((route) => {
        const lastmod = route.lastmod
            ? `\n        <lastmod>${escapeXml(route.lastmod)}</lastmod>`
            : "";
        return `    <url>\n        <loc>${escapeXml(siteOrigin + route.path)}</loc>${lastmod}\n    </url>`;
    });

    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls,
        '</urlset>',
        '',
    ].join("\n");

    await fs.writeFile(outputFile, xml, "utf-8");
    console.log(`✅ 已生成 ${outputFile}，共 ${routes.length} 个 URL`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
