// ESLint 配置
//
// 只开 hooks 与未使用变量相关的三条规则，它们分别对应已经造成过真实问题的缺陷：
// - react-hooks/rules-of-hooks：条件调用 hooks 会让 React 直接抛错、整页崩白
// - react-hooks/exhaustive-deps：依赖写漏会导致闭包读到旧值
// - @typescript-eslint/no-unused-vars：重构后残留的未使用导入/变量
//
// 其余风格类规则不在这里约束（没有 Prettier，也不打算一次性引入大量噪声）。
// 目前只覆盖 apps/docs：packages/* 是发布出去的工具库，是否纳入需要单独决策。
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default [
    {
        ignores: [
            "**/node_modules/**",
            "**/dist/**",
            "**/report.html",
            "**/index.json",
        ],
    },
    {
        files: ["apps/docs/**/*.{ts,tsx}"],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: { jsx: true },
            },
        },
        plugins: {
            "@typescript-eslint": tseslint.plugin,
            "react-hooks": reactHooks,
        },
        rules: {
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    // 异常变量常常用不上，不为此产生噪声
                    caughtErrors: "none",
                },
            ],
        },
    },
];
