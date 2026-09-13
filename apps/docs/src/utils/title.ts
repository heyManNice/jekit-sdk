import { speak } from "@/utils/aria";
import {
    setPageMeta,
    type PageMeta,
} from "@/utils/meta";

// 设置标题与页面元信息（description / OG），并把当前页面播报给读屏
export function setTitle(meta: PageMeta) {
    setPageMeta(meta);
    speak("您现在处于" + meta.title);
}