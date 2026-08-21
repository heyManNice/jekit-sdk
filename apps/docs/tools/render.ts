import fg from "fast-glob";
import fs from "node:fs/promises";
import path from "node:path";
import {
    chromium,
    Browser,
    Page
} from "playwright";
import { minify } from "html-minifier-terser";
import { preview } from "vite";

const port = 5178;
const tempDir = path.join("node_modules/.render");
const distDir = path.join("dist");

async function scanPages(): Promise<string[]> {
    const files = await fg("src/pages/**/page.tsx");
    const routes = files.map((file) => {
        const route =
            file.replace("src/pages", "")
                .replace("/page.tsx", "") + "/";

        return route;
    });

    // 扫描文档 markdown 内容页
    const mdFiles = await fg("src/pages/docs/content/*/*.md", {
        ignore: ["**/sidebar.md"]
    });
    for (const file of mdFiles) {
        const route = "/docs/" + file
            .replace("src/pages/docs/content/", "")
            .replace(/\.md$/, "") + "/";
        routes.push(route);
    }

    // 扫描博客 markdown 内容页
    const blogFiles = await fg("src/pages/blogs/content/**/*.md");
    for (const file of blogFiles) {
        const filename = file.split("/").pop()?.replace(/\.md$/, "") ?? "";
        routes.push(`/blogs/${filename}`);
    }

    return routes;
}

// 将预览服务器产生的绝对 URL 归一化为根相对路径，
// 消除运行时动态 modulepreload 注入的 http://localhost:5178/... 链接
// （如 <link rel="modulepreload" as="script" href="http://localhost:5178/_/x.js">）
function normalizeLocalhostUrls(html: string): string {
    return html.replaceAll(`http://localhost:${port}/`, "/");
}

async function formatHtml(html: string): Promise<string> {
    return await minify(html, {
        removeComments: true,
        collapseWhitespace: true,
        conservativeCollapse: true,
        collapseInlineTagWhitespace: true,
        removeRedundantAttributes: true,
        removeEmptyAttributes: true,
        sortAttributes: false,
        sortClassName: false
    });
}

async function renderAll(): Promise<void> {
    const browser: Browser = await chromium.launch();
    const page: Page = await browser.newPage();

    // 阻止非本地资源
    await page.route('**/*', route => {
        const requestUrl = new URL(route.request().url());
        if (requestUrl.hostname !== 'localhost') {
            route.abort();
        } else {
            route.continue();
        }
    });

    const routes = await scanPages();

    for (const route of routes) {
        const url = `http://localhost:${port}${route}`;
        await page.goto(url, { waitUntil: "networkidle" });
        const html = await page.content();
        // 先归一化绝对 URL，再做压缩
        await writeToDist(route, await formatHtml(normalizeLocalhostUrls(html)));
    }
    await browser.close();
}

async function writeToDist(route: string, html: string): Promise<void> {
    const outDir = path.join(tempDir, route);
    const file = path.join(outDir, "index.html");

    await fs.mkdir(outDir, { recursive: true });
    console.log(`${file}`);
    await fs.writeFile(file, html, "utf-8");
}


async function main() {
    // 开启服务器
    console.log("Starting server.");
    const server = await preview({
        root: process.cwd(),
        preview: {
            port,
            host: true,
            strictPort: true
        }
    });

    await renderAll();
    await server.close();
    console.log("Close server.");
    // 将渲染结果复制到 dist 目录
    await fs.cp(tempDir, distDir, { recursive: true });
    // 清理目录
    await fs.rm(tempDir, { recursive: true });
    console.log("Move rendered files to dist.");
    console.log("Done.");
}
main();