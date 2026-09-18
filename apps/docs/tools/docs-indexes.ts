import fg from "fast-glob";
import fs from "node:fs/promises";
import path from "node:path";
import {
    formatDisplayDate,
    getGitLastModified,
    parseFrontmatter,
} from "./content-meta";

const contentDir = path.resolve("src/pages/docs/content");
const outputFile = path.resolve("src/pages/docs/index.json");

interface DocsEntry {
    title: string;
    description: string;
    subPath: string;
    date: string;
}

// 侧边栏与内容目录必须一一对应：漏了一边就会出现
// 「侧边栏点进去是空白页」或「文档写好了但列表里找不到」，两者都算构建失败。
async function assertSidebarMatches(files: string[]) {
    const sidebar = await fs.readFile(path.join(contentDir, "sidebar.md"), "utf-8");

    // 链接形如 [CDN 引入](./guide/cdn.md)
    const linked = new Set(
        Array.from(sidebar.matchAll(/\]\((\.\/[^)]+\.md)\)/g), (match) =>
            match[1].replace(/^\.\//, "").replace(/\.md$/, ""),
        ),
    );
    const scanned = new Set(files.map((file) => file.replace(/\.md$/, "")));

    const missingFiles = [...linked].filter((subPath) => !scanned.has(subPath));
    const missingLinks = [...scanned].filter((subPath) => !linked.has(subPath));

    if (missingFiles.length === 0 && missingLinks.length === 0) return;

    const problems = [
        missingFiles.length > 0
            ? `sidebar.md 指向不存在的文件：${missingFiles.join("、")}`
            : "",
        missingLinks.length > 0
            ? `这些文件没有出现在 sidebar.md：${missingLinks.join("、")}`
            : "",
    ].filter(Boolean);

    throw new Error(`侧边栏与内容目录不一致\n  ${problems.join("\n  ")}`);
}

async function main() {
    const files = await fg("**/*.md", {
        cwd: contentDir,
        ignore: ["sidebar.md"]
    });

    await assertSidebarMatches(files);

    const entries: DocsEntry[] = [];

    for (const file of files) {
        const fullPath = path.join(contentDir, file);
        const content = await fs.readFile(fullPath, "utf-8");

        // 解析 frontmatter
        const frontmatter = parseFrontmatter(content);

        // subPath = 去除 .md 后缀的相对路径，例如 guide/cdn
        const subPath = file.replace(/\.md$/, "");

        // date = git log 时间
        const date = formatDisplayDate(getGitLastModified(fullPath));

        entries.push({
            title: frontmatter.title || path.basename(file, ".md"),
            description: frontmatter.description || "",
            subPath,
            date,
        });
    }

    // 按 subPath 升序排列，保证输出稳定
    entries.sort((a, b) => a.subPath.localeCompare(b.subPath));

    await fs.writeFile(outputFile, JSON.stringify(entries, null, 4), "utf-8");
    console.log(`✅ 已生成 ${outputFile}，共 ${entries.length} 条记录`);
}

// 失败必须让 npm run build 停下来，否则会带着旧索引继续打包
main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
