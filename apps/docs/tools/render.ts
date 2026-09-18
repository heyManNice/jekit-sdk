import fs from "node:fs/promises";
import path from "node:path";
import {
    chromium,
    Browser,
    Page
} from "playwright";
import { minify } from "html-minifier-terser";
import { preview } from "vite";
import { scanSiteRoutes } from "./site-routes";

const port = 5178;
const tempDir = path.join("node_modules/.render");
const distDir = path.join("dist");

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

    try {
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

        const routes = (await scanSiteRoutes()).map((route) => route.path);
        const failed: string[] = [];

        for (const route of routes) {
            // 单个路由失败也要把整轮跑完再报错，否则一次只能发现一个问题
            try {
                const url = `http://localhost:${port}${route}`;
                await page.goto(url, { waitUntil: "networkidle" });
                const html = await page.content();
                // 先归一化绝对 URL，再做压缩
                await writeToDist(route, await formatHtml(normalizeLocalhostUrls(html)));
            } catch (err) {
                failed.push(route);
                console.error(`❌ 渲染失败：${route}`);
                console.error(err);
            }
        }

        if (failed.length > 0) {
            throw new Error(`${failed.length} 个路由渲染失败：\n  ${failed.join("\n  ")}`);
        }
    } finally {
        // 出错时也要关掉浏览器，否则进程会挂住
        await browser.close();
    }
}

async function writeToDist(route: string, html: string): Promise<void> {
    const outDir = path.join(tempDir, route);
    const file = path.join(outDir, "index.html");

    await fs.mkdir(outDir, { recursive: true });
    console.log(`${file}`);
    await fs.writeFile(file, html, "utf-8");
}


async function main() {
    // 上一轮失败遗留在临时目录里的文件会被一起 cp 进 dist，先清干净
    await fs.rm(tempDir, { recursive: true, force: true });

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

    try {
        await renderAll();
    } finally {
        // 渲染抛错时也要关掉预览服务器，否则进程一直不退出
        await server.close();
        console.log("Close server.");
    }

    // 将渲染结果复制到 dist 目录
    await fs.cp(tempDir, distDir, { recursive: true });
    // 清理目录
    await fs.rm(tempDir, { recursive: true });
    console.log("Move rendered files to dist.");
    console.log("Done.");
}

// 失败必须让 npm run build 停下来，避免把半成品推到 dist
main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
