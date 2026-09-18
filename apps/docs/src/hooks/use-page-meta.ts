import { useEffect } from "react";
import { setTitle } from "@/utils/title";
import type { PageMeta } from "@/utils/meta";

// 设置页面标题与元信息
// 副作用移入 effect，避免在渲染期执行 document.title / 读屏播报
export function usePageMeta(meta: PageMeta) {
    const {
        title,
        announcement,
        description,
        image,
        type,
        publishedTime,
        modifiedTime,
        articleSection,
        articleTags,
    } = meta;
    const articleTagsKey = JSON.stringify(articleTags ?? []);
    const structuredDataKey = JSON.stringify(meta.structuredData ?? null);

    useEffect(() => {
        setTitle({
            title,
            announcement,
            description,
            image,
            type,
            publishedTime,
            modifiedTime,
            articleSection,
            articleTags: JSON.parse(articleTagsKey),
            structuredData: structuredDataKey === "null"
                ? undefined
                : JSON.parse(structuredDataKey),
        });
    }, [
        title,
        announcement,
        description,
        image,
        type,
        publishedTime,
        modifiedTime,
        articleSection,
        articleTagsKey,
        structuredDataKey,
    ]);
}
