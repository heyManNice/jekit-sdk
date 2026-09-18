import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";
import path from "node:path";

export type Frontmatter = Record<string, string>;

export function parseFrontmatter(content: string): Frontmatter {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return {};

    const frontmatter: Frontmatter = {};
    for (const line of match[1].split("\n")) {
        const separator = line.indexOf(":");
        if (separator === -1) continue;

        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim();
        frontmatter[key] = value;
    }

    return frontmatter;
}

export function isDraft(frontmatter: Frontmatter): boolean {
    return frontmatter.draft?.toLowerCase() === "true";
}

export function getGitLastModified(filePath: string): string {
    try {
        const relativePath = path.relative(process.cwd(), filePath);
        const output = execFileSync(
            "git",
            ["log", "-1", "--format=%cI", "--", relativePath],
            { encoding: "utf-8", cwd: process.cwd() },
        ).trim();

        if (output) return output;
    } catch {
        // Git 信息不可用时使用文件修改时间。
    }

    return statSync(filePath).mtime.toISOString();
}

export function formatDisplayDate(isoDate: string): string {
    return isoDate.replace("T", " ").slice(0, 16);
}

export function inferPublishedDate(filename: string, frontmatter: Frontmatter): string {
    if (frontmatter.date) return frontmatter.date;

    const match = filename.match(/^(\d{4})(\d{2})(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;

    return "";
}
