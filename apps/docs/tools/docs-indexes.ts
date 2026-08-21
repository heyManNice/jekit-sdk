import fg from "fast-glob";
import fs from "node:fs/promises";
import path from "node:path";
import { statSync } from "node:fs";
import { execSync } from "node:child_process";

const contentDir = path.resolve("src/pages/docs/content");
const outputFile = path.resolve("src/pages/docs/index.json");

interface DocsEntry {
    title: string;
    subPath: string;
    date: string;
}

// 解析 YAML frontmatter，提取 title
function parseFrontmatter(
    content: string,
): { title?: string } {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return {};

    const frontmatter: Record<string, string> = {};
    const lines = match[1].split("\n");
    for (const line of lines) {
        const sepIndex = line.indexOf(":");
        if (sepIndex === -1) continue;
        const key = line.slice(0, sepIndex).trim();
        const value = line.slice(sepIndex + 1).trim();
        frontmatter[key] = value;
    }
    return frontmatter;
}

// 通过 git log 获取文件日期，失败时回退到文件 mtime
function getGitDate(filePath: string): string {
    try {
        const relativePath = path.relative(process.cwd(), filePath);
        const output = execSync(
            `git log -1 --format="%ci" -- "${relativePath}"`,
            { encoding: "utf-8", cwd: process.cwd() },
        ).trim();

        if (output) {
            // "%ci" 格式: "2026-07-04 18:26:47 +0800" → "2026-07-04 18:26"
            const parts = output.split(" ");
            const dateTime = parts.slice(0, 2).join(" ");
            // 去掉秒数 "18:26:47" → "18:26"
            return dateTime.replace(/(\d{2}:\d{2}):\d{2}$/, "$1");
        }
    } catch {
        // git 命令失败，回退到文件修改时间
    }

    // 回退方案：使用文件的修改时间
    const stats = statSync(filePath);
    const d = new Date(stats.mtime);
    return (
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ` +
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
    );
}

async function main() {
    const files = await fg("**/*.md", {
        cwd: contentDir,
        ignore: ["sidebar.md"]
    });

    const entries: DocsEntry[] = [];

    for (const file of files) {
        const fullPath = path.join(contentDir, file);
        const content = await fs.readFile(fullPath, "utf-8");

        // 解析 frontmatter
        const frontmatter = parseFrontmatter(content);

        // subPath = 去除 .md 后缀的相对路径，例如 guide/cdn
        const subPath = file.replace(/\.md$/, "");

        // date = git log 时间
        const date = getGitDate(fullPath);

        entries.push({
            title: frontmatter.title || path.basename(file, ".md"),
            subPath,
            date,
        });
    }

    // 按 subPath 升序排列，保证输出稳定
    entries.sort((a, b) => a.subPath.localeCompare(b.subPath));

    await fs.writeFile(outputFile, JSON.stringify(entries, null, 4), "utf-8");
    console.log(`✅ 已生成 ${outputFile}，共 ${entries.length} 条记录`);
}

main().catch(console.error);
