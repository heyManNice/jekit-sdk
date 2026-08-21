import { defineConfig } from 'vite';

export default defineConfig({
    resolve: {
        tsconfigPaths: true,
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: false,
        lib: {
            entry: 'src/index.ts',
            name: 'jekit',
            formats: [
                'iife',
            ],
            fileName: () => 'jekit-cdn.min.js',
        },
        minify: true,
    },
});
