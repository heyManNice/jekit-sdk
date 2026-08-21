import { useState, useEffect } from "react";
import {
    createHighlighterCore,
    type HighlighterCore
} from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

import typescript from "@shikijs/langs/typescript";
import tsx from "@shikijs/langs/tsx";
import javascript from "@shikijs/langs/javascript";
import jsx from "@shikijs/langs/jsx";
import html from "@shikijs/langs/html";
import vue from "@shikijs/langs/vue";
import githubDarkDefault from "@shikijs/themes/github-dark-default";

// Shiki 单例

let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter(): Promise<HighlighterCore> {
    if (!highlighterPromise) {
        highlighterPromise = createHighlighterCore({
            themes: [githubDarkDefault],
            langs: [typescript, tsx, javascript, jsx, html, vue],
            engine: createJavaScriptRegexEngine()
        });
    }
    return highlighterPromise;
}

// 语言别名映射

const langMap: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    jsx: "jsx",
    tsx: "tsx",
    vue: "vue"
};

// CodeBlock 组件

interface CodeBlockProps {
    lang?: string;
    children: string;
}

// 代码块高亮组件
// 直接输出 shiki 的 <pre> HTML，无额外包裹层
export function CodeBlock({ lang, children }: CodeBlockProps) {
    const [html, setHtml] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function highlight() {
            try {
                const highlighter = await getHighlighter();
                if (cancelled) return;

                const resolvedLang = langMap[lang ?? ""] ?? lang ?? "text";
                const result = highlighter.codeToHtml(children, {
                    lang: resolvedLang,
                    theme: "github-dark-default"
                });

                if (!cancelled) setHtml(result);
            } catch {
                if (!cancelled) setHtml(null);
            }
        }

        highlight();
        return () => { cancelled = true; };
    }, [lang, children]);

    // 未高亮时降级为纯文本 pre
    if (!html) {
        return (
            <pre className="code-block" data-lang={lang}>
                <code>{children}</code>
            </pre>
        );
    }

    // 直接输出 shiki 的 <pre class="shiki ...">...</pre>
    return (
        <span
            className="code-block"
            data-lang={lang}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
