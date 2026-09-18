import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { vitePluginMd } from './vite-plugin-md';
import { codeInspectorPlugin } from 'code-inspector-plugin';
import babel from '@rolldown/plugin-babel'
import { helloScreen } from '../hello-screen';

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
    const analyze = process.env.ANALYZE === "true";
    const analyzePlugin = analyze
        ? (await import('rollup-plugin-visualizer')).visualizer({
            open: true,
            filename: 'report.html',
            gzipSize: true,
            brotliSize: true,
        })
        : null;

    return ({
    plugins: [
        mode === "development" && codeInspectorPlugin({
            bundler: 'vite',
        }),
        vitePluginMd(),
        react(),
        babel({ presets: [reactCompilerPreset()] }),
        tailwindcss(),
        analyzePlugin,
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
                codeSplitting: {
                    groups: [
                        // 高优先级先固定 React 基础设施，防止它被图表组递归吸收。
                        {
                            name: 'react',
                            test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
                            priority: 100,
                        },
                        {
                            name: 'charts',
                            test: /node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/,
                            priority: 90,
                            entriesAware: true,
                        },
                        {
                            name: 'motion',
                            test: /node_modules[\\/]framer-motion[\\/]/,
                            priority: 80,
                            entriesAware: true,
                        },
                        {
                            name: 'icons',
                            test: /node_modules[\\/]lucide-react[\\/]/,
                            priority: 70,
                            entriesAware: true,
                        },
                        {
                            name: 'vendor',
                            test: /node_modules[\\/]/,
                            priority: 1,
                            entriesAware: true,
                        },
                    ],
                },
            }
        },
    }
    });
})
