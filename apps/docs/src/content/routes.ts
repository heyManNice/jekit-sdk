function normalizeFilePath(file: string): string {
    return file.replaceAll("\\", "/");
}

export function pageFileToRoute(file: string): string {
    const normalized = normalizeFilePath(file);
    const marker = "src/pages";
    const markerIndex = normalized.indexOf(marker);
    if (markerIndex === -1 || !normalized.endsWith("/page.tsx")) {
        throw new Error(`无法从页面文件生成路由：${file}`);
    }
    return normalized.slice(markerIndex + marker.length).replace(/\/page\.tsx$/, "") + "/";
}

export function docFileToRoute(file: string): string {
    const normalized = normalizeFilePath(file);
    const marker = "src/pages/docs/content/";
    const markerIndex = normalized.indexOf(marker);
    if (markerIndex === -1 || !normalized.endsWith(".md")) {
        throw new Error(`无法从文档文件生成路由：${file}`);
    }
    return "/docs/" + normalized.slice(markerIndex + marker.length).replace(/\.md$/, "") + "/";
}

export function blogFilenameToRoute(filename: string): string {
    return `/blogs/${filename.replace(/\.md$/, "")}/`;
}
