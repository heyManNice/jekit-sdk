import fg from "fast-glob";
import fs from "node:fs/promises";
import path from "node:path";
import { getGitLastModified, isDraft, parseFrontmatter } from "./content-meta";

export interface SiteRoute {
    path: string;
    type: "static" | "doc" | "blog";
    lastmod?: string;
    indexable: boolean;
}

export async function scanSiteRoutes(): Promise<SiteRoute[]> {
    const routes = new Map<string, SiteRoute>();

    const pageFiles = await fg("src/pages/**/page.tsx");
    for (const file of pageFiles) {
        const routePath = file.replace("src/pages", "").replace("/page.tsx", "") + "/";
        routes.set(routePath, {
            path: routePath,
            type: "static",
            indexable: true,
        });
    }

    const docFiles = await fg("src/pages/docs/content/*/*.md", {
        ignore: ["**/sidebar.md"],
    });
    for (const file of docFiles) {
        const routePath = "/docs/" + file
            .replace("src/pages/docs/content/", "")
            .replace(/\.md$/, "") + "/";
        routes.set(routePath, {
            path: routePath,
            type: "doc",
            lastmod: getGitLastModified(path.resolve(file)),
            indexable: true,
        });
    }

    const blogFiles = await fg("src/pages/blogs/content/**/*.md");
    for (const file of blogFiles) {
        const content = await fs.readFile(file, "utf-8");
        if (isDraft(parseFrontmatter(content))) continue;

        const filename = path.basename(file, ".md");
        const routePath = `/blogs/${filename}`;
        routes.set(routePath, {
            path: routePath,
            type: "blog",
            lastmod: getGitLastModified(path.resolve(file)),
            indexable: true,
        });
    }

    return [...routes.values()].sort((a, b) => a.path.localeCompare(b.path));
}
