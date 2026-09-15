import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: false,
        minify: true,
        lib: {
            entry: 'main.ts',
            formats: ['es'],
            fileName: () => 'index.js',
        },
    },
});