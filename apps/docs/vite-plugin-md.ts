import type { Plugin } from "vite";
import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { Marked } from "marked";

import typescript from "@shikijs/langs/typescript";
import tsx from "@shikijs/langs/tsx";
import javascript from "@shikijs/langs/javascript";
import jsx from "@shikijs/langs/jsx";
import html from "@shikijs/langs/html";
import vue from "@shikijs/langs/vue";
import bash from "@shikijs/langs/bash";
import githubDarkDefault from "@shikijs/themes/github-dark-default";

// 语言别名映射
const langMap: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    jsx: "jsx",
    tsx: "tsx",
    vue: "vue",
    bash: "bash",
    sh: "bash",
    shell: "bash",
    zsh: "bash"
};

// 用 shiki 高亮代码块，输出 <pre class="shiki ...">...</pre>
function shikiCodeRenderer(
    highlighter: HighlighterCore,
    text: string,
    lang: string
): string {
    const resolvedLang = langMap[lang] ?? (lang || "text");
    const html = highlighter.codeToHtml(text, {
        lang: resolvedLang,
        theme: "github-dark-default"
    });
    // 套上 .code-block 容器以兼容 md.css 中的语言标签（::after）样式
    return `<div class="code-block" data-lang="${lang}">${html}</div>`;
}

// Vite 插件
export function vitePluginMd(): Plugin {
    let highlighter: HighlighterCore | null = null;

    return {
        name: "vite-plugin-md",

        async buildStart() {
            if (!highlighter) {
                highlighter = await createHighlighterCore({
                    themes: [githubDarkDefault],
                    langs: [typescript, tsx, javascript, jsx, html, vue, bash],
                    engine: createJavaScriptRegexEngine()
                });
            }
        },

        transform(code, id) {
            // 只处理 .md 文件
            if (!id.endsWith(".md")) return null;

            // 排除 sidebar.md（需要原始 markdown 做导航解析）
            if (id.endsWith("sidebar.md")) return null;

            // 确保高亮器已初始化
            if (!highlighter) return null;

            // 使用 marked 将 markdown 转为 HTML，并注入 shiki 高亮
            const marked = new Marked({
                renderer: {
                    code({ text, lang }: { text: string; lang?: string }) {
                        return shikiCodeRenderer(highlighter!, text, lang ?? "");
                    }
                }
            });

            // parse 是同步的（无异步扩展），但类型标注为 string | Promise<string>
            // 内容 md（博客/文档）开头有 YAML frontmatter，需先剥离再交给 marked。
            // 标题、浏览量、编译时间等元信息统一由 React 渲染，不再注入正文
            const mdBody = code.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
            const html = marked.parse(mdBody) as string;

            // 导出为默认字符串
            return {
                code: `export default ${JSON.stringify(html)};`,
                map: { mappings: "" }
            };
        }
    };
}
