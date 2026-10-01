// 静态资源导入：Remotion 的 webpack 会把它们处理成 URL
declare module '*.svg' {
    const src: string;
    export default src;
}

declare module '*.webp' {
    const src: string;
    export default src;
}

// jekit-core 源码中读取了 import.meta.env（由 Vite 注入），
// 视频工程会经由 badge 的类型导入间接检查到它，这里补一个最小声明。
interface ImportMeta {
    readonly env: Record<string, string | undefined>;
}
