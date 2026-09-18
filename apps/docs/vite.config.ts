import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { vitePluginMd } from './vite-plugin-md';
import { codeInspectorPlugin } from 'code-inspector-plugin';
import babel from '@rolldown/plugin-babel'
import { helloScreen } from '../hello-screen';

// https://vite.dev/config/
export default defineConfig(async () => ({
    plugins: [
        codeInspectorPlugin({
            bundler: 'vite',
        }),
        vitePluginMd(),
        react(),
        babel({ presets: [reactCompilerPreset()] }),
        tailwindcss(),
        (await import('rollup-plugin-visualizer')).visualizer({
            open: true,
            filename: 'report.html',
            gzipSize: true,
            brotliSize: true,
        }),
        helloScreen('Docs')
    ],
    resolve: {
        tsconfigPaths: true,
    },
    build: {
        assetsDir: '_',
        rollupOptions: {
            output: {
                entryFileNames: '_/[hash].js',
                chunkFileNames: '_/[hash].js',
                assetFileNames: '_/[hash][extname]',
                manualChunks: (id: string) => {
                    const moduleId = id.replaceAll('\\', '/');
                    if (!moduleId.includes('/node_modules/')) return;

                    // 图表只用于统计页，避免文档和博客加载整套 Chart.js。
                    if (/\/node_modules\/(chart\.js|react-chartjs-2)\//.test(moduleId)) {
                        return 'charts';
                    }
                    if (moduleId.includes('/node_modules/framer-motion/')) {
                        return 'motion';
                    }
                    if (moduleId.includes('/node_modules/lucide-react/')) {
                        return 'icons';
                    }
                    if (/\/node_modules\/(react|react-dom|react-router|scheduler)\//.test(moduleId)) {
                        return 'react';
                    }
                    return 'vendor';
                },
            }
        },
    }
}))
