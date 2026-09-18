import fg from "fast-glob";
import fs from "node:fs/promises";
import path from "node:path";
import {
    formatDisplayDate,
    getGitLastModified,
    inferPublishedDate,
    isDraft,
    parseFrontmatter,
} from "./content-meta";

const contentDir = path.resolve("src/pages/blogs/content");
const outputFile = path.resolve("src/pages/blogs/index.json");

interface BlogEntry {
    title: string;
    description: string;
    keywords: string;
    type: string;
    filename: string;
    date: string;
    publishedDate: string;
    modifiedDate: string;
    cover: string | null;
}

// 提取 Markdown 正文中第一张图片的地址
function extractFirstImage(content: string): string | null {
    // 匹配 ![alt](url) 语法
    const imgRegex = /!\[.*?\]\((.+?)\)/;
    const match = content.match(imgRegex);
    return match ? match[1] : null;
}

async function main() {
    const files = await fg("**/*.md", { cwd: contentDir });

    const entries: BlogEntry[] = [];

    for (const file of files) {
        const fullPath = path.join(contentDir, file);
        const content = await fs.readFile(fullPath, "utf-8");

        // 解析 frontmatter
        const frontmatter = parseFrontmatter(content);
        if (isDraft(frontmatter)) continue;

        // type = content 目录下的第一层文件夹名（post / show / tech …）
        const type = file.split("/")[0];

        // filename = 仅文件名
        const filename = path.basename(file);

        // date = git log 时间
        const modifiedDate = getGitLastModified(fullPath);
        const date = formatDisplayDate(modifiedDate);
        const publishedDate = inferPublishedDate(filename, frontmatter);

        // cover = 正文第一张图片地址，无封面时使用默认封面图
        const cover = extractFirstImage(content) ?? "/images/default-cover.webp";

        entries.push({
            title: frontmatter.title || filename,
            description: frontmatter.description || "",
            keywords: frontmatter.keywords || "",
            type,
            filename,
            date,
            publishedDate,
            modifiedDate,
            cover,
        });
    }

    // 按日期降序排列
    entries.sort((a, b) => b.date.localeCompare(a.date));

    await fs.writeFile(outputFile, JSON.stringify(entries, null, 4), "utf-8");
    console.log(`✅ 已生成 ${outputFile}，共 ${entries.length} 条记录`);
}

// 失败必须让 npm run build 停下来，否则会带着旧索引继续打包
main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
