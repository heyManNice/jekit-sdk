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
                    if (id.includes('node_modules')) {
                        return 'vendor';
                    }
                },
            }
        },
    }
}))
